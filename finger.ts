/**
 * Rhost Vision: +finger
 *
 * MUSH-style finger display for character RP info.
 *
 * Setting fields:
 *   +finger/set <field>=<value>   Set a finger field
 *   +finger/set <field>=          Clear a finger field
 *   +finger/set <field>=@@        Hide field from display
 *
 * Viewing:
 *   +finger                       Show your own finger
 *   +finger <name>                Show another character's finger
 */

import { dbojs } from "../../services/Database/index.ts";
import type { IDBOBJ } from "../../@types/IDBObj.ts";
import { addCmd } from "../../services/commands/index.ts";
import { send } from "../../services/broadcast/index.ts";

// ============================================================================
// CONSTANTS
// ============================================================================

const WIDTH = 78;
const COLON_COL = 22; // column where the colon sits in dot-leader lines

// Default fields shown in order (even when empty).
// [display_label, finger_key, fallback_data_attr]
const DEFAULT_FIELDS: Array<[string, string, string | null]> = [
  ["Alias",           "alias",           "alias"],
  ["Online Times",    "online_times",    null],
  ["Pronouns",        "pronouns",        null],
  ["RP Preferences",  "rp_preferences",  null],
  ["Character Quote", "character_quote",  null],
  ["Position",        "position",        null],
];

const DEFAULT_KEYS = new Set(DEFAULT_FIELDS.map(([, k]) => k));

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function headerLine(title: string, visLen?: number): string {
  const t = ` ${title} `;
  const tVis = visLen !== undefined ? visLen + 2 : t.length; // +2 for spaces
  const pad = Math.floor((WIDTH - tVis) / 2);
  const lbar = "=".repeat(Math.max(0, pad));
  const rbar = "=".repeat(Math.max(0, WIDTH - pad - tVis));
  return ` ${lbar}${t}${rbar}`;
}

function divider(): string {
  return ` ${"-".repeat(WIDTH)}`;
}

function footer(): string {
  return ` ${"=".repeat(WIDTH)}`;
}

function dotLine(label: string, value: string): string {
  const pre = ` ${label} `;
  const dotsNeeded = Math.max(1, COLON_COL - pre.length);
  const dots = ".".repeat(dotsNeeded);
  return `${pre}${dots}: ${value}`;
}

