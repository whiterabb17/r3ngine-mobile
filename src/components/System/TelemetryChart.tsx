import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, G, Line, Circle } from 'react-native-svg';
import { Theme } from '../../constants/Theme';

interface TelemetryChartProps {
  data: number[];
  label: string;
  color: string;
  unit?: string;
  maxValue?: number;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;
const CHART_HEIGHT = 120;

export default function TelemetryChart({ data, label, color, unit = '', maxValue }: TelemetryChartProps) {
  if (!data || data.length === 0) return null;

  const effectiveMax = maxValue || Math.max(...data, 1) * 1.2;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - (val / effectiveMax) * CHART_HEIGHT;
    return `${x},${y}`;
  }).join(' ');

  const latestValue = data[data.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <Text style={[styles.value, { color }]}>
          {latestValue.toFixed(1)}{unit}
        </Text>
      </View>
      
      <View style={styles.chartArea}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grid Lines */}
          <Line x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke={Theme.colors.border} strokeWidth="1" />
          <Line x1="0" y1="0" x2="0" y2={CHART_HEIGHT} stroke={Theme.colors.border} strokeWidth="1" />
          
          {/* Main Line */}
          <Polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Latest Point */}
          {data.length > 0 && (
            <Circle
              cx={CHART_WIDTH}
              cy={CHART_HEIGHT - (latestValue / effectiveMax) * CHART_HEIGHT}
              r="4"
              fill={color}
            />
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  value: {
    fontSize: 18,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  chartArea: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
  },
});
