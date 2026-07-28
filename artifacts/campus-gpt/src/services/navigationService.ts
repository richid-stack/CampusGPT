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

/** Street View static image URLs at different headings for a photo carousel */
export function getStreetViewPhotos(lat: number, lng: number, apiKey: string): string[] {
  const base = `https://maps.googleapis.com/maps/api/streetview`;
  const size = '600x400';
  const headings = [0, 90, 180, 270];
  return headings.map(
    h => `${base}?size=${size}&location=${lat},${lng}&heading=${h}&pitch=5&fov=80&key=${apiKey}`
  );
}

/** Strip HTML tags from Google Maps step instructions */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}
