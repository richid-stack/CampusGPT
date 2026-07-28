---
name: Campus Locations Database
description: UG Legon campus buildings database and navigation intent detection
---

# Campus Locations Database

## File
`artifacts/api-server/src/lib/campusLocations.ts`

## Contents
27 UG Legon locations covering: library, academic blocks, admin, halls of residence, health, dining, sports, services, banking, gate.

## Key helpers
- `isNavigationIntent(text)` — regex-based intent detection (no AI call). Matches ~20 navigation patterns.
- `findLocationByName(query)` — three-pass fuzzy match: exact name → exact alias → partial alias → partial name.

## Coordinate accuracy
Coordinates are approximate (WGS84). Survey-grade coordinates have not been verified on-ground. Update when accurate data is available.

**Why:**  
Alias matching runs in-process with zero latency; AI extraction only runs as fallback when alias matching fails.
