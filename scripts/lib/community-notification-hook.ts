import type { D1DatabaseLike } from "../../lib/community/repository";
import { CanonicalUpdateProducer, type CanonicalUpdateInput } from "../../lib/community/canonical-updates";

/**
 * Importer integration boundary. Call only after a reviewed canonical write has
 * succeeded and its public gate has been re-read as approved. Dry runs, sample
 * data, internal review records, and failed/partial batches must never call it.
 */
export async function notifyApprovedCanonicalUpdate(
  db: D1DatabaseLike,
  update: CanonicalUpdateInput,
): Promise<number> {
  return new CanonicalUpdateProducer(db).produce(update);
}
