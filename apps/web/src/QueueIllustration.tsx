import { Box, Stack, Typography } from '@mui/material';

import { colors } from './theme';

const steps = [
  { number: '01', title: 'Arriben', detail: 'Tasques sintètiques' },
  { number: '02', title: 'Esperen', detail: 'Una cua per política' },
  { number: '03', title: 'Es processen', detail: 'Workers disponibles' },
];

export function QueueIllustration() {
  return (
    <Box
      component="figure"
      aria-label="Esquema conceptual: les tasques arriben, esperen a la cua i es processen amb workers"
      sx={{
        m: 0,
        p: { xs: 2.5, md: 4 },
        bgcolor: '#E9F0E8',
        border: `1px solid ${colors.line}`,
        borderRadius: 5,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography
          variant="overline"
          sx={{ letterSpacing: '0.16em', fontWeight: 800, color: colors.green }}
        >
          ESQUEMA DEL SISTEMA
        </Typography>
        <Typography
          sx={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: colors.muted,
          }}
        >
          TEMPS VIRTUAL / TICKS
        </Typography>
      </Stack>
      <Box
        component="svg"
        viewBox="0 0 700 300"
        role="img"
        aria-label="Tres caixes avancen cap a una cua i dos workers"
        sx={{ display: 'block', width: '100%', height: 'auto', my: 2 }}
      >
        <defs>
          <pattern
            id="queue-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path d="M24 0H0V24" fill="none" stroke="#C5D7C9" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="700" height="300" fill="url(#queue-grid)" />
        <path
          d="M24 238H676"
          stroke="#8DAE9B"
          strokeWidth="2"
          strokeDasharray="6 8"
        />
        <path
          d="M45 158H495"
          stroke="#245C46"
          strokeWidth="2"
          markerEnd="url(#queue-arrow)"
        />
        <defs>
          <marker
            id="queue-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path
              d="M0 0L8 4L0 8"
              fill="none"
              stroke="#245C46"
              strokeWidth="1.5"
            />
          </marker>
        </defs>
        {[50, 145, 240].map((x, i) => (
          <g key={x}>
            <rect
              x={x}
              y={114}
              width="65"
              height="78"
              rx="5"
              fill={i === 2 ? '#9DCEAC' : '#D6EAD9'}
              stroke="#245C46"
              strokeWidth="2"
            />
            <path
              d={`M${x} 135h65M${x + 32.5} 114v21`}
              stroke="#245C46"
              strokeWidth="2"
            />
            <text
              x={x + 32.5}
              y="168"
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill="#245C46"
            >
              T{i + 1}
            </text>
          </g>
        ))}
        <path
          d="M342 92v124M342 92h76M342 216h76"
          fill="none"
          stroke="#8DAE9B"
          strokeWidth="2"
        />
        <text x="380" y="84" textAnchor="middle" fontSize="13" fill="#52645E">
          CUA
        </text>
        <rect
          x="510"
          y="72"
          width="150"
          height="62"
          rx="9"
          fill="#FFFFFF"
          stroke="#245C46"
          strokeWidth="2"
        />
        <rect
          x="510"
          y="171"
          width="150"
          height="62"
          rx="9"
          fill="#FFFFFF"
          stroke="#245C46"
          strokeWidth="2"
        />
        <circle cx="540" cy="103" r="12" fill="#78BE98" />
        <circle cx="540" cy="202" r="12" fill="#78BE98" />
        <text x="574" y="109" fontSize="16" fontWeight="700" fill="#1A2925">
          Worker 1
        </text>
        <text x="574" y="208" fontSize="16" fontWeight="700" fill="#1A2925">
          Worker 2
        </text>
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ gap: 2, justifyContent: 'space-between' }}
      >
        {steps.map((step) => (
          <Box key={step.number} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
                color: colors.green,
                fontWeight: 800,
              }}
            >
              {step.number} / {step.title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: colors.muted }}>
              {step.detail}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Typography
        component="figcaption"
        sx={{ mt: 3, fontSize: 12, color: colors.muted }}
      >
        Il·lustració conceptual. No representa una execució ni dades mesurades.
      </Typography>
    </Box>
  );
}
