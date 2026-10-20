import { useMediaQuery } from '@mui/material';

// noSsr avoids a first render with the wrong layout in this client-only app.
export const useIsMobile = () => useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });

export const useIsTouch = () => useMediaQuery('(hover: none)', { noSsr: true });
