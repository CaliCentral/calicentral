import { ActionForm } from "@/components/operations/action-form";
import { FieldShell, SelectInput, TextInput } from "@/components/operations/field";
import { OperationsPanel } from "@/components/operations/page-shell";
import { PendingButton } from "@/components/operations/pending-button";
import { createProvenanceAction } from "@/lib/supabase/admin-actions";
import { SupabaseAdminRepository } from "@/lib/supabase/admin-repository";
import { provenanceTrustClasses } from "@/lib/supabase/admin-validation";

const repository = new SupabaseAdminRepository();

type ProvenancePanelProps = {
  readonly targetType: string;
  readonly targetId: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

/**
 * Read-only inspector plus an attach form for the provenance/audit trail on
 * one record. provenance/source_records/audit_events all carry their own RLS
 * (editorial.review or sport.write_source_truth for the first two,
 * admin-only for audit_events) -- a viewer without the right capability will
 * simply see empty lists here, not an error, because these queries never
 * bypass RLS.
 */
export async function ProvenancePanel({ targetType, targetId }: ProvenancePanelProps) {
  const [provenance, auditEvents, sourceOptions] = await Promise.all([
    repository.listProvenanceForTarget(targetType, targetId),
    repository.listAuditEventsForTarget(targetType, targetId),
    repository.listSourceRecords(),
  ]);

  return (
    <OperationsPanel title="Provenance &amp; source truth" eyebrow="Trust boundary">
      <p className="text-sm leading-6 text-muted">
        Every claim here traces to a source record with its own trust class.
        Source-confirmed, identity-confirmed, editorial-reviewed,
        official-result, external-ranking, and Cali-Central-ranking are
        distinct trust levels that never imply one another.
      </p>

      {provenance.length === 0 ? (
        <p className="mt-4 border border-dashed border-white/15 p-4 text-sm text-muted">
          No provenance recorded for this record yet (or your account lacks
          editorial.review/sport.write_source_truth, in which case Supabase
          RLS is correctly hiding these rows from you).
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {provenance.map((entry) => (
            <li key={entry.id} className="border border-white/10 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-accent">
                  {entry.trust_class}
                </span>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                  {entry.assertion_status}
                </span>
              </div>
              {entry.field_path ? (
                <p className="mt-1 text-xs text-muted">Field: {entry.field_path}</p>
              ) : null}
              {(() => {
                // Supabase-js infers a nested single-row FK join as an array
                // without generated Database types to tell it otherwise;
                // provenance.source_record_id is NOT NULL with a many-to-one
                // FK, so there is always exactly one row here.
                const source = Array.isArray(entry.source_records) ? entry.source_records[0] : entry.source_records;
                if (!source) return null;
                return (
                  <p className="mt-1 text-ink">
                    {source.title ?? source.provider}
                    {source.public_url ? (
                      <>
                        {" "}
                        &middot;{" "}
                        <a
                          href={source.public_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-accent underline underline-offset-2"
                        >
                          source link
                        </a>
                      </>
                    ) : null}
                    <span className="ml-2 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted">
                      {source.verification_state}
                    </span>
                  </p>
                );
              })()}
            </li>
          ))}
        </ul>
      )}

      <details className="mt-6 border border-white/10 p-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-ink">
          Attach a provenance record
        </summary>
        <ActionForm action={createProvenanceAction} submitLabel="Attach provenance" pendingLabel="Attaching…" className="mt-4 space-y-4" onSuccess="refresh">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <FieldShell id="prov-source" label="Source record" required>
            <SelectInput id="prov-source" name="sourceRecordId" required defaultValue="">
              <option value="" disabled>
                Choose a source record…
              </option>
              {sourceOptions.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.provider} — {source.title ?? source.source_type}
                </option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="prov-trust" label="Trust class" required>
            <SelectInput id="prov-trust" name="trustClass" required defaultValue="">
              <option value="" disabled>
                Choose a trust class…
              </option>
              {provenanceTrustClasses.map((trustClass) => (
                <option key={trustClass} value={trustClass}>
                  {trustClass}
                </option>
              ))}
            </SelectInput>
          </FieldShell>
          <FieldShell id="prov-field" label="Field path" description="Optional. Which field on the target record this provenance backs, e.g. &quot;name&quot; or &quot;country&quot;.">
            <TextInput id="prov-field" name="fieldPath" />
          </FieldShell>
          <PendingButton pendingLabel="Attaching…" className="bg-accent text-canvas hover:bg-accent-strong">
            Attach provenance
          </PendingButton>
        </ActionForm>
      </details>

      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink">Admin-only audit trail</h3>
        {auditEvents.length === 0 ? (
          <p className="mt-2 text-xs text-muted">No audit events visible (empty for non-admins by RLS, or none recorded).</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {auditEvents.map((event) => (
              <li key={event.id} className="text-xs text-muted">
                <span className="font-mono uppercase tracking-[0.08em] text-ink">{event.event_type}</span>{" "}
                &middot; {event.summary} &middot; {formatDate(event.created_at)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </OperationsPanel>
  );
}
