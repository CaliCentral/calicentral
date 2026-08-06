import type { Metadata } from "next";
import { draftMode } from "next/headers";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSiteSettings } from "@/lib/content";
import {
  publicRobotsMetadata,
  resolveSocialImage,
} from "@/lib/site/metadata";
import { isSanityConfigured } from "@/sanity/env";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, preview] = await Promise.all([
    getSiteSettings({ stega: false }),
    draftMode(),
  ]);
  const seo = settings.defaultSeo;
  const title = seo.title ?? settings.siteTitle;
  const description = seo.description ?? settings.siteDescription;
  const image = resolveSocialImage(
    seo.image,
    `${title} — independent calisthenics media`,
  );

  return {
    title: {
      default: title,
      template: `%s | ${settings.shortTitle}`,
    },
    description,
    robots: publicRobotsMetadata(
      Boolean(seo.noIndex) || preview.isEnabled,
    ),
    openGraph: {
      title,
      description,
      type: "website",
      siteName: settings.shortTitle,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: image.url,
          alt: image.alt,
        },
      ],
    },
  };
}

async function DraftModeRuntime() {
  const [{ DraftModeClientRuntime }, { SanityLive }] = await Promise.all([
    import("@/components/sanity/draft-mode-client-runtime"),
    import("@/sanity/lib/live"),
  ]);

  return (
    <>
      <SanityLive />
      <DraftModeClientRuntime />
    </>
  );
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, preview] = await Promise.all([
    getSiteSettings(),
    draftMode(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 bg-accent px-4 py-3 text-sm font-bold text-canvas transition-transform focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Skip to main content
      </a>
      <SiteHeader navigation={settings.navigation} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter
        groups={settings.footerGroups}
        prototypeNotice={settings.prototypeNotice}
        footerStatement={settings.footerStatement}
      />
      {isSanityConfigured && preview.isEnabled ? (
        <DraftModeRuntime />
      ) : null}
    </div>
  );
}
