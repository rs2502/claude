// Schreibt public/fonts/*.woff2 als Base64 nach src/font-data.ts, damit beim Rendern nichts nachgeladen wird.
// usage: node scripts/embed-fonts.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public/fonts");
const lines = ["// Automatisch erzeugt von scripts/embed-fonts.mjs – nicht von Hand ändern.", ""];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".woff2")).sort()) {
  const name = f.replace(".woff2", "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const b64 = fs.readFileSync(path.join(dir, f)).toString("base64");
  lines.push(`export const ${name} = "data:font/woff2;base64,${b64}";`);
}
fs.writeFileSync(path.join(root, "src/font-data.ts"), lines.join("\n") + "\n");
console.log("src/font-data.ts geschrieben");
