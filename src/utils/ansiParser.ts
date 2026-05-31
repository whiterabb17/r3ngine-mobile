import { TextStyle } from 'react-native';

export interface AnsiSegment {
  text: string;
  style: TextStyle;
}

const FG: Record<number, string> = {
  30: '#000000', 31: '#CC3333', 32: '#33CC33', 33: '#CCCC33',
  34: '#5555FF', 35: '#CC33CC', 36: '#33CCCC', 37: '#CCCCCC',
  90: '#666666', 91: '#FF5555', 92: '#55FF55', 93: '#FFFF55',
  94: '#6699FF', 95: '#FF55FF', 96: '#55FFFF', 97: '#FFFFFF',
};

const BG: Record<number, string> = {
  40: '#000000', 41: '#CC3333', 42: '#33CC33', 43: '#CCCC33',
  44: '#5555FF', 45: '#CC33CC', 46: '#33CCCC', 47: '#CCCCCC',
  100: '#666666', 101: '#FF5555', 102: '#55FF55', 103: '#FFFF55',
  104: '#6699FF', 105: '#FF55FF', 106: '#55FFFF', 107: '#FFFFFF',
};

const ANSI_RE = /\x1b\[([0-9;]*)m/g;

export function parseAnsi(text: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  let lastIndex = 0;
  let color: string | undefined;
  let bgColor: string | undefined;
  let bold = false;
  let italic = false;

  const buildStyle = (): TextStyle => {
    const s: TextStyle = {};
    if (color) s.color = color;
    if (bgColor) s.backgroundColor = bgColor;
    if (bold) s.fontWeight = 'bold';
    if (italic) s.fontStyle = 'italic';
    return s;
  };

  ANSI_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ANSI_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), style: buildStyle() });
    }
    const codes = match[1] === '' ? [0] : match[1].split(';').map(Number);
    for (const code of codes) {
      if (code === 0)       { color = undefined; bgColor = undefined; bold = false; italic = false; }
      else if (code === 1)  { bold = true; }
      else if (code === 22) { bold = false; }
      else if (code === 3)  { italic = true; }
      else if (code === 23) { italic = false; }
      else if (code === 39) { color = undefined; }
      else if (code === 49) { bgColor = undefined; }
      else if (FG[code])    { color = FG[code]; }
      else if (BG[code])    { bgColor = BG[code]; }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), style: buildStyle() });
  }
  if (segments.length === 0) {
    segments.push({ text, style: {} });
  }
  return segments;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
