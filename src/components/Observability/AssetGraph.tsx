import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator,
  PanResponder,
  Animated
} from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
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
  Info
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
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef<number>(null);

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

      setData(graphData);
      initializePhysics(graphData);
    } catch (err) {
      console.error('Failed to load graph data:', err);
      setError('Failed to load graph visualization');
    } finally {
      setLoading(false);
    }
  };

  const initializePhysics = (graphData: GraphData) => {
    const initialNodes = graphData.nodes.map((n, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      const radius = 50 + Math.random() * 100;
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
      if (alpha < 0.01) return;

      // Force logic
      currentNodes.forEach(node => {
        // Centering force
        node.vx += (CENTER - node.x) * 0.01 * alpha;
        node.vy += (CENTER - node.y) * 0.01 * alpha;

        // Repulsion
        currentNodes.forEach(other => {
          if (node === other) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          if (distance < 200) {
            const force = (200 - distance) * 0.05 * alpha;
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
          const force = (distance - 80) * 0.05 * alpha;
          source.vx += (dx / distance) * force;
          source.vy += (dy / distance) * force;
          target.vx -= (dx / distance) * force;
          target.vy -= (dy / distance) * force;
        }
      });

      // Apply velocity
      currentNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.9; // Friction
        node.vy *= 0.9;
      });

      alpha *= 0.98;
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

      <View style={styles.graphWrapper}>
        <Svg width={GRAPH_SIZE} height={GRAPH_SIZE} style={{ transform: [{ scale: zoom }] }}>
          {/* Edges */}
          {data?.edges.map((edge, i) => {
            const source = nodes.find(n => n.data.id === edge.data.source);
            const target = nodes.find(n => n.data.id === edge.data.target);
            if (!source || !target) return null;
            return (
              <Line
                key={`edge-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={Theme.colors.border}
                strokeWidth="1"
                opacity={0.5}
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
          </View>
        </View>
      )}
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
    bottom: 20,
    left: 20,
    right: 20,
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
  }
});
