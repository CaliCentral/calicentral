# WCL rules engine

WCL calculations live in pure modules under `lib/wcl/`; React components only
render their results. Every calculation requires an explicit ruleset version.

## Version boundary

- `2.0` — current official metadata/default project setting. The repository
  does not guess missing official calculations, so calculation calls fail.
- `3.0-proposed` — proposed calculation model, always labeled “Proposed WCL
  Ruleset 3.0.” It is never described as adopted official rules.

`WCL_ACTIVE_RULESET` is the explicit setting and defaults to `2.0`.
`WCL_FEATURES_ENABLED` controls public `/wcl` and `/wcl/rules` routes. Historical
results have a Sanity ruleset reference so later changes cannot recalculate
them silently.

## Encoded proposed calculations

The proposed engine covers four unique specialist starters, a reserve and
captain; one franchise per athlete/season; 10-point Strength, Control,
Endurance, and Freestyle divisions; the 25-point Final Stand; strength and hold
tiebreaks; five-judge freestyle scoring with high/low totals removed; Final
Stand assignment/progress/no-rep comparison; record eligibility; readiness;
and deterministic season standings through average completed Final Stand time.
An unresolved season tie returns `requiresPlayoff`; no playoff number is
invented.

Control hold inputs preserve the judge-entered legal-state fields needed for
feet, elbow, inverted-position, marked-hand-box, and official-stop decisions.
Final Stand validates the versioned station order and four unique starters.
Official-role and captain-challenge contracts are foundations only. Recovery
intervals are versioned in the rules contract but remain empty because the
supplied implementation brief does not state durations; no timing value is
guessed.

The tests use only fictional IDs and implementation summaries. This document
does not reproduce the WCL rulebook.
