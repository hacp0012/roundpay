const DEFAULT_NAME = 'roundPay';
const DEFAULT_COLOR = '#3f3bbd';

function normalizeHex(input: string): string {
  let hex = input.trim().replace(/^['"]|['"]$/g, '');
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return DEFAULT_COLOR;
  return hex.toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export const APP_NAME = (import.meta.env.APP_NAME || DEFAULT_NAME).trim() || DEFAULT_NAME;
export const APP_COLOR = normalizeHex(import.meta.env.APP_COLOR || DEFAULT_COLOR);

const rgb = hexToRgb(APP_COLOR);
export const APP_COLOR_RGB = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

export function splitAppName(name: string = APP_NAME): { lead: string; accent: string } {
  const parts = name.split(/(?=[A-Z])/).filter(Boolean);
  if (parts.length >= 2) {
    return { lead: parts.slice(0, -1).join(''), accent: parts[parts.length - 1] };
  }
  return { lead: name, accent: '' };
}

/** Apply env branding to CSS variables and document metadata. */
export function applyAppBranding() {
  const root = document.documentElement;
  root.style.setProperty('--app-color', APP_COLOR);
  root.style.setProperty('--app-color-rgb', APP_COLOR_RGB);

  const title = `${APP_NAME} — Financement Participatif, Tontines & Cagnottes`;
  document.title = title;

  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', APP_NAME);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f7f9fe');
}
