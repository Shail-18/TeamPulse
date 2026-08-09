/**
 * Generates the standard minimalist user profile logo icon for everyone as requested.
 * Produces a clean vector silhouette SVG profile logo icon.
 */
export function getProfileLogoSvg(_seed: string = 'User'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="46" stroke="#0f172a" stroke-width="6" fill="#ffffff"/>
    <circle cx="50" cy="38" r="16" stroke="#0f172a" stroke-width="6" fill="none"/>
    <path d="M 22 78 C 22 58, 35 52, 50 52 C 65 52, 78 58, 78 78" stroke="#0f172a" stroke-width="6" fill="none" stroke-linecap="round"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getRandomAvatar(seed: string = 'User'): string {
  return getProfileLogoSvg(seed);
}

export function sanitizeAvatar(_url?: string, seed: string = 'User'): string {
  // Always enforce the clean profile logo icon for everyone
  return getProfileLogoSvg(seed);
}

