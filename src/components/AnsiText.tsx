import React from 'react';
import { Text, TextStyle } from 'react-native';
import { parseAnsi } from '../utils/ansiParser';

interface AnsiTextProps {
  text: string;
  style?: TextStyle | TextStyle[];
}

export default function AnsiText({ text, style }: AnsiTextProps) {
  const segments = parseAnsi(text);
  if (segments.length === 1 && Object.keys(segments[0].style).length === 0) {
    return <Text style={style}>{text}</Text>;
  }
  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text key={i} style={seg.style}>{seg.text}</Text>
      ))}
    </Text>
  );
}
