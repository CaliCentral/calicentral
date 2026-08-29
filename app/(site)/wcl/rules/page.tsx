import type {Metadata} from "next";
import {notFound} from "next/navigation";

import {Container} from "@/components/ui/container";
import {featureConfig} from "@/lib/features/config";
import {getWclRules} from "@/lib/wcl/rules";
import {createPublicMetadata} from "@/lib/site/metadata";

export const metadata: Metadata = createPublicMetadata({path: "/wcl/rules", title: "WCL ruleset versions", description: "Implementation-level WCL version status and calculation boundaries.", noIndex: !featureConfig.wcl});

export default function WclRulesPage() {
  if (!featureConfig.wcl) notFound();
  const official = getWclRules("2.0");
  const proposed = getWclRules("3.0-proposed");
  return <section className="technical-grid bg-canvas py-16 sm:py-20 lg:py-24"><Container><p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-accent">WCL / Ruleset metadata</p><h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.06em] text-ink sm:text-7xl">Version boundary</h1><p className="mt-6 max-w-3xl text-base leading-7 text-muted">This page summarizes implementation behavior; it does not reproduce the rulebook.</p><div className="mt-10 grid gap-5 md:grid-cols-2"><RulesCard title={official.publicLabel} status="Current official metadata" body="Version 2.0 remains the default active project setting. Calculations are disabled where the repository does not encode the complete official formula." /><RulesCard title={proposed.publicLabel} status="Proposal — not adopted" body="The tested proposal models four 10-point specialties, a 25-point Final Stand, specialist roster validation, event tiebreaks, and deterministic season standings." /></div><h2 className="mt-14 font-display text-4xl font-black uppercase tracking-[-0.05em] text-ink">Proposed match flow</h2><ol className="mt-6 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4">{proposed.sequence.map((step, index) => <li key={step} className="bg-surface p-5"><span className="font-mono text-xs font-bold text-accent">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 font-bold uppercase text-ink">{step}</p></li>)}</ol></Container></section>;
}

function RulesCard({title, status, body}: {readonly title: string; readonly status: string; readonly body: string}) {return <article className="border border-white/15 bg-surface p-6"><p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-accent">{status}</p><h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em] text-ink">{title}</h2><p className="mt-5 text-sm leading-6 text-muted">{body}</p></article>;}

