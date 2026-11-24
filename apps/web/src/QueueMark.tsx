import { Box, Stack, Typography } from '@mui/material';

type QueueMarkProps = { compact?: boolean };

export function QueueMark({ compact = false }: QueueMarkProps) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Box
        component="svg"
        viewBox="0 0 52 42"
        width="42"
        height="34"
        role="img"
        aria-label="Tres caixes en cua davant d'un punt de servei"
        sx={{ flexShrink: 0 }}
      >
        <path
          d="M1 35.5H51"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="2"
          y="17"
          width="12"
          height="14"
          rx="2"
          fill="#D7EBDD"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M2 21h12M8 17v4" stroke="currentColor" strokeWidth="1.4" />
        <rect
          x="17"
          y="13"
          width="13"
          height="18"
          rx="2"
          fill="#B9DDC7"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M17 18h13m-6.5-5v5" stroke="currentColor" strokeWidth="1.4" />
        <rect
          x="33"
          y="9"
          width="14"
          height="22"
          rx="2"
          fill="#78BE98"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M33 15h14M40 9v6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="49" cy="4" r="2.5" fill="#245C46" />
      </Box>
      {!compact && (
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: '1.2rem',
            letterSpacing: '-0.055em',
            whiteSpace: 'nowrap',
          }}
        >
          QueueScope
        </Typography>
      )}
    </Stack>
  );
}
