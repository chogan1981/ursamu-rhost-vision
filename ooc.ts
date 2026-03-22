/**
 * Rhost Vision: ooc + ooccolor
 *
 * OOC talk command for in-room out-of-character communication,
 * with customizable <OOC> tag colors.
 *
 * Talk:
 *   ooc <message>           Say something OOC: <OOC> Jupiter says, "Hi!"
 *   ooc :<pose>             Pose OOC: <OOC> Jupiter waves!
 *
 * Color customization:
 *   +ooccolor <code>        Set the text color of "OOC" in the tag
 *   +ooccolor2 <code>       Set the bracket color of < > in the tag
 *   +ooccolor                Show current settings
 *   +ooccolor reset          Clear custom colors
 *
 * ANSI codes: hr, hg, hy, hb, hm, hc, hw (bright); r, g, y, b, m, c, w (dark)
 */

import { dbojs } from "../../services/Database/index.ts";
import type { IDBOBJ } from "../../@types/IDBObj.ts";
import { addCmd } from "../../services/commands/index.ts";
import { send } from "../../services/broadcast/index.ts";

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
  // Hex color: #FF5500 or FF5500
  const hex = code.replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `<#${hex}>`;
  return null;
}

function buildOocTag(playerObj: IDBOBJ): string {
  const textColor = (playerObj.data?.ooccolor as string) || "%ch";
  const bracketColor = (playerObj.data?.ooccolor2 as string) || "%ch";
  return `${bracketColor}<%cn${textColor}OOC%cn${bracketColor}>%cn`;
}

/**
 * Send a message to all connected players in a room.
 */
async function sendToRoom(location: string, message: string) {
  const roomPlayers = await dbojs.query({
    $and: [
      { location },
      { flags: /connected/i },
    ],
  });
  const ids = roomPlayers.map((p) => p.id);
  if (ids.length > 0) send(ids, message);
}

// ============================================================================
// COMMANDS
// ============================================================================

export function registerOocTalkCommands() {
  // ooc <message> or ooc :<pose>
  addCmd({
    name: "ooc",
    pattern: /^ooc\s+(.*)/i,
    lock: "",
    exec: async (u) => {
      const sid = u.socketId || "";
      const playerObj = await dbojs.queryOne({ id: u.me.id });
      if (!playerObj) return send([sid], "Error: player not found.");

      const rawArgs = (u.cmd.args[0] || "").trim();
      if (!rawArgs) {
        return send([sid], "%ch>GAME:%cn Usage: %chooc <message>%cn or %chooc :<pose>%cn");
      }

      const rawName = (playerObj.data?.name as string) || "Unknown";
      const nameColor = (playerObj.data?.name_color as string) || "";
      const name = nameColor && rawName.length > 0
        ? `${nameColor}${rawName[0]}%cn%ch%cw${rawName.slice(1)}%cn`
        : rawName;
      const location = playerObj.location;
      if (!location) {
        return send([sid], "%ch>GAME:%cn You have no location.");
      }

      const tag = buildOocTag(playerObj);

      let message: string;
      if (rawArgs.startsWith(":")) {
        const pose = rawArgs.slice(1).trimStart();
        message = `${tag} ${name} ${pose}`;
      } else {
        message = `${tag} ${name} says, "${rawArgs}"`;
      }

      await sendToRoom(location, message);
    },
  });

  // +ooccolor [<code>]
  addCmd({
    name: "+ooccolor",
    pattern: /^\+ooccolor(?!2)\s*(.*)/i,
    lock: "",
    exec: async (u) => {
      const sid = u.socketId || "";
      const playerObj = await dbojs.queryOne({ id: u.me.id });
      if (!playerObj) return send([sid], "Error: player not found.");

      const rawArgs = (u.cmd.args[0] || "").trim().toLowerCase();

      if (!rawArgs) {
        const current = (playerObj.data?.ooccolor as string) || "(default)";
        const current2 = (playerObj.data?.ooccolor2 as string) || "(default)";
        const tag = buildOocTag(playerObj);
        return send([sid], `%ch>GAME:%cn OOC text color: ${current}\n%ch>GAME:%cn OOC bracket color: ${current2}\n%ch>GAME:%cn Preview: ${tag}`);
      }

      if (rawArgs === "reset" || rawArgs === "clear") {
        await dbojs.modify({ id: playerObj.id }, "$set", { "data.ooccolor": null } as Partial<IDBOBJ>);
        return send([sid], "%ch>GAME:%cn OOC text color cleared to default.");
      }

      const code = resolveColor(rawArgs);
      if (!code) {
        return send([sid], `%ch>GAME:%cn %cr'${rawArgs}' is not a valid color code.%cn\nUse: hr, hg, hy, hb, hm, hc, hw (bright), r, g, y, b, m, c, w (dark), or #hex (e.g. #FF5500).`);
      }

      await dbojs.modify({ id: playerObj.id }, "$set", { "data.ooccolor": code } as Partial<IDBOBJ>);
      const label = ANSI_NAMES[rawArgs] || (rawArgs.startsWith("#") ? `hex ${rawArgs}` : rawArgs);
      const updated = await dbojs.queryOne({ id: playerObj.id });
      const tag = updated ? buildOocTag(updated) : buildOocTag(playerObj);
      send([sid], `%ch>GAME:%cn OOC text color set to ${label}. Preview: ${tag}`);
    },
  });

  // +ooccolor2 [<code>]
  addCmd({
    name: "+ooccolor2",
    pattern: /^\+ooccolor2\s*(.*)/i,
    lock: "",
    exec: async (u) => {
      const sid = u.socketId || "";
      const playerObj = await dbojs.queryOne({ id: u.me.id });
      if (!playerObj) return send([sid], "Error: player not found.");

      const rawArgs = (u.cmd.args[0] || "").trim().toLowerCase();

      if (!rawArgs) {
        const current2 = (playerObj.data?.ooccolor2 as string) || "(default)";
        const tag = buildOocTag(playerObj);
        return send([sid], `%ch>GAME:%cn OOC bracket color: ${current2}\n%ch>GAME:%cn Preview: ${tag}`);
      }

      if (rawArgs === "reset" || rawArgs === "clear") {
        await dbojs.modify({ id: playerObj.id }, "$set", { "data.ooccolor2": null } as Partial<IDBOBJ>);
        return send([sid], "%ch>GAME:%cn OOC bracket color cleared to default.");
      }

      const code = resolveColor(rawArgs);
      if (!code) {
        return send([sid], `%ch>GAME:%cn %cr'${rawArgs}' is not a valid color code.%cn\nUse: hr, hg, hy, hb, hm, hc, hw (bright), r, g, y, b, m, c, w (dark), or #hex (e.g. #FF5500).`);
      }

      await dbojs.modify({ id: playerObj.id }, "$set", { "data.ooccolor2": code } as Partial<IDBOBJ>);
      const label = ANSI_NAMES[rawArgs] || (rawArgs.startsWith("#") ? `hex ${rawArgs}` : rawArgs);
      const updated = await dbojs.queryOne({ id: playerObj.id });
      const tag = updated ? buildOocTag(updated) : buildOocTag(playerObj);
      send([sid], `%ch>GAME:%cn OOC bracket color set to ${label}. Preview: ${tag}`);
    },
  });
}
