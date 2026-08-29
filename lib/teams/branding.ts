const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function normalizedHex(value: string, fallback: string): string {
  return HEX_COLOR.test(value) ? value.toUpperCase() : fallback;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(
    normalizedHex(first, "#151515"),
  );
  const secondLuminance = relativeLuminance(
    normalizedHex(second, "#FFFFFF"),
  );
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function accessibleTeamMarkColors(input: {
  readonly primaryColor: string;
  readonly secondaryColor: string;
}): {readonly backgroundColor: string; readonly color: string} {
  const backgroundColor = normalizedHex(input.primaryColor, "#151515");
  const requestedColor = normalizedHex(input.secondaryColor, "#FFFFFF");

  if (contrastRatio(backgroundColor, requestedColor) >= 4.5) {
    return {backgroundColor, color: requestedColor};
  }

  const light = "#FFFFFF";
  const dark = "#111111";
  return {
    backgroundColor,
    color:
      contrastRatio(backgroundColor, light) >=
      contrastRatio(backgroundColor, dark)
        ? light
        : dark,
  };
}
