import { IUrsamuSDK, IDBObj } from "jsr:@ursamu/ursamu";

/**
 * Rhost Vision: look.ts
 * Rhost-style room display with bordered headers, sectioned exits,
 * player idle times, and short descriptions.
 *
 * To activate: copy this file to system/scripts/look.ts
 * To deactivate: restore system/scripts/look.ts from look.original.ts
 */

const WIDTH = 78;
const CARDINAL = new Set([
  "n", "s", "e", "w", "ne", "nw", "se", "sw",
  "north", "south", "east", "west",
  "northeast", "northwest", "southeast", "southwest",
  "up", "down", "u", "d",
]);

function centerLine(text: string, char: string, width: number): string {
  const t = ` ${text} `;
  const tLen = visualLen(t);
  const pad = Math.floor((width - tLen) / 2);
  const right = width - pad - tLen;
  return char.repeat(Math.max(0, pad)) + t + char.repeat(Math.max(0, right));
}

function headerLine(text: string): string {
  return " " + centerLine(text, "=", WIDTH);
}

function sectionLine(text: string): string {
  return " " + centerLine(text, "-", WIDTH);
}

function footerLine(): string {
  return " " + "=".repeat(WIDTH);
}

/** Measure visual width, stripping color codes. */
function visualLen(s: string): number {
  return s.replace(/%c[rRgGyYbBmMcCwWxXnh]|%cn|%ch|%ct/g, "").length;
}

/**
 * Word-wrap text to fit within a given width.
 * Preserves leading whitespace/tabs for indented paragraphs.
 * Counts tab characters as 8 spaces for width measurement.
 */
function wordWrap(text: string, width: number) {
  var resultLines = [];
  var paragraphs = text.split("\n");

  for (var p = 0; p < paragraphs.length; p++) {
    var paragraph = paragraphs[p];
    if (paragraph.trim() === "") {
      resultLines.push("");
      continue;
    }

    // Measure indent
    var indentLen = 0;
    while (indentLen < paragraph.length && (paragraph[indentLen] === " " || paragraph[indentLen] === "\t")) {
      indentLen++;
    }
    var indent = paragraph.substring(0, indentLen);
    var indentWidth = visualLen(indent);

    if (visualLen(paragraph) <= width) {
      resultLines.push(paragraph);
      continue;
    }

    // Split into words
    var content = paragraph.substring(indentLen);
    var words = content.split(" ");
    var currentLine = indent + words[0];
    var currentLen = indentWidth + visualLen(words[0]);

    for (var w = 1; w < words.length; w++) {
      var word = words[w];
      var wordLen = visualLen(word);
      // +1 for the space between words
      if (currentLen + 1 + wordLen > width) {
        resultLines.push(currentLine);
        currentLine = word;
        currentLen = wordLen;
      } else {
        currentLine = currentLine + " " + word;
        currentLen = currentLen + 1 + wordLen;
      }
    }
    if (currentLine.length > 0) {
      resultLines.push(currentLine);
    }
  }

  return resultLines.join("\n");
}

function coloredName(obj: IDBObj): string {
  const rawName = (obj.state?.moniker as string) || (obj.state?.name as string) || obj.name || "Unknown";
  const nameColor = (obj.state?.name_color as string) || "";
  if (nameColor && rawName.length > 0) {
    return `${nameColor}${rawName[0]}%cn%ch%cw${rawName.slice(1)}%cn`;
  }
  return rawName;
}

function formatIdle(lastCommand: number | undefined): string {
  if (!lastCommand) return "%cx??%cn";
  const diff = Math.floor((Date.now() - lastCommand) / 1000);
  if (diff < 60) return `%cg${diff}s%cn`;
  if (diff < 600) return `%cg${Math.floor(diff / 60)}m%cn`;
  if (diff < 3600) return `%cy${Math.floor(diff / 60)}m%cn`;
  if (diff < 86400) return `%cy${Math.floor(diff / 3600)}h%cn`;
  return `%ch%cx${Math.floor(diff / 86400)}d%cn`;
}

interface IAttr {
  name?: string;
  value?: string;
}

function getShortDesc(obj: IDBObj): string {
  const attrs = (obj.state?.attributes as IAttr[]) || [];
  const sd = attrs.find(
    (a: IAttr) =>
      a.name?.toLowerCase() === "short-desc" ||
      a.name?.toLowerCase() === "shortdesc",
  );
  return sd?.value || "";
}

function getExitInfo(
  exit: IDBObj,
): { name: string; alias: string; isDirection: boolean } {
  const raw = (exit.state?.name as string) || exit.name || "";
  const parts = raw
    .split(";")
    .map((p: string) => p.trim())
    .filter(Boolean);
  const name = parts[0] || "???";
  const aliases = parts.slice(1);

  const isDirection = parts.some((p: string) =>
    CARDINAL.has(p.toLowerCase()),
  );

  let displayAlias = "";
  if (aliases.length > 0) {
    aliases.sort((a: string, b: string) => a.length - b.length);
    displayAlias = aliases[0];
  } else if (CARDINAL.has(name.toLowerCase())) {
    displayAlias = name;
  }

  return { name, alias: displayAlias, isDirection };
}

function formatExitEntry(info: { name: string; alias: string }): string {
  if (info.alias && info.alias.toLowerCase() !== info.name.toLowerCase()) {
    return `${info.name} <%cc${info.alias.toUpperCase()}%cn>`;
  }
  return info.name;
}

function twoColumn(items: string[]): string {
  const lineWidth = WIDTH; // 78
  const lines: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i] || "";
    const right = items[i + 1] || "";
    if (right) {
      const leftVis = visualLen(left);
      const rightVis = visualLen(right);
      const gap = Math.max(1, lineWidth - leftVis - rightVis);
      lines.push(` ${left}${" ".repeat(gap)}${right}`);
    } else {
      lines.push(` ${left}`);
    }
  }
  return lines.join("\n");
}

