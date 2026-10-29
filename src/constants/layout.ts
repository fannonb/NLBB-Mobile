/**
 * Responsive layout tokens.
 *
 * Android 16 ignores orientation and resizability restrictions on large screens
 * (tablets, foldables, desktop windowing), so every screen can be rendered at any
 * width — including landscape phones. Rather than stretching phone layouts edge to
 * edge across a tablet, content sits in a centred column that is capped on wide
 * displays. The cap lives on the app shell (see App.tsx) so it applies everywhere.
 */
export const MAX_CONTENT_WIDTH = 720;

/** Full-width on phones, capped and centred once the viewport is wider than the cap. */
export const contentColumn = {
  width: '100%',
  maxWidth: MAX_CONTENT_WIDTH,
  alignSelf: 'center',
} as const;
