import { generateText } from "ai";
import { CAMPUS_LOCATIONS, findLocationByName, type CampusLocation } from "./campusLocations.js";
import { resolveFastModel } from "./chatModel.js";

/** What the app needs to draw a place card (no search aliases). */
export function toNavDestination(loc: CampusLocation) {
  return {
    id: loc.id,
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    description: loc.description,
    address: loc.address,
    category: loc.category,
    nearbyLandmarks: loc.nearbyLandmarks,
    contact: loc.contact,
    hours: loc.hours,
    services: loc.services,
  };
}

/**
 * Finds the campus place a student is asking about. Known names and aliases
 * match instantly; otherwise a small model picks the likeliest known place.
 */
export async function resolveCampusLocation(
  text: string,
  signal?: AbortSignal,
): Promise<CampusLocation | null> {
  const direct = findLocationByName(text);
  if (direct) return direct;

  try {
    const { text: answer } = await generateText({
      model: resolveFastModel(),
      instructions: `You extract campus location names from user queries about University of Ghana, Legon.
Known locations: ${CAMPUS_LOCATIONS.map((l) => l.name).join(", ")}.
Reply with ONLY the location name — nothing else. If unsure, reply with the most likely match.`,
      prompt: text,
      // GPT OSS spends part of this budget thinking, so leave real headroom.
      maxOutputTokens: 300,
      temperature: 0,
      providerOptions: { groq: { reasoningEffort: "low" } },
      abortSignal: signal,
    });
    const extracted = answer.trim();
    return extracted ? findLocationByName(extracted) : null;
  } catch {
    return null;
  }
}
