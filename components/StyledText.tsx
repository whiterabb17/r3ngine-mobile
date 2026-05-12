import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}

export function TitleText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'Bangers' }]} />;
}
