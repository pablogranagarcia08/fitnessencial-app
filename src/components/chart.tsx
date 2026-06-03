import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, font } from '@/lib/theme';
import { Txt } from './ui';

interface Point { x: number; y: number }

// Gráfico de líneas minimalista con react-native-svg (sin dependencias nativas extra).
export function LineChart({ data, width, height = 180, unit = '' }: { data: Point[]; width: number; height?: number; unit?: string }) {
  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Txt variant="mute">Necesitas al menos 2 registros para ver la evolución.</Txt>
      </View>
    );
  }

  const padL = 38;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const w = width;
  const h = height;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = maxY - minY || 1;
  const pad = range * 0.15;
  const lo = minY - pad;
  const hi = maxY + pad;

  const sx = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const sy = (val: number) => padT + innerH - ((val - lo) / (hi - lo)) * innerH;

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(d.y)}`).join(' ');
  const area = `${path} L ${sx(data.length - 1)} ${padT + innerH} L ${sx(0)} ${padT + innerH} Z`;

  const gridVals = [hi, (hi + lo) / 2, lo];

  return (
    <Svg width={w} height={h}>
      {gridVals.map((gv, i) => (
        <React.Fragment key={i}>
          <Line x1={padL} y1={sy(gv)} x2={w - padR} y2={sy(gv)} stroke={colors.line} strokeWidth={1} />
          <SvgText x={padL - 6} y={sy(gv) + 4} fill={colors.mute} fontSize={10} textAnchor="end">
            {gv.toFixed(0)}
          </SvgText>
        </React.Fragment>
      ))}
      <Path d={area} fill={colors.accent} opacity={0.08} />
      <Path d={path} stroke={colors.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <Circle key={i} cx={sx(i)} cy={sy(d.y)} r={3.5} fill={colors.bg} stroke={colors.accent} strokeWidth={2} />
      ))}
      <SvgText x={sx(data.length - 1)} y={sy(data[data.length - 1].y) - 10} fill={colors.ink} fontSize={12} fontWeight={font.bold} textAnchor="end">
        {data[data.length - 1].y}
        {unit}
      </SvgText>
    </Svg>
  );
}
