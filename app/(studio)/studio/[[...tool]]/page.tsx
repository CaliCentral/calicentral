import type { Metadata } from "next";
import { NextStudio } from "next-sanity/studio";

import config from "@/sanity.config";
import { isSanityConfigured } from "@/sanity/env";

export { viewport } from "next-sanity/studio";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Cali Central Studio",
  description: "Private editorial workspace for Cali Central.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101112] px-5 py-16 text-white">
        <section className="w-full max-w-2xl border border-white/15 bg-[#181a1d] p-7 sm:p-10">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#f43f50]">
            Studio setup required
          </p>
          <h1 className="mt-5 text-4xl font-black uppercase tracking-[-0.05em] sm:text-5xl">
            Connect a Sanity project
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
            The public site is safely using local fictional content. To open
            Studio, copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and provide a real project ID and dataset.
          </p>
          <pre className="mt-7 overflow-x-auto border border-white/10 bg-black/30 p-4 text-xs leading-6 text-white/80">
            <code>
              NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id{"\n"}
              NEXT_PUBLIC_SANITY_DATASET=production{"\n"}
              NEXT_PUBLIC_SANITY_API_VERSION=2026-07-01
            </code>
          </pre>
          <p className="mt-6 text-sm leading-6 text-white/55">
            No placeholder project is queried, and no remote dataset is created
            by this repository.
          </p>
        </section>
      </main>
    );
  }

  return <NextStudio config={config} />;
}
