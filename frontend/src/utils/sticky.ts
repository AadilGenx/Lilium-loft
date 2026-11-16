/**
 * A side column that stays in view while the rest of the page scrolls (desktop widths only).
 *
 * It sticks 1rem below the top of the scrolling area. The page header is outside that area, so the
 * height cap is the screen minus the header (5rem) and some breathing room; if the column is taller
 * than that, it scrolls on its own, so none of it can become unreachable.
 */
export const STICKY_COLUMN =
  'lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto scrollbar-none';
