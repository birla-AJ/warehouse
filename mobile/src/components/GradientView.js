import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { gradients } from '../theme/theme';

/**
 * Renders a multi-stop linear gradient using react-native-svg (already a
 * dependency — no new native module needed). Pass `colors` as a hex array,
 * or `preset` to reuse one of the named gradients from theme.js.
 */
export function GradientView({ colors, preset = 'brand', direction = 'diagonal', style, children }) {
  const stops = colors ?? gradients[preset] ?? gradients.brand;
  const [x1, y1, x2, y2] =
    direction === 'horizontal' ? ['0', '0', '1', '0'] : direction === 'vertical' ? ['0', '0', '0', '1'] : ['0', '0', '1', '1'];

  return (
    <View style={[styles.container, style]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="grad" x1={x1} y1={y1} x2={x2} y2={y2}>
            {stops.map((c, i) => (
              <Stop key={c + i} offset={`${(i / Math.max(stops.length - 1, 1)) * 100}%`} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
