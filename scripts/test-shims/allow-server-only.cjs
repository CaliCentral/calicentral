// Preload script (Node's classic `--require` CJS-load mechanism), used ONLY
// when explicitly registered for a scripts/validate-*.ts run (see
// package.json's "test:auth" script). It patches Module._resolveFilename in
// THIS process only, so it has no effect on `next build`/`next dev`, which
// resolve the bare "server-only" specifier through their own bundler and
// never load this file. Its only job is letting plain `node --import tsx`
// scripts import modules that carry `import "server-only"` so their
// framework-agnostic logic can be asserted on directly, the same way this
// repo's other scripts/validate-*.ts files already do for non-server-only
// modules.
/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preload scripts must be CommonJS. */
const Module = require("node:module");
const path = require("node:path");
/* eslint-enable @typescript-eslint/no-require-imports */

const stubPath = path.join(__dirname, "server-only-stub.cjs");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function patchedResolveFilename(request, ...rest) {
  if (request === "server-only") {
    return stubPath;
  }
  return originalResolveFilename.call(this, request, ...rest);
};
