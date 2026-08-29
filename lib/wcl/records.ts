import type { WclRulesetVersion } from "@/lib/wcl/types";

export type WclRecordStatus = "candidate" | "provisional" | "recognized" | "superseded" | "vacated";

export type WclRecord = {
  readonly id: string;
  readonly category: string;
  readonly rulesetVersion: WclRulesetVersion;
  readonly equipmentSpecificationVersion: string;
  readonly sanctionedEvent: boolean;
  readonly equipmentCompliant: boolean;
  readonly status: WclRecordStatus;
};

export function canRecognizeWclRecord(record: WclRecord): boolean {
  return record.sanctionedEvent && record.equipmentCompliant && record.status === "recognized";
}

