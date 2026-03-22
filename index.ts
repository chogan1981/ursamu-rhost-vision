import type { IPlugin } from "../../@types/IPlugin.ts";
import * as dpath from "@std/path";
import { registerFingerCommands } from "./finger.ts";
import { registerOocTalkCommands } from "./ooc.ts";
import { registerNameColorCommands } from "./namecolor.ts";

const plugin: IPlugin = {
  name: "rhost-vision",
  description: "Rhost-style room display — bordered headers, sectioned exits, player idle times, short descriptions",
  version: "1.0.0",
  init: async () => {
    const __dirname = dpath.dirname(dpath.fromFileUrl(import.meta.url));
    const scriptsDir = dpath.join(Deno.cwd(), "system", "scripts");
    const overrides = ["look.ts", "who.ts", "where.ts", "mail.ts", "page.ts"];

    for (const file of overrides) {
      const src = dpath.join(__dirname, file);
      const dest = dpath.join(scriptsDir, file);
      const backup = dpath.join(scriptsDir, file.replace(".ts", ".original.ts"));

      try {
        try {
          await Deno.stat(backup);
        } catch {
          await Deno.copyFile(dest, backup);
          console.log(`[rhost-vision] Backed up original ${file}`);
        }
        await Deno.copyFile(src, dest);
        console.log(`[rhost-vision] Installed ${file} override.`);
      } catch (e) {
        console.error(`[rhost-vision] Failed to install ${file}:`, e);
      }
    }

    // Register +finger, ooc talk, and +namecolor commands
    registerFingerCommands();
    registerOocTalkCommands();
    registerNameColorCommands();

    return true;
  },
  remove: async () => {
    const scriptsDir = dpath.join(Deno.cwd(), "system", "scripts");
    const overrides = ["look.ts", "who.ts", "where.ts", "mail.ts", "page.ts"];

    for (const file of overrides) {
      const dest = dpath.join(scriptsDir, file);
      const backup = dpath.join(scriptsDir, file.replace(".ts", ".original.ts"));
      try {
        await Deno.stat(backup);
        await Deno.copyFile(backup, dest);
        console.log(`[rhost-vision] Restored original ${file} from backup.`);
      } catch {
        console.warn(`[rhost-vision] No backup found for ${file}.`);
      }
    }
  },
};

export default plugin;
