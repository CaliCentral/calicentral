# Data provenance

Cali Central keeps editorial content, sporting facts, and member content as
three distinct data classes. A reusable `provenanceSource` Sanity object and
normalized TypeScript contract record provider, public URL, source title/type,
external record ID, publication/check dates, and verification state.

## Sporting-data rule

Important results, rankings, measurements, and records must be able to answer
where they came from. Unknown values remain absent rather than becoming zero.
States such as submitted, provisional, source confirmed, official, corrected,
disputed, disqualified, withdrawn, and superseded are not interchangeable.

`sportingResult` relates a competition edition to an athlete or team, optional
ruleset, division/event, structured performances, penalties, equipment
determination, source, and supersession history. `sportingMeasurement` carries
value, unit, date, and source and is available on canonical athlete records. A
higher numeric value alone never creates a WCL record; sanctioned-event,
equipment, status, and version checks remain required.

URLs are validated but never preview-fetched. Public queries select public
source fields only. Private identity evidence, eligibility details, phone,
email, and editorial notes are excluded at query level rather than hidden in
the UI.
