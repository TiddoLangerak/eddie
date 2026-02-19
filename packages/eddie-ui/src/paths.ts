import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export const staticDir = join(__dirname, "..", "static");
export const srcStaticDir = join(__dirname, "..", "src", "static");
export const distStaticDir = join(__dirname, "..", "dist", "static");
