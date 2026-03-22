import type { IPlugin } from "jsr:@ursamu/ursamu";
import * as dpath from "jsr:@std/path";
import { registerFingerCommands } from "./finger.ts";
import { registerOocTalkCommands } from "./ooc.ts";
import { registerNameColorCommands } from "./namecolor.ts";
import { registerStaffCommands } from "./staff.ts";

/**
 * Rhost Vision — Plugin Loader (v1.1.0)
 *
 * On startup:
 *   1. Backs up any existing system scripts that will be overridden.
 *   2. Copies the plugin's styled replacements into system/scripts/.
 *   3. Registers native commands: +finger, ooc, +namecolor, +staff.
 *
 * On removal:
 *   Restores every backed-up script. Command handlers are garbage-collected.
 *
 * Script overrides installed:
 *   look, who, where, mail, page   — original Rhost Vision formatting
 *   score, examine, inventory      — added in v1.1.0
 *
 * Configuration:
 *   Edit theme.ts to change colors, widths, and layout options.
 *   layout.ts provides shared utilities for native commands (+finger, +staff, …).
 */

const plugin: IPlugin = {
  name: "rhost-vision",
  description:
    "Rhost-style room display — bordered headers, sectioned exits, player idle times, short descriptions",
  version: "1.1.0",

  init: async () => {
    const __dirname = dpath.dirname(dpath.fromFileUrl(import.meta.url));
    const scriptsDir = dpath.join(Deno.cwd(), "system", "scripts");
    const overrides = [
      // Original Rhost Vision scripts
      "look.ts",
      "who.ts",
      "where.ts",
      "mail.ts",
      "page.ts",
      // Added in v1.1.0
      "score.ts",
      "examine.ts",
      "inventory.ts",
    ];

    await Deno.mkdir(scriptsDir, { recursive: true });

    for (const file of overrides) {
      const src    = dpath.join(__dirname, file);
      const dest   = dpath.join(scriptsDir, file);
      const backup = dpath.join(scriptsDir, file.replace(".ts", ".original.ts"));

      try {
        // Only back up once — don't overwrite an existing .original.ts.
        try {
          await Deno.stat(backup);
        } catch {
          try {
            await Deno.copyFile(dest, backup);
            console.log(`[rhost-vision] Backed up original ${file}`);
          } catch {
            // No pre-existing script to back up — that's fine.
          }
        }
        await Deno.copyFile(src, dest);
        console.log(`[rhost-vision] Installed ${file} override.`);
      } catch (e) {
        console.error(`[rhost-vision] Failed to install ${file}:`, e);
      }
    }

    // Register native commands (these aren't system scripts).
    registerFingerCommands();
    registerOocTalkCommands();
    registerNameColorCommands();
    registerStaffCommands(); // added in v1.1.0

    console.log("[rhost-vision] v1.1.0 ready.");
    return true;
  },

  remove: async () => {
    const scriptsDir = dpath.join(Deno.cwd(), "system", "scripts");
    const overrides = [
      "look.ts", "who.ts", "where.ts", "mail.ts", "page.ts",
      "score.ts", "examine.ts", "inventory.ts",
    ];

    for (const file of overrides) {
      const dest   = dpath.join(scriptsDir, file);
      const backup = dpath.join(scriptsDir, file.replace(".ts", ".original.ts"));
      try {
        await Deno.stat(backup);
        await Deno.copyFile(backup, dest);
        await Deno.remove(backup);
        console.log(`[rhost-vision] Restored original ${file}.`);
      } catch {
        // No backup — either never installed or already removed.
        try { await Deno.remove(dest); } catch { /* already gone */ }
      }
    }

    console.log("[rhost-vision] Removed.");
  },
};

export default plugin;
