import { ActionForm } from "@/components/operations/action-form";
import { createTrainingSessionAction } from "@/lib/training/actions";
import type { MovementDefinition } from "@/lib/training/types";

const inputClass = "mt-2 min-h-11 w-full border border-white/15 bg-canvas px-3 text-sm text-ink focus:border-accent focus:outline-none";

export function TrainingSessionForm({ movements }: { readonly movements: readonly MovementDefinition[] }) {
  return (
    <ActionForm action={createTrainingSessionAction} submitLabel="Log training session" pendingLabel="Saving session…">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Date"><input type="date" name="sessionDate" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} /></Field>
        <Field label="Title"><input name="title" maxLength={120} placeholder="Pull session" className={inputClass} /></Field>
        <Field label="Duration (minutes)"><input type="number" name="durationMinutes" min={1} max={1440} className={inputClass} /></Field>
        <Field label="Bodyweight (kg)"><input type="number" name="bodyweightKg" min={20} max={350} step="0.1" className={inputClass} /></Field>
      </div>
      <Field label="Session notes"><textarea name="notes" rows={3} maxLength={4000} className={`${inputClass} py-3`} /></Field>
      <Field label="Visibility">
        <select name="visibility" defaultValue="private" className={inputClass}>
          <option value="private">Private</option>
          <option value="followers">Followers</option>
          <option value="public">Public</option>
        </select>
      </Field>
      <div className="mt-7 space-y-5">
        {Array.from({ length: 4 }, (_, movementIndex) => (
          <fieldset key={movementIndex} className="border border-white/12 p-4 sm:p-5">
            <legend className="px-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent">Movement {movementIndex + 1}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Catalog movement">
                <select name={`movementId${movementIndex}`} defaultValue="" className={inputClass}>
                  <option value="">Choose or use custom name</option>
                  {movements.map((movement) => <option key={movement.id} value={movement.id}>{movement.name}</option>)}
                </select>
              </Field>
              <Field label="Custom movement"><input name={`customMovementName${movementIndex}`} maxLength={120} className={inputClass} /></Field>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[76rem] text-left text-sm">
                <caption className="sr-only">Sets for movement {movementIndex + 1}</caption>
                <thead className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted"><tr><th className="p-2">Set</th><th className="p-2">Reps</th><th className="p-2">Added kg</th><th className="p-2">Total kg</th><th className="p-2">Hold sec</th><th className="p-2">Distance m</th><th className="p-2">RPE</th><th className="p-2">RIR</th><th className="p-2">Score</th><th className="p-2">Completion</th><th className="p-2">Progression</th></tr></thead>
                <tbody>{Array.from({ length: 3 }, (_, setIndex) => (
                  <tr key={setIndex} className="border-t border-white/10">
                    <th scope="row" className="p-2">{setIndex + 1}</th>
                    <Cell name={`reps${movementIndex}_${setIndex}`} min={0} step="1" />
                    <Cell name={`addedLoadKg${movementIndex}_${setIndex}`} min={-100} step="0.25" />
                    <Cell name={`totalWeightKg${movementIndex}_${setIndex}`} min={0} step="0.25" />
                    <Cell name={`durationSeconds${movementIndex}_${setIndex}`} min={0} step="0.1" />
                    <Cell name={`distanceMeters${movementIndex}_${setIndex}`} min={0} step="0.1" />
                    <Cell name={`rpe${movementIndex}_${setIndex}`} min={0} max={10} step="0.5" />
                    <Cell name={`rir${movementIndex}_${setIndex}`} min={0} max={20} step="1" />
                    <Cell name={`score${movementIndex}_${setIndex}`} min={-1000000} max={1000000} step="0.01" />
                    <td className="p-2"><select name={`completion${movementIndex}_${setIndex}`} aria-label={`Movement ${movementIndex + 1} set ${setIndex + 1} completion`} className="min-h-10 w-28 border border-white/15 bg-canvas px-2 text-ink"><option value="">—</option><option value="attempted">Attempted</option><option value="completed">Completed</option><option value="failed">Failed</option></select></td>
                    <td className="p-2"><input name={`progression${movementIndex}_${setIndex}`} maxLength={120} aria-label={`Movement ${movementIndex + 1} set ${setIndex + 1} progression`} className="min-h-10 w-full border border-white/15 bg-canvas px-2 text-ink" /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </fieldset>
        ))}
      </div>
    </ActionForm>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return <label className="mt-4 block"><span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>{children}</label>;
}

function Cell({ name, min, max, step }: { readonly name: string; readonly min: number; readonly max?: number; readonly step: string }) {
  return <td className="p-2"><input type="number" name={name} min={min} max={max} step={step} aria-label={name} className="min-h-10 w-24 border border-white/15 bg-canvas px-2 text-ink" /></td>;
}
