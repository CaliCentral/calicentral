import assert from "node:assert/strict";

import { buildRateLimitKey } from "@/lib/community/upstash-rate-limit";

function validateStageNamespacing() {
  const preview = buildRateLimitKey("strict", "member-1", "preview");
  const production = buildRateLimitKey("strict", "member-1", "production");
  assert.notEqual(
    preview,
    production,
    "preview and production must never resolve to the same rate-limit key, even for the same policy and member",
  );
  assert.match(preview, /^calicentral:rate:preview:strict:member-1$/, "the stage segment must sit between the namespace and the policy name");
}

function validatePolicyAndMemberIsolation() {
  const strict = buildRateLimitKey("strict", "member-1", "preview");
  const upload = buildRateLimitKey("upload", "member-1", "preview");
  assert.notEqual(strict, upload, "different policies for the same member must not share a counter");

  const memberA = buildRateLimitKey("strict", "member-a", "preview");
  const memberB = buildRateLimitKey("strict", "member-b", "preview");
  assert.notEqual(memberA, memberB, "different members under the same policy must not share a counter");
}

function validateUnknownStageFallback() {
  const key = buildRateLimitKey("strict", "member-1", undefined);
  assert.match(key, /^calicentral:rate:unknown:strict:member-1$/, "a missing SITE_STAGE must fall back to an explicit 'unknown' segment, never an empty one that could collide with a real stage");
}

validateStageNamespacing();
validatePolicyAndMemberIsolation();
validateUnknownStageFallback();

process.stdout.write("Rate-limit key namespacing validation passed: stage isolation, policy isolation, member isolation, unknown-stage fallback.\n");