export default async (u: IUrsamuSDK) => {
  const actor = u.me;
  const target = u.target || u.here;

  if (!target) {
    u.send("I can't find that here.");
    return;
  }

  if (actor.flags.has("blind")) {
    u.send("You can't see anything!");
    return;
  }

  const canEditTarget = await u.canEdit(actor, target);
  const isOpaque = target.flags.has("opaque");
  const showContents = !isOpaque || canEditTarget;
  const isRoom = target.flags.has("room") || !!(target.contents);

  // ---- Non-room objects: use simple display ----
  if (!isRoom) {
    const nameStr = u.util.displayName(target, actor);
    const desc =
      (target.state.description as string) || "You see nothing special.";
    u.send(`%ch${nameStr}%cn\n${desc}`);
    return;
  }

  // ---- Room display: Rhost Vision ----
  const description =
    (target.state.description as string) || "You see nothing special.";

  const characters = (target.contents || []).filter(
    (obj: IDBObj) =>
      obj.flags.has("player") &&
      obj.flags.has("connected"),
  );

  const objects = (target.contents || []).filter(
    (obj: IDBObj) =>
      !obj.flags.has("player") &&
      !obj.flags.has("exit") &&
      !obj.flags.has("room"),
  );

  const exits = (target.contents || []).filter((obj: IDBObj) =>
    obj.flags.has("exit"),
  );

  // Strip dbref from room name for display (e.g., "OOC Polis #1" → "OOC Polis")
  const rawRoomName = u.util.displayName(target, actor);
  const roomName = rawRoomName.replace(/\s*#\d+$/, "");
  const lines: string[] = [];

  // Header (with grid area if present)
  const gridArea = (target.state?.grid_area as string) || "";
  const headerText = gridArea
    ? `${roomName} - %cc${gridArea}%cn`
    : roomName;
  lines.push(headerLine(headerText));
  lines.push("");

  // Description (strip any leading blank lines to avoid double-spacing after header)
  const descTrimmed = description.replace(/^\n+/, "");
  lines.push(wordWrap(descTrimmed, WIDTH));
  lines.push("");

  // Players
  if (showContents && characters.length > 0) {
    lines.push(sectionLine("Players"));
    for (const c of characters) {
      const rawName = (c.state?.moniker as string) || (c.state?.name as string) || c.name || "Unknown";
      const cName = coloredName(c);
      const idle = formatIdle(c.state?.lastCommand as number);
      const shortDesc = getShortDesc(c);
      // Pad based on raw name length (color codes are invisible)
      const pad = " ".repeat(Math.max(1, 20 - rawName.length));
      const idleCol = idle.padEnd(6);
      lines.push(` ${cName}${pad}${idleCol}${shortDesc}`);
    }
  }

  // Contents (non-player, non-exit objects)
  if (showContents && objects.length > 0) {
    lines.push(sectionLine("Contents"));
    for (const o of objects) {
      lines.push(` ${o.name || u.util.displayName(o, actor)}`);
    }
  }

  // Exits -- split into Locations, Directions, and Exits using grid exit_type
  if (exits.length > 0) {
    const locations: { name: string; alias: string }[] = [];
    const directions: { name: string; alias: string }[] = [];
    const genericExits: { name: string; alias: string }[] = [];

    for (const exit of exits) {
      const info = getExitInfo(exit);
      const exitType = (exit.state?.exit_type as string) || "";

      if (exitType === "location") {
        locations.push(info);
      } else if (exitType === "direction") {
        directions.push(info);
      } else if (exitType === "exit") {
        genericExits.push(info);
      } else if (info.isDirection) {
        directions.push(info);
      } else {
        locations.push(info);
      }
    }

    if (locations.length > 0) {
      lines.push(sectionLine("Locations"));
      const formatted = locations.map(formatExitEntry);
      lines.push(twoColumn(formatted));
    }

    if (directions.length > 0) {
      lines.push(sectionLine("Directions"));
      const formatted = directions.map(formatExitEntry);
      lines.push(twoColumn(formatted));
    }

    if (genericExits.length > 0) {
      lines.push(sectionLine("Exits"));
      const formatted = genericExits.map(formatExitEntry);
      lines.push(twoColumn(formatted));
    }
  }

  // Footer
  lines.push(footerLine());

  u.send(lines.join("\n"));

  // Phase 2: Web UI Output
  const components: unknown[] = [];
  components.push(
    u.ui.panel({
      type: "header",
      content: roomName,
      style: "bold centered",
    }),
  );
  components.push(u.ui.panel({ type: "panel", content: description }));

  if (showContents && characters.length > 0) {
    components.push(
      u.ui.panel({
        type: "list",
        title: "Players",
        content: characters.map((c: IDBObj) => ({
          name: u.util.displayName(c, actor),
          desc: getShortDesc(c),
        })),
      }),
    );
  }

  if (showContents && objects.length > 0) {
    components.push(
      u.ui.panel({
        type: "grid",
        title: "Contents",
        content: objects.map((o: IDBObj) => ({ name: o.name, id: o.id })),
      }),
    );
  }

  if (exits.length > 0) {
    components.push(
      u.ui.panel({
        type: "grid",
        title: "Exits",
        content: exits.map((e: IDBObj) => {
          const parts = ((e.state.name as string) || e.name || "").split(";");
          return { name: parts[0], alias: parts[1] || parts[0] };
        }),
      }),
    );
  }

  const mapData = u.util.getMapData
    ? u.util.getMapData(target.id, 2)
    : null;
  u.ui.layout({
    components,
    meta: { targetId: target.id, type: "look", map: mapData },
  });
};
