import type { Metadata } from "next";
import Link from "next/link";

import { externalStudioUrl } from "@/lib/site/studio";

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
  return (
    <main className="grid min-h-screen place-items-center bg-[#101112] px-5 py-16 text-white">
      <section className="w-full max-w-2xl border border-white/15 bg-[#181a1d] p-7 sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#f43f50]">
          Editorial workspace
        </p>
        <h1 className="mt-5 text-4xl font-black uppercase tracking-[-0.05em] sm:text-5xl">
          Sanity Studio is separate
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
          The editorial Studio is deployed independently so its browser editor
          is not bundled into the public Cali Central Worker. The application
          still reads canonical content from the existing Sanity project.
        </p>
        {externalStudioUrl ? (
          <Link
            href={externalStudioUrl}
            className="mt-7 inline-flex min-h-12 items-center border border-[#f43f50]/60 px-5 text-sm font-bold uppercase tracking-[0.1em] text-[#f43f50] transition-colors hover:bg-[#f43f50] hover:text-[#101112] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f43f50]"
          >
            Open standalone Studio ↗
          </Link>
        ) : (
          <div className="mt-7 border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/70">
            The standalone Studio has been prepared locally. An administrator
            must deploy it and configure <code>NEXT_PUBLIC_SANITY_STUDIO_URL</code>
            before this link can open the hosted editor.
          </div>
        )}
        <p className="mt-6 text-sm leading-6 text-white/55">
          Studio access remains authenticated and separately authorized by
          Sanity. No token is exposed by this page.
        </p>
      </section>
    </main>
  );
}
