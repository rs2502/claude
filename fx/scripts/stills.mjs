// Standbilder zur Kontrolle: node scripts/stills.mjs <Composition> <ausgabe-ordner> <frame,frame,…> [props.json]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [id, outDir, frameList, propsFile] = process.argv.slice(2);
if (!id || !outDir || !frameList) {
  console.error("usage: node scripts/stills.mjs <Composition> <ausgabe-ordner> <frame,frame,…> [props.json]");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputProps = propsFile ? JSON.parse(fs.readFileSync(propsFile, "utf8")) : {};
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const composition = await selectComposition({ serveUrl, id, inputProps });
fs.mkdirSync(outDir, { recursive: true });
for (const f of frameList.split(",").map(Number)) {
  const output = path.join(outDir, `${id}-${String(f).padStart(5, "0")}.png`);
  await renderStill({ serveUrl, composition, frame: f, output, inputProps, scale: 0.5 });
  console.log(output);
}
