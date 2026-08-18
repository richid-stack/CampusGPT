// Navigation Service — provider-agnostic interface
// Currently backed by Google Maps; swap out the implementation without changing AI/chat logic.

export interface NavDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  address: string;
  category: string;
  nearbyLandmarks: string[];
  contact?: { phone?: string; email?: string; website?: string };
  hours?: string;
  services?: string[];
}

export interface NavRoute {
  distanceText: string;   // e.g. "450 m"
  durationText: string;   // e.g. "6 mins"
  distanceMeters: number;
  durationSeconds: number;
  steps: NavStep[];
}

export interface NavStep {
  instruction: string;    // HTML stripped plain text
  distance: string;
  duration: string;
}

/** Embedded tag format saved in message content — parsed on render */
export const NAV_TAG_RE = /<!--NAV:([\s\S]*?)-->/;

export function parseNavTag(content: string): NavDestination | null {
  const match = NAV_TAG_RE.exec(content);
  if (!match) return null;
  try { return JSON.parse(match[1]) as NavDestination; }
  catch { return null; }
}

export function stripNavTag(content: string): string {
  return content.replace(NAV_TAG_RE, '').trim();
}

/** Build a Google Maps walking directions URL */
export function buildGoogleMapsUrl(dest: NavDestination, userLat?: number, userLng?: number): string {
  const destination = `${dest.lat},${dest.lng}`;
  if (userLat !== undefined && userLng !== undefined) {
    const origin = `${userLat},${userLng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destination}`;
}

/**
 * Generate map preview images using the Google Maps Static API.
 * These work reliably with any Maps API key (no billing required beyond the free tier).
 * Returns: satellite close-up, satellite wide, roadmap, and hybrid overview.
 */
export function getStreetViewPhotos(lat: number, lng: number, apiKey: string): string[] {
  const base = `https://maps.googleapis.com/maps/api/staticmap`;
  const marker = `markers=color:0x2E6BFF%7Clabel:%20%7C${lat},${lng}`;
  return [
    // Satellite close-up (zoom 18)
    `${base}?center=${lat},${lng}&zoom=18&size=600x400&maptype=satellite&${marker}&key=${apiKey}`,
    // Hybrid (satellite + labels, zoom 17)
    `${base}?center=${lat},${lng}&zoom=17&size=600x400&maptype=hybrid&${marker}&key=${apiKey}`,
    // Roadmap with context (zoom 16)
    `${base}?center=${lat},${lng}&zoom=16&size=600x400&maptype=roadmap&${marker}&key=${apiKey}`,
    // Wide satellite for campus context (zoom 15)
    `${base}?center=${lat},${lng}&zoom=15&size=600x400&maptype=satellite&${marker}&key=${apiKey}`,
  ];
}

/** Strip HTML tags from Google Maps step instructions */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}
