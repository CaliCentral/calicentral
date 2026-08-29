const configuredStudioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL?.trim();

function validatedExternalStudioUrl(value: string | undefined) {
  if (!value) return undefined;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return undefined;

    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export const externalStudioUrl = validatedExternalStudioUrl(
  configuredStudioUrl,
);

export const studioUrl = externalStudioUrl ?? "/studio";

export function studioIntentUrl(id: string, type?: string) {
  if (!externalStudioUrl) return "/studio";

  const url = new URL(externalStudioUrl);
  const basePath = url.pathname.replace(/\/$/, "");
  const intent = `id=${encodeURIComponent(id)}${
    type ? `;type=${encodeURIComponent(type)}` : ""
  }`;

  url.pathname = `${basePath}/intent/edit/${intent}`;
  return url.toString();
}
