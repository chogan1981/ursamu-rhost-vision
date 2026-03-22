/**
 * Rhost Vision — Theme Configuration
 *
 * Edit this file to customize colors, width, and layout behavior.
 * Changes take effect the next time the game starts (the plugin re-writes
 * system/scripts/look.ts, who.ts, and page.ts from this config).
 *
 * To apply without a full restart:  @reload rhost-vision  (if supported)
 * To reset to defaults:             delete system/scripts/look.ts etc. and restart
 */

export interface RhostTheme {
  /** Fallback width when the player has no NAWS-negotiated terminal size. Classic MUSH standard is 78. */
  width: number;

  /** Heavy border character — used for header and footer lines. */
  borderChar: string;

  /** Light divider character — used for section separators. */
  dividerChar: string;

  /** Progress-bar fill character (used by `bar()`). */
  barFill: string;

  /** Progress-bar empty character (used by `bar()`). */
  barEmpty: string;

  colors: {
    /** Color of heavy border lines (header/footer). */
    border: string;
    /** Color of room/object name inside the header. */
    header: string;
    /** Color of section-divider labels ("Players", "Exits", …). */
    label: string;
    /** Accent color — exit aliases, minor highlights. */
    accent: string;
    /** Idle: fresh (0–4 min). */
    idleFresh: string;
    /** Idle: away (5–14 min). */
    idleAway: string;
    /** Idle: AFK (15+ min). */
    idleAFK: string;
    /** Progress-bar filled segment. */
    barFilled: string;
    /** Progress-bar empty segment. */
    barEmpty: string;
    /** ANSI reset / normal text. */
    reset: string;
  };

  look: {
    /** Show the player's &short-desc next to their name in the room. */
    showShortDesc: boolean;
    /** Show idle time next to player names in the room. */
    showIdle: boolean;
    /** Split exits into "Locations" (named places) and "Directions" (cardinal). */
    categorizeExits: boolean;
    /** Show the exit alias (the part after the semicolon) in cyan. */
    showExitAliases: boolean;
    /** Number of columns for the exit list. */
    exitColumns: 1 | 2 | 3;
    /** Indent for description text (number of leading spaces). */
    descIndent: number;
  };

  who: {
    /** Column width for the player-name column. */
    nameWidth: number;
    /** Column width for the "On For" column. */
    onForWidth: number;
    /** Column width for the "Idle" column. */
    idleWidth: number;
  };
}

// ─── Default Theme ────────────────────────────────────────────────────────────

export const defaultTheme: RhostTheme = {
  width: 78,
  borderChar: "=",
  dividerChar: "-",
  barFill: "#",
  barEmpty: ".",

  colors: {
    border:    "%ch%cw",   // bright white
    header:    "%ch%cw",   // bright white
    label:     "%ch%cw",   // bright white
    accent:    "%cy",      // cyan
    idleFresh: "%cg",      // green  (fresh, 0–4 min)
    idleAway:  "%cn",      // normal (away,  5–14 min)
    idleAFK:   "%cx",      // dark   (AFK,   15+ min)
    barFilled: "%cg",      // green
    barEmpty:  "%cx",      // dark gray
    reset:     "%cn",
  },

  look: {
    showShortDesc:    true,
    showIdle:         true,
    categorizeExits:  true,
    showExitAliases:  true,
    exitColumns:      2,
    descIndent:       2,
  },

  who: {
    nameWidth:  21,
    onForWidth: 8,
    idleWidth:  4,
  },
};

/**
 * Override any subset of the default theme here.
 * Leave as `undefined` to use the defaults above.
 *
 * Example — switch to a blue color scheme and 80-char width:
 *
 *   export const customTheme: Partial<RhostTheme> = {
 *     width: 80,
 *     borderChar: "~",
 *     colors: { ...defaultTheme.colors, border: "%ch%cb", header: "%ch%cb" },
 *   };
 */
export const customTheme: Partial<RhostTheme> | undefined = undefined;
