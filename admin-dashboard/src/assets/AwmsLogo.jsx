import { Box, Typography } from '@mui/material';

/**
 * AWMS brand mark — a warehouse silhouette cut from a rounded Forest badge,
 * with a golden grain dot on the roof. `animated` adds a slow rotating
 * conic glow (Forest -> Golden Grain) behind the badge, used on auth
 * screens; keep it off inside dense UI (topbar, tables) for calm.
 */
export function AwmsMark({ size = 40, animated = false, rounded = 14 }) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {animated && (
        <Box
          sx={{
            position: 'absolute',
            inset: -size * 0.35,
            borderRadius: '50%',
            background:
              'conic-gradient(from 0deg, #0B1F1A, #8FBFB6, #D4A017, #0B1F1A)',
            filter: 'blur(18px)',
            opacity: 0.5,
            animation: 'awmsSpin 6s linear infinite',
          }}
        />
      )}
      <Box
        component="svg"
        viewBox="0 0 64 64"
        sx={{ width: size, height: size, position: 'relative', display: 'block' }}
      >
        <defs>
          <linearGradient id="awmsGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0B1F1A" />
            <stop offset="55%" stopColor="#486161" />
            <stop offset="100%" stopColor="#8FBFB6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx={rounded} fill="url(#awmsGrad)" />
        <path d="M32 12 L51 26.5 V50 H13 V26.5 Z" fill="#FAF8F3" fillOpacity="0.97" />
        <rect x="26.5" y="35" width="11" height="15" rx="2" fill="url(#awmsGrad)" />
        <circle cx="32" cy="18.5" r="3.2" fill="#D4A017" />
      </Box>
    </Box>
  );
}

export function AwmsLogo({ size = 40, animated = false, textSx }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <AwmsMark size={size} animated={animated} />
      <Typography
        variant="h5"
        sx={{
          fontFamily: '"Inter","Manrope",sans-serif',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          backgroundImage: (theme) =>
            theme.palette.mode === 'light'
              ? 'linear-gradient(90deg,#122F2C,#486161 55%,#B77B1E)'
              : 'linear-gradient(90deg,#F4E6C1,#8FBFB6 55%,#D4A017)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          ...textSx,
        }}
      >
        AWMS
      </Typography>
    </Box>
  );
}
