import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// Read-only, non-destructive export via Sanity's dataset export HTTP API.
// Never mutates or publishes anything. Output is NDJSON, the same format
// scripts/migration/sanity-to-supabase.ts already reads.
async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
  const token = process.env.SANITY_API_READ_TOKEN;
  const outputArg = process.argv.find((argument) => argument.startsWith("--output="));
  const outputPath = outputArg ? outputArg.slice("--output=".length) : ".tmp/sanity-production-export.ndjson";

  if (!projectId || !dataset || !apiVersion) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and NEXT_PUBLIC_SANITY_API_VERSION are required.");
  }
  if (!token) {
    throw new Error("SANITY_API_READ_TOKEN is required for a dataset export.");
  }

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/export/${dataset}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok || !response.body) {
    // Never include response headers/body in the thrown message -- an error
    // page from the API could echo back request details.
    throw new Error(`Sanity export request failed with status ${response.status}.`);
  }

  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await pipeline(Readable.fromWeb(response.body as import("stream/web").ReadableStream), createWriteStream(resolved));

  process.stdout.write(`Exported dataset "${dataset}" (project ${projectId}) to ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown export error"}\n`);
  process.exitCode = 1;
});
