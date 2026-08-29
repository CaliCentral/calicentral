import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";

import {Container} from "@/components/ui/container";
import {featureConfig} from "@/lib/features/config";
import {getWclRules} from "@/lib/wcl/rules";
import {createPublicMetadata} from "@/lib/site/metadata";

export const metadata: Metadata = createPublicMetadata({path: "/wcl", title: "World Calisthenics League", description: "Version-aware Cali Central presentation foundations for WCL teams, matches, and standings.", noIndex: !featureConfig.wcl});

export default function WclPage() {
  if (!featureConfig.wcl) notFound();
  const active = getWclRules(featureConfig.activeWclRuleset);
  return <><header className="technical-grid bg-canvas py-20"><Container><p className="font-mono text-xs font-bold uppercase tracking-[0.17em] text-accent">WCL / Version-aware competition system</p><h1 className="mt-5 max-w-5xl font-display text-7xl font-black uppercase leading-[0.88] tracking-[-0.065em] text-ink">World Calisthenics League</h1><p className="mt-7 max-w-3xl text-base leading-7 text-muted">Active project calculation setting: <strong className="text-ink">{active.publicLabel}</strong>. Proposed material is never presented as adopted official rules.</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/wcl/rules" className="inline-flex min-h-12 items-center bg-accent px-5 text-xs font-bold uppercase tracking-[0.12em] text-canvas">Rules and version boundary</Link><Link href="/standings" className="inline-flex min-h-12 items-center border border-white/20 px-5 text-xs font-bold uppercase tracking-[0.12em] text-ink">League standings</Link></div></Container></header></>;
}

