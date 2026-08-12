import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';

/** Same warehouse-in-a-badge mark used on the admin dashboard, for a consistent brand across platforms. */
export function AwmsMark({ size = 56, rounded = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#0B1F1A" />
          <Stop offset="55%" stopColor="#486161" />
          <Stop offset="100%" stopColor="#8FBFB6" />
        </LinearGradient>
      </Defs>
      <Rect width="64" height="64" rx={rounded} fill="url(#g)" />
      <Path d="M32 12 L51 26.5 V50 H13 V26.5 Z" fill="#FAF8F3" fillOpacity={0.97} />
      <Rect x="26.5" y="35" width="11" height="15" rx="2" fill="url(#g)" />
      <Circle cx="32" cy="18.5" r="3.2" fill="#D4A017" />
    </Svg>
  );
}
