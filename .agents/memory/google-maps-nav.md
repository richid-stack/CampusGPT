---
name: Google Maps Navigation Integration
description: How navigation cards are detected, generated, persisted, and rendered in CampusGPT
---

# Google Maps Navigation Integration

## Data flow
1. `chat.ts` backend detects navigation intent via `isNavigationIntent()` regex on every incoming message.
2. If triggered, a parallel Groq call (fast model) extracts the destination name while the main AI stream runs.
3. Destination is looked up in `campusLocations.ts` using `findLocationByName()`.
4. After the stream, if a location matched, the backend:
   - Appends `<!--NAV:{JSON}-->` to the saved assistant message content in the DB.
   - Emits `{ navigationCard: {...} }` as an extra SSE event before `{ done: true }`.
5. `useChat.ts` captures the `navigationCard` SSE event, stores in state.
6. `ChatThread` passes `navigationCard` to the streaming `AssistantMessage`.
7. `AssistantMessage` either uses the live `navigationCard` prop (streaming) or parses `<!--NAV:...-->` from saved message content (after reload).
8. `NavigationCard` renders the card, lazy-loads Google Maps via `importLibrary`, requests geolocation, fetches walking directions from DirectionsService.

**Why this design:**  
- `<!--NAV:...-->` embedded tag = persistence without DB schema changes.  
- Parallel destination resolution = zero added latency to the AI stream.  
- Provider-agnostic `navigationService.ts` wraps all Google-specific helpers.

## Google Maps Loader (v2.x)
- Package: `@googlemaps/js-api-loader` v2.1.1
- Use `setOptions({ key, v })` + `importLibrary('maps')` — **not** `new Loader(options).load()` (deprecated).
- Types: `@types/google.maps` — add `/// <reference types="@types/google.maps" />` at top of file.
- Loader promise is module-level singleton: `mapsLoaderPromise` to avoid double-loading across card instances.

## API key
- Stored as env var `VITE_GOOGLE_MAPS_API_KEY` (shared environment) — demo key, not a secret.
- Backend does NOT need the key (all Maps API calls are client-side).

## How to apply
- Adding a new location: add entry to `CAMPUS_LOCATIONS` array in `campusLocations.ts` with all aliases.
- Swapping map provider: implement the same interface in `navigationService.ts` and update `NavigationCard.tsx`.
