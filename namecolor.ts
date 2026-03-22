/**
 * Rhost Vision: +namecolor
 *
 * Staff command to set the color of the first letter of their name.
 * The rest of the name displays in bright white.
 *
 * Usage:
 *   +namecolor <code>      Set first-letter color (ANSI or #hex)
 *   +namecolor             View current setting with preview
 *   +namecolor reset       Clear custom color
 *
 * Only staff (superuser, staff, wizard) may use this command.
 * Players see names rendered with the color in room displays,
 * WHO, +where, +finger, etc.
 */

import { dbojs } from "jsr:@ursamu/ursamu";
import type { IDBOBJ } from "jsr:@ursamu/ursamu";
import { addCmd } from "jsr:@ursamu/ursamu";
import { send } from "jsr:@ursamu/ursamu";

// ============================================================================
// COLOR MAPPING
// ============================================================================

const ANSI_MAP: Record<string, string> = {
  hr: "%ch%cr", hg: "%ch%cg", hy: "%ch%cy", hb: "%ch%cb",
  hm: "%ch%cm", hc: "%ch%cc", hw: "%ch%cw", hx: "%ch%cx",
  r: "%cr", g: "%cg", y: "%cy", b: "%cb",
  m: "%cm", c: "%cc", w: "%cw", x: "%cx",
};

const ANSI_NAMES: Record<string, string> = {
  hr: "bright red", hg: "bright green", hy: "bright yellow", hb: "bright blue",
  hm: "bright magenta", hc: "bright cyan", hw: "bright white", hx: "bright black",
  r: "dark red", g: "dark green", y: "dark yellow", b: "dark blue",
  m: "dark magenta", c: "dark cyan", w: "dark white", x: "black",
};

function resolveColor(code: string): string | null {
  const lower = code.toLowerCase();
  if (ANSI_MAP[lower]) return ANSI_MAP[lower];
  const hex = code.replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `<#${hex}>`;
  return null;
}

function hasFlag(obj: IDBOBJ, flag: string): boolean {
  if (obj.flags instanceof Set) return obj.flags.has(flag);
  if (typeof obj.flags === "string") return new RegExp(`\\b${flag}\\b`, "i").test(obj.flags);
  return false;
}

function isStaff(obj: IDBOBJ): boolean {
  return hasFlag(obj, "superuser") || hasFlag(obj, "staff") || hasFlag(obj, "wizard");
}

/**
 * Build a colored name string for a character.
 * Staff with a name_color set get their first letter colored,
 * rest in bright white. Everyone else gets plain bright white.
 */
export function coloredName(playerObj: IDBOBJ): string {
  const name = (playerObj.data?.name as string) || "Unknown";
  const nameColor = (playerObj.data?.name_color as string) || "";

  if (nameColor && isStaff(playerObj) && name.length > 0) {
    return `${nameColor}${name[0]}%cn%ch%cw${name.slice(1)}%cn`;
  }
  return `%ch%cw${name}%cn`;
}

// ============================================================================
// COMMAND
// ============================================================================

export function registerNameColorCommands() {
  addCmd({
    name: "+namecolor",
    pattern: /^\+namecolor\s*(.*)/i,
    lock: "",
    exec: async (u) => {
      const sid = u.socketId || "";
      const playerObj = await dbojs.queryOne({ id: u.me.id });
      if (!playerObj) return send([sid], "Error: player not found.");

      if (!isStaff(playerObj)) {
        return send([sid], "%ch>GAME:%cn %crOnly staff may use +namecolor.%cn");
      }

      const rawArgs = (u.cmd.args[0] || "").trim().toLowerCase();
      const name = (playerObj.data?.name as string) || "Unknown";

      // No args — show current
      if (!rawArgs) {
        const current = (playerObj.data?.name_color as string) || "(none)";
        const preview = coloredName(playerObj);
        return send([sid], `%ch>GAME:%cn Name color: ${current}\n%ch>GAME:%cn Preview: ${preview}`);
      }

      // Reset
      if (rawArgs === "reset" || rawArgs === "clear") {
        await dbojs.modify({ id: playerObj.id }, "$set", { "data.name_color": null } as Partial<IDBOBJ>);
        return send([sid], `%ch>GAME:%cn Name color cleared. Your name displays as: %ch%cw${name}%cn`);
      }

      const code = resolveColor(rawArgs);
      if (!code) {
        return send([sid], `%ch>GAME:%cn %cr'${rawArgs}' is not a valid color code.%cn\nUse: hr, hg, hy, hb, hm, hc, hw (bright), r, g, y, b, m, c, w (dark), or #hex (e.g. #FF5500).`);
      }

      await dbojs.modify({ id: playerObj.id }, "$set", { "data.name_color": code } as Partial<IDBOBJ>);
      const label = ANSI_NAMES[rawArgs] || (rawArgs.startsWith("#") ? `hex ${rawArgs}` : rawArgs);

      // Build preview with the new color
      const preview = `${code}${name[0]}%cn%ch%cw${name.slice(1)}%cn`;
      send([sid], `%ch>GAME:%cn Name color set to ${label}.\n%ch>GAME:%cn Preview: ${preview}`);
    },
  });
}
