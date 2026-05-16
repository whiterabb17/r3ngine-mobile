import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator,
  PanResponder,
  Animated,
  ScrollView
} from 'react-native';
import Svg, { 
  Circle, 
  Line, 
  G, 
  Text as SvgText, 
  Defs, 
  Marker, 
  Polygon 
} from 'react-native-svg';
import { Theme } from '../../constants/Theme';
import { observabilityApi, GraphData, GraphNode } from '../../api/observability';
import { 
  Target, 
  Globe, 
  Server, 
  ShieldAlert, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  Info,
  MoreHorizontal,
  LayoutGrid,
  FileCode
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AssetGraphProps {
  scanId?: number;
  targetId?: number;
}

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  data: GraphNode;
}

const { width, height } = Dimensions.get('window');
const GRAPH_SIZE = Math.min(width, height) * 1.5;
const CENTER = GRAPH_SIZE / 2;

export default function AssetGraph({ scanId, targetId }: AssetGraphProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GraphData | null>(null);
  const [nodes, setNodes] = useState<NodePosition[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number>(null);

  // Panning State
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastOffset.current.x,
          y: lastOffset.current.y
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Extract internal values safely
        // @ts-ignore
        lastOffset.current = { x: pan.x._value, y: pan.y._value };
      },
    })
  ).current;

  useEffect(() => {
    loadData();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [scanId, targetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      let graphData: GraphData;
      if (scanId) {
        graphData = await observabilityApi.getScanGraph(scanId);
      } else if (targetId) {
        graphData = await observabilityApi.getTargetGraph(targetId);
      } else {
        throw new Error('No ID provided');
      }

      const optimized = optimizeData(graphData);
      setTotalNodes(graphData.nodes.length);
      setData(optimized);
      initializePhysics(optimized);
    } catch (err) {
      console.error('Failed to load graph data:', err);
      setError('Failed to load graph visualization');
    } finally {
      setLoading(false);
    }
  };

  const optimizeData = (raw: GraphData): GraphData => {
    // 1. Merge nodes by Label + Type (Consolidate duplicates like "403 Forbidden")
    const mergedNodeMap = new Map<string, GraphNode>();
    const idToMergedId = new Map<string, string>();
    
    raw.nodes.forEach(n => {
      const node = n.data;
      const key = `${node.type}|${node.label.toLowerCase()}`;
      
      if (mergedNodeMap.has(key)) {
        const existing = mergedNodeMap.get(key)!;
        idToMergedId.set(node.id, existing.id);
        existing.criticalVulnCount = (existing.criticalVulnCount || 0) + (node.criticalVulnCount || 0);
        existing.highVulnCount = (existing.highVulnCount || 0) + (node.highVulnCount || 0);
        existing.severity = Math.max(existing.severity, node.severity);
      } else {
        const newNode = { ...node };
        mergedNodeMap.set(key, newNode);
        idToMergedId.set(node.id, node.id);
      }
    });
    
    const nodesAfterMerging = Array.from(mergedNodeMap.values());
    const edgesAfterMerging = raw.edges.map(edge => ({
      data: {
        ...edge.data,
        source: idToMergedId.get(edge.data.source) || edge.data.source,
        target: idToMergedId.get(edge.data.target) || edge.data.target
      }
    })).filter(e => e.data.source !== e.data.target); // Remove self-loops from merging
    
    // 2. Identify subdomains for clustering
    const subdomainClusters = new Map<string, GraphNode[]>();
    const subdomains = nodesAfterMerging.filter(n => n.type === 'subdomain');
    const nonSubdomains = nodesAfterMerging.filter(n => n.type !== 'subdomain');
    
    subdomains.forEach(sub => {
      // Create a fingerprint based on neighbors (IPs, Vulns, Tech)
      const neighbors = edgesAfterMerging
        .filter(e => e.data.source === sub.id || e.data.target === sub.id)
        .map(e => e.data.source === sub.id ? e.data.target : e.data.source)
        .filter(id => {
          const node = nodesAfterMerging.find(n => n.id === id);
          return node && node.type !== 'target';
        })
        .sort();
        
      const fingerprint = neighbors.join('|') || 'standalone';
      if (!subdomainClusters.has(fingerprint)) {
        subdomainClusters.set(fingerprint, []);
      }
      subdomainClusters.get(fingerprint)!.push(sub);
    });
    
    let nodesAfterClustering: GraphNode[] = [...nonSubdomains];
    let edgesAfterClustering = [...edgesAfterMerging];
    
    subdomainClusters.forEach((group, fingerprint) => {
      if (group.length > 2) { // Cluster if more than 2 similar assets
        const clusterId = `cluster-${fingerprint}`;
        const clusterNode: GraphNode = {
          id: clusterId,
          label: `${group.length} ASSETS`,
          type: 'cluster',
          color: Theme.colors.info,
          severity: Math.max(...group.map(n => n.severity)),
          members: group.map(n => n.label).sort()
        };
        nodesAfterClustering.push(clusterNode);
        
        // Remap edges from members to the cluster
        const memberIds = new Set(group.map(n => n.id));
        edgesAfterClustering = edgesAfterClustering.map(edge => {
          let newSource = edge.data.source;
          let newTarget = edge.data.target;
          if (memberIds.has(newSource)) newSource = clusterId;
          if (memberIds.has(newTarget)) newTarget = clusterId;
          return { data: { ...edge.data, source: newSource, target: newTarget } };
        });
      } else {
        nodesAfterClustering.push(...group);
      }
    });

    // 3. Cluster Endpoints (Site Files / JS / CSS)
    const endpoints = nodesAfterClustering.filter(n => n.type === 'endpoint');
    let finalNodes: GraphNode[] = nodesAfterClustering.filter(n => n.type !== 'endpoint');
    let finalEdges = [...edgesAfterClustering];
    
    const endpointClustersByParent = new Map<string, GraphNode[]>();
    endpoints.forEach(ep => {
      const parentEdge = finalEdges.find(e => e.data.target === ep.id);
      const parentId = parentEdge ? parentEdge.data.source : 'orphan';
      if (!endpointClustersByParent.has(parentId)) {
        endpointClustersByParent.set(parentId, []);
      }
      endpointClustersByParent.get(parentId)!.push(ep);
    });
    
    endpointClustersByParent.forEach((group, parentId) => {
      if (group.length > 2) {
        const clusterId = `files-${parentId}`;
        finalNodes.push({
          id: clusterId,
          label: `${group.length} SITE FILES`,
          type: 'file-cluster',
          color: Theme.colors.surface,
          severity: 0,
          members: group.map(n => n.label).sort()
        });
        
        const memberIds = new Set(group.map(n => n.id));
        finalEdges = finalEdges.filter(e => !memberIds.has(e.data.target));
        if (parentId !== 'orphan') {
          finalEdges.push({ data: { source: parentId, target: clusterId, label: 'files' } });
        }
      } else {
        finalNodes.push(...group);
      }
    });

    // 4. Map Subdomain Relationships to Metadata Nodes
    finalNodes.forEach(node => {
      if (node.type !== 'subdomain' && node.type !== 'cluster' && node.type !== 'target' && node.type !== 'file-cluster') {
        const connectedSubdomains = finalEdges
          .filter(e => e.data.source === node.id || e.data.target === node.id)
          .map(e => {
             const neighborId = e.data.source === node.id ? e.data.target : e.data.source;
             return finalNodes.find(n => n.id === neighborId);
          })
          .filter(n => n && (n.type === 'subdomain' || n.type === 'cluster'))
          .flatMap(n => n!.type === 'cluster' ? (n!.members || []) : [n!.label]);
          
        if (connectedSubdomains.length > 0) {
          node.members = Array.from(new Set(connectedSubdomains)).sort();
        }
      }
    });

    // 5. Score nodes by importance and enforce colors
    const scoredNodes = finalNodes.map(node => {
      // Enforce colors for visual consistency with legend
      const type = node.type.toLowerCase();
      if (type === 'target' || type === 'subdomain' || type === 'domain' || type === 'endpoint') {
        node.color = Theme.colors.secondary;
      } else if (type === 'vulnerability' || type === 'finding' || type === 'vuln') {
        node.color = Theme.colors.error;
      } else if (type === 'ip' || type === 'cluster' || type === 'host' || type === 'service' || type === 'infra' || type === 'asset' || type === 'technology') {
        node.color = Theme.colors.info;
      } else if (type === 'file-cluster' || type === 'overflow') {
        node.color = Theme.colors.surface;
      } else {
        node.color = Theme.colors.info; // Default to Infra for unknown types
      }

      let score = 0;
      if (node.type === 'target') score += 5000;
      if (node.type === 'vulnerability') score += 1000;
      if (node.type === 'cluster') score += 800;
      if (node.type === 'file-cluster') score += 500;
      score += (node.criticalVulnCount || 0) * 500;
      score += (node.highVulnCount || 0) * 200;
      if (node.severity) score += (node.severity + 1) * 100;
      score += Math.random() * 10;
      return { node, score };
    });
    
    // 6. Filter and limit (max 50)
    scoredNodes.sort((a, b) => b.score - a.score);
    const keptNodes = scoredNodes.slice(0, 50).map(sn => sn.node);
    
    // 7. Handle Overflow Summary
    if (finalNodes.length > 50) {
      const othersCount = finalNodes.length - 50;
      keptNodes.push({
        id: 'overflow-node',
        label: `+${othersCount} OTHERS`,
        type: 'overflow',
        color: Theme.colors.surface,
        severity: 0
      });
    }

    const keptNodeIds = new Set(keptNodes.map(n => n.id));
    
    // 8. Filter edges
    const keptEdges = finalEdges.filter(edge => 
      keptNodeIds.has(edge.data.source) && keptNodeIds.has(edge.data.target)
    );
    
    // 9. Link overflow to target
    if (keptNodeIds.has('overflow-node')) {
      const targetNode = keptNodes.find(n => n.type === 'target');
      if (targetNode) {
        keptEdges.push({
          data: {
            source: targetNode.id,
            target: 'overflow-node',
            label: 'overflow'
          }
        });
      }
    }

    // 10. Final Deduplicate edges
    const edgeMap = new Set<string>();
    const uniqueEdges = keptEdges.filter(edge => {
      const key = `${edge.data.source}-${edge.data.target}`;
      if (edgeMap.has(key)) return false;
      edgeMap.add(key);
      return true;
    });
    
    return {
      nodes: keptNodes.map(n => ({ data: n })),
      edges: uniqueEdges
    };
  };

  const initializePhysics = (graphData: GraphData) => {
    const initialNodes = graphData.nodes.map((n, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      const radius = 30 + Math.random() * 50;
      return {
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        data: n.data
      };
    });
    setNodes(initialNodes);
    startSimulation(initialNodes, graphData.edges);
  };

  const startSimulation = (initialNodes: NodePosition[], edges: any[]) => {
    let currentNodes = [...initialNodes];
    let alpha = 1;

    const tick = () => {
      if (alpha < 0.01) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        return;
      }

      // Force logic
      currentNodes.forEach(node => {
        // Centering force - slightly weaker to allow spread
        node.vx += (CENTER - node.x) * 0.005 * alpha;
        node.vy += (CENTER - node.y) * 0.005 * alpha;

        // Repulsion - reduced radius and force
        currentNodes.forEach(other => {
          if (node === other) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          if (distance < 120) {
            const force = (120 - distance) * 0.02 * alpha;
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        });
      });

      // Edge forces (attraction)
      edges.forEach(edge => {
        const source = currentNodes.find(n => n.data.id === edge.data.source);
        const target = currentNodes.find(n => n.data.id === edge.data.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          // Target distance reduced for tighter clusters
          const force = (distance - 60) * 0.04 * alpha;
          source.vx += (dx / distance) * force;
          source.vy += (dy / distance) * force;
          target.vx -= (dx / distance) * force;
          target.vy -= (dy / distance) * force;
        }
      });

      // Apply velocity and damping
      currentNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.75; // Increased friction from 0.9 to 0.75 for stability
        node.vy *= 0.75;
      });

      alpha *= 0.96; // Cool down slightly faster
      setNodes([...currentNodes]);
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
  };

  const getNodeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'target': return <Target size={16} color="white" />;
      case 'subdomain': return <Globe size={16} color="white" />;
      case 'ip': return <Server size={16} color="white" />;
      case 'vulnerability': return <ShieldAlert size={16} color={Theme.colors.error} />;
      case 'overflow': return <MoreHorizontal size={16} color="white" />;
      case 'cluster': return <LayoutGrid size={16} color={Theme.colors.info} />;
      case 'file-cluster': return <FileCode size={16} color="white" />;
      default: return <Info size={16} color="white" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>CALCULATING ASSET TOPOLOGY...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <RefreshCw size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ASSET RELATIONSHIP GRAPH</Text>
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setZoom(z => Math.min(z + 0.2, 3))} style={styles.controlBtn}>
            <ZoomIn size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setZoom(z => Math.max(z - 0.2, 0.5))} style={styles.controlBtn}>
            <ZoomOut size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadData} style={styles.controlBtn}>
            <RefreshCw size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.graphWrapper} {...panResponder.panHandlers}>
        <Animated.View style={{
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: zoom }
          ]
        }}>
          <Svg width={GRAPH_SIZE} height={GRAPH_SIZE}>
            <Defs>
              <Marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <Polygon points="0 0, 8 4, 0 8" fill={Theme.colors.primary} />
              </Marker>
            </Defs>
            
            {/* Edges */}
            {data?.edges.map((edge, i) => {
              const source = nodes.find(n => n.data.id === edge.data.source);
              const target = nodes.find(n => n.data.id === edge.data.target);
              if (!source || !target) return null;
              
              // Calculate points to end at the edge of the circle
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const targetR = target.data.type === 'target' ? 22 : 14;

              return (
                <Line
                  key={`edge-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x - (dx / dist) * targetR}
                  y2={target.y - (dy / dist) * targetR}
                  stroke={Theme.colors.border}
                  strokeWidth="1"
                  opacity={0.6}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => (
              <G 
                key={`node-${i}`} 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedNode(node.data);
                }}
              >
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={node.data.type === 'target' ? 20 : 12}
                  fill={selectedNode?.id === node.data.id ? Theme.colors.primary : (node.data.color || Theme.colors.surface)}
                  stroke={Theme.colors.primary}
                  strokeWidth={selectedNode?.id === node.data.id ? 2 : 0}
                />
                <SvgText
                  x={node.x}
                  y={node.y + 25}
                  fill="white"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="Bangers"
                >
                  {node.data.label.length > 15 ? node.data.label.substring(0, 12) + '...' : node.data.label}
                </SvgText>
              </G>
            ))}
          </Svg>
        </Animated.View>
        
        {totalNodes > nodes.length && (
          <View style={styles.optimizationNotice}>
            <Info size={12} color={Theme.colors.textMuted} />
            <Text style={styles.optimizationText}>
              TOP 50 OF {totalNodes} ASSETS VISUALIZED
            </Text>
          </View>
        )}
      </View>

      {selectedNode && (
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            {getNodeIcon(selectedNode.type)}
            <Text style={styles.detailsTitle}>{selectedNode.label.toUpperCase()}</Text>
            <TouchableOpacity onPress={() => setSelectedNode(null)}>
              <Text style={{ color: Theme.colors.textMuted }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailsBody}>
            <Text style={styles.detailItem}>TYPE: {selectedNode.type.toUpperCase()}</Text>
            {selectedNode.criticalVulnCount !== undefined && (
              <Text style={[styles.detailItem, { color: Theme.colors.error }]}>
                CRITICAL VULNS: {selectedNode.criticalVulnCount}
              </Text>
            )}
            {selectedNode.highVulnCount !== undefined && (
              <Text style={[styles.detailItem, { color: Theme.colors.warning }]}>
                HIGH VULNS: {selectedNode.highVulnCount}
              </Text>
            )}
            
            {selectedNode.members && (
              <View style={styles.memberListWrapper}>
                <Text style={styles.memberListTitle}>
                  {selectedNode.type === 'cluster' ? 'GROUPED ASSETS:' : 'CONNECTED ASSETS:'}
                </Text>
                <ScrollView style={styles.memberList} nestedScrollEnabled>
                  {selectedNode.members.map((member, i) => (
                    <Text key={i} style={styles.memberItem}>• {member}</Text>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}
      
      {/* Legend Footer */}
      <View style={styles.legendContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legendContent}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Theme.colors.secondary }]} />
            <Text style={styles.legendText}>DISCOVERY</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Theme.colors.info }]} />
            <Text style={styles.legendText}>INFRA/CLUSTER</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Theme.colors.error }]} />
            <Text style={styles.legendText}>RISK/VULN</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Theme.colors.surface }]} />
            <Text style={styles.legendText}>FILES</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    fontSize: 18,
  },
  controls: {
    flexDirection: 'row',
  },
  controlBtn: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  graphWrapper: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    position: 'absolute',
    bottom: 75, // Increased to sit above padded legend
    left: 16,
    right: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsTitle: {
    flex: 1,
    color: 'white',
    fontFamily: 'Bangers',
    fontSize: 16,
    marginLeft: 10,
  },
  detailsBody: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: 12,
  },
  detailItem: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  loadingText: {
    color: Theme.colors.textMuted,
    marginTop: 16,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  errorText: {
    color: Theme.colors.error,
    fontFamily: 'Bangers',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontFamily: 'Bangers',
  },
  optimizationNotice: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optimizationText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  memberListWrapper: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  memberListTitle: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Bangers',
    marginBottom: 8,
  },
  memberList: {
    maxHeight: 120,
  },
  memberItem: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  legendContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingTop: 10,
    paddingBottom: 28, // Added bottom padding for home indicator
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    zIndex: 10,
  },
  legendContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    height: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  legendText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  }
});
