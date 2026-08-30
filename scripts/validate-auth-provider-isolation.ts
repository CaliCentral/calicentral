import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// The public header previously imported next-auth/react's useSession/
// signOut/SessionProvider directly and unconditionally, so it only ever
// reflected an Auth.js session -- a genuinely-authenticated Supabase session
// showed as signed out, and "sign out" cleared a NextAuth cookie that was
// never set while leaving the real Supabase session untouched. This is a
// structural regression test for "Supabase mode must not depend on Auth.js
// session state": no file outside the Auth.js configuration itself may
// import next-auth's client-side session APIs. Server-side reads/writes
// already dispatch correctly through lib/auth/session.ts's getCurrentUser()/
// signOutCurrentSession(); this guards the client-side layer, which has no
// equivalent compile-time dispatch to catch a regression automatically.
const ALLOWED_FILES = new Set([
  "auth.ts", // the Auth.js configuration itself
  "app/api/auth/[...nextauth]/route.ts", // the Auth.js API route handler
]);

const FORBIDDEN_IMPORTS = ["next-auth/react", "useSession", "SessionProvider"];
const SCAN_ROOTS = ["app", "components", "lib"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

function collectFiles(dir: string, results: string[]): void {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      collectFiles(fullPath, results);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry))) {
      results.push(fullPath);
    }
  }
}

function validateNoClientSideAuthJsSessionUsage() {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) collectFiles(root, files);

  const violations: string[] = [];
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    if (ALLOWED_FILES.has(relativePath)) continue;
    // Strip line comments first -- this file's own explanatory comments
    // name next-auth/react's APIs verbatim to describe the rule, which
    // would otherwise flag itself and any file documenting the same
    // history.
    const content = readFileSync(file, "utf8")
      .split("\n")
      .map((line) => line.replace(/\/\/.*$/, ""))
      .join("\n");
    for (const forbidden of FORBIDDEN_IMPORTS) {
      // A bare substring match would also flag this file's own comments
      // explaining the rule -- require it to appear as part of an actual
      // import/require statement, not prose.
      const importLike = new RegExp(`(from\\s+["']|require\\(["'])[^"']*${forbidden.replace("/", "\\/")}|\\b${forbidden}\\s*\\(|<${forbidden}[\\s>]`);
      if (importLike.test(content)) violations.push(`${relativePath}: references "${forbidden}"`);
    }
  }

  assert.deepEqual(violations, [], `next-auth/react session APIs must not be used outside Auth.js's own config/route: ${JSON.stringify(violations)}`);
}

validateNoClientSideAuthJsSessionUsage();
console.log("Auth provider isolation validation passed: no client-side next-auth/react session usage outside Auth.js's own configuration.");
