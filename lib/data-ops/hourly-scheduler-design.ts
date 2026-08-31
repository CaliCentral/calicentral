import { competitionSourceProviders } from "@/lib/data-ops/provider-registry";

export type DataOpsJobDesign = {
  readonly key: string;
  readonly provider: string;
  readonly capability: "competitions" | "results" | "rankings" | "source-health";
  readonly cadenceMinutes: 60;
  readonly enabled: false;
  readonly writesEnabled: false;
};

export function hourlyDataOpsJobDesign(): readonly DataOpsJobDesign[] {
  return competitionSourceProviders.flatMap((provider) => [
    { key: `${provider.id}:competitions`, provider: provider.id, capability: "competitions", cadenceMinutes: 60, enabled: false, writesEnabled: false },
    { key: `${provider.id}:results`, provider: provider.id, capability: "results", cadenceMinutes: 60, enabled: false, writesEnabled: false },
    { key: `${provider.id}:rankings`, provider: provider.id, capability: "rankings", cadenceMinutes: 60, enabled: false, writesEnabled: false },
    { key: `${provider.id}:source-health`, provider: provider.id, capability: "source-health", cadenceMinutes: 60, enabled: false, writesEnabled: false },
  ] satisfies DataOpsJobDesign[]);
}