function formatIdle(lastCommand: number | undefined): string {
  if (!lastCommand) return "Offline";
  const diff = Math.floor((Date.now() - lastCommand) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function hasFlag(obj: IDBOBJ, flag: string): boolean {
  if (obj.flags instanceof Set) return obj.flags.has(flag);
  if (typeof obj.flags === "string") return new RegExp(`\\b${flag}\\b`, "i").test(obj.flags);
  return false;
}

function isStaff(obj: IDBOBJ): boolean {
  return hasFlag(obj, "superuser") || hasFlag(obj, "staff") || hasFlag(obj, "wizard");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================================
// COMMAND REGISTRATION
// ============================================================================

export function registerFingerCommands() {
  // +finger [<name>] or +finger/set <field>=<value>
  addCmd({
    name: "+finger",
    pattern: /^\+finger(?:\/(\w+))?\s*(.*)/i,
    lock: "",
    exec: async (u) => {
      const sid = u.socketId || "";
      const playerObj = await dbojs.queryOne({ id: u.me.id });
      if (!playerObj) return send([sid], "Error: player not found.");

      const switchArg = (u.cmd.args[0] || "").toLowerCase();
      const rawArgs = (u.cmd.args[1] || "").trim();

      if (switchArg === "set") {
        await doFingerSet(sid, playerObj, rawArgs);
      } else if (rawArgs) {
        await doFingerView(sid, playerObj, rawArgs);
      } else {
        await doFingerDisplay(sid, playerObj, playerObj);
      }
    },
  });
}

// ============================================================================
// +FINGER/SET <FIELD>=<VALUE>
// ============================================================================

async function doFingerSet(sid: string, playerObj: IDBOBJ, rawArgs: string) {
  if (!rawArgs) {
    return send([sid], "%ch>GAME:%cn Usage: %ch+finger/set <field>=<value>%cn");
  }

  const eqIdx = rawArgs.indexOf("=");

  // No = sign: show current value
  if (eqIdx === -1) {
    const field = rawArgs.toLowerCase().replace(/\s+/g, "_");
    const finger: Record<string, string> = (playerObj.data?.finger as Record<string, string>) || {};
    const val = finger[field];
    if (val === undefined) {
      return send([sid], `%ch>GAME:%cn No finger field '${field}' set.`);
    }
    if (val === "@@") {
      return send([sid], `%ch>GAME:%cn finger_${field} is hidden (@@).`);
    }
    const label = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return send([sid], `%ch>GAME:%cn ${label}: ${val}`);
  }

  const field = rawArgs.slice(0, eqIdx).trim().toLowerCase().replace(/\s+/g, "_");
  const value = rawArgs.slice(eqIdx + 1).trim();

  if (!field) {
    return send([sid], "%ch>GAME:%cn Usage: %ch+finger/set <field>=<value>%cn");
  }

  const label = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const finger: Record<string, string> = (playerObj.data?.finger as Record<string, string>) || {};

  // Clear
  if (!value) {
    if (finger[field] !== undefined) {
      delete finger[field];
      await dbojs.modify({ id: playerObj.id }, "$set", { "data.finger": finger } as Partial<IDBOBJ>);
      return send([sid], `%ch>GAME:%cn %cg${label} cleared.%cn`);
    }
    return send([sid], `%ch>GAME:%cn ${label} was not set.`);
  }

  // Set (including @@ to hide)
  finger[field] = value;
  await dbojs.modify({ id: playerObj.id }, "$set", { "data.finger": finger } as Partial<IDBOBJ>);

  if (value === "@@") {
    return send([sid], `%ch>GAME:%cn %cg${label} is now hidden from +finger.%cn`);
  }
  send([sid], `%ch>GAME:%cn %cg${label} set to:%cn ${value}`);
}

// ============================================================================
// +FINGER <NAME>
// ============================================================================

async function doFingerView(sid: string, caller: IDBOBJ, name: string) {
  if (name.toLowerCase() === "me") {
    return await doFingerDisplay(sid, caller, caller);
  }

  const escaped = escapeRegex(name);

  // Search by name first
  let results = await dbojs.query({ "data.name": new RegExp(`^${escaped}$`, "i") });
  let target = results.find((r: IDBOBJ) => hasFlag(r, "player"));

  // Fall back to alias search
  if (!target) {
    const allPlayers = await dbojs.query({ flags: /player/i });
    target = allPlayers.find((r: IDBOBJ) => {
      const alias = (r.data?.alias as string) || (r.data?.ALIAS as string) || "";
      return alias.toLowerCase() === name.toLowerCase();
    });
  }

  if (!target) {
    return send([sid], `%ch>GAME:%cn No character found matching '${name}'.`);
  }

  await doFingerDisplay(sid, caller, target);
}

// ============================================================================
// FINGER DISPLAY
// ============================================================================

async function doFingerDisplay(sid: string, _caller: IDBOBJ, char: IDBOBJ) {
  const finger: Record<string, string> = (char.data?.finger as Record<string, string>) || {};
  const charName = (char.data?.name as string) || "Unknown";
  const nameColor = (char.data?.name_color as string) || "";
  const colorName = nameColor && isStaff(char) && charName.length > 0
    ? `${nameColor}${charName[0]}%cn%ch%cw${charName.slice(1)}%cn`
    : charName;
  const lastCmd = char.data?.lastCommand as number || char.data?.LASTCOMMAND as number || undefined;
  const isConnected = hasFlag(char, "connected");

  const lines: string[] = [];

  // Header — whole title in bright teal
  const headerTitle = `%ch%cc${charName}'s +finger%cn`;
  lines.push(headerLine(headerTitle, `${charName}'s +finger`.length));

  // Full Name / Idle line — no ANSI, uses fullname from CG
  const fullName = (char.data?.fullname as string) || (char.data?.FULLNAME as string) || charName;
  const idle = isConnected ? formatIdle(lastCmd) : "Offline";
  const left = ` Full Name: ${fullName}`;
  const rightStr = `| Idle: ${idle}`;
  const padded = left.padEnd(36);
  lines.push(`${padded}${rightStr}`);

  // Divider
  lines.push(divider());

  // Status line
  let status: string;
  if (isStaff(char)) {
    status = "%ch%ccStaff%cn";
  } else if (char.data?.approved || char.data?.APPROVED) {
    status = "%ch%cgApproved Player%cn";
  } else {
    status = "Unapproved";
  }
  lines.push(` Status: ${status}`);

  // Divider
  lines.push(divider());

  // Default fields
  for (const [label, fkey, fallbackAttr] of DEFAULT_FIELDS) {
    let val = finger[fkey];
    // Skip hidden fields
    if (val === "@@") continue;
    // Fall back to data attribute if no finger value
    if (val === undefined && fallbackAttr) {
      const fb = char.data?.[fallbackAttr] || char.data?.[fallbackAttr.toUpperCase()];
      if (fb) val = String(fb);
    }
    if (val === undefined) val = "";
    lines.push(dotLine(label, val));
  }

  // Custom fields (not in defaults, sorted alphabetically)
  const customKeys = Object.keys(finger)
    .filter((k) => !DEFAULT_KEYS.has(k) && finger[k] !== "@@")
    .sort();

  for (const fkey of customKeys) {
    const label = fkey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(dotLine(label, finger[fkey]));
  }

  // Blank line before footer
  lines.push("");

  // Footer
  lines.push(footer());

  send([sid], lines.join("\n"));
}
