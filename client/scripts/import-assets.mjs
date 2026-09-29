import { cp, mkdir, readdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
const sourcePublicDirectory = process.argv[2];
if (!sourcePublicDirectory)
  throw Error(
    "Usage: node scripts/import-assets.mjs /path/to/LORE_Browser_Source/public",
  );
const targetPublicDirectory = resolve("public");
await mkdir(targetPublicDirectory, { recursive: true });
async function copyAssets(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const sourcePath = resolve(source, entry.name),
      destinationPath = resolve(destination, entry.name);
    if (entry.isDirectory()) {
      await mkdir(destinationPath, { recursive: true });
      await copyAssets(sourcePath, destinationPath);
    } else if (
      ![".html", ".js", ".css", ".md"].includes(extname(entry.name)) &&
      !/\.(html|js|css)\.gz$/.test(entry.name) &&
      entry.name !== "package.json"
    ) {
      await cp(sourcePath, destinationPath);
    }
  }
}
await copyAssets(resolve(sourcePublicDirectory), targetPublicDirectory);
console.log(
  "Copied original assets and catalogue data. Source files unchanged.",
);
