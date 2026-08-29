import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const projectRoot = process.cwd();
const compiledEnvironmentPath = path.join(
  projectRoot,
  ".open-next",
  "cloudflare",
  "next-env.mjs",
);
const sanitizedEnvironmentModule = [
  "// Runtime configuration must come from Cloudflare vars and secrets.",
  "export const production = {};",
  "export const development = {};",
  "export const test = {};",
  "",
].join("\n");
const sensitiveNamePattern =
  /(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|CALI_CENTRAL_(?:ADMIN|EDITOR)_EMAILS)/;

function readSensitiveLocalValues() {
  const localEnvironmentPath = path.join(projectRoot, ".env.local");

  if (!fs.existsSync(localEnvironmentPath)) {
    return [];
  }

  const values = parseEnv(fs.readFileSync(localEnvironmentPath, "utf8"));

  return Object.entries(values)
    .filter(
      ([name, value]) =>
        sensitiveNamePattern.test(name) &&
        typeof value === "string" &&
        value.length >= 8,
    )
    .map(([name, value]) => ({ name, value }));
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listFiles(entryPath);
    }

    return entry.isFile() ? [entryPath] : [];
  });
}

if (process.argv.includes("--preflight")) {
  const developmentLockPath = path.join(
    projectRoot,
    ".next",
    "dev",
    "lock",
  );

  if (fs.existsSync(developmentLockPath)) {
    throw new Error(
      "Stop the local Next development server before building the Cloudflare artifact.",
    );
  }

  console.log("No concurrent Next development output: PASS");
  process.exit(0);
}

if (!fs.existsSync(compiledEnvironmentPath)) {
  throw new Error(
    "OpenNext environment output is missing. Run this guard after a successful OpenNext build.",
  );
}

fs.writeFileSync(
  compiledEnvironmentPath,
  sanitizedEnvironmentModule,
  "utf8",
);

const sensitiveValues = readSensitiveLocalValues();
const outputRoot = path.join(projectRoot, ".open-next");
const intermediateNextBuildRoot = path.join(projectRoot, ".next");
const leakedNames = new Set();

for (const filePath of listFiles(outputRoot)) {
  const contents = fs.readFileSync(filePath);

  for (const { name, value } of sensitiveValues) {
    if (contents.includes(Buffer.from(value))) {
      leakedNames.add(name);
    }
  }
}

if (leakedNames.size > 0) {
  throw new Error(
    `OpenNext output still contains local sensitive values for: ${[
      ...leakedNames,
    ].join(", ")}`,
  );
}

fs.rmSync(intermediateNextBuildRoot, { recursive: true, force: true });

console.log(
  "OpenNext environment fallbacks sanitized and intermediate Next output removed: PASS",
);
