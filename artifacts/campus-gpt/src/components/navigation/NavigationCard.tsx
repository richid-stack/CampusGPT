/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, Clock, Ruler, Phone, Globe, Mail, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { NavDestination, NavRoute } from '../../services/navigationService';
import { buildGoogleMapsUrl, getStreetViewPhotos, stripHtml } from '../../services/navigationService';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// ── Shared loader promise (initialised once, reused across all card instances) ──
let mapsLoaderPromise: Promise<void> | null = null;

function loadMapsAPI(): Promise<void> {
  if (mapsLoaderPromise) return mapsLoaderPromise;
  mapsLoaderPromise = (async () => {
    const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
    setOptions({ key: MAPS_API_KEY, v: 'weekly' });
    await importLibrary('maps');
    await importLibrary('routes');
    await importLibrary('marker');
  })();
  return mapsLoaderPromise;
}

// ── NavStep type ─────────────────────────────────────────────────────────────
interface NavStep { instruction: string; distance: string; duration: string; }

// ── Photo Carousel ──────────────────────────────────────────────────────────
function PhotoCarousel({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const photos = getStreetViewPhotos(lat, lng, MAPS_API_KEY);
  const [idx, setIdx]   = useState(0);
  const [err, setErr]   = useState<Record<number, boolean>>({});
  const [ok, setOk]     = useState<Record<number, boolean>>({});

  const valid = photos.filter((_, i) => !err[i]);
  if (ok[0] === false && valid.length === 0) return null;

  return (
    <div className="relative w-full h-[180px] md:h-[220px] rounded-t-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 group">
      {photos.map((src, i) => (
        <img key={i} src={src} alt={`${name} view ${i + 1}`}
          onLoad={() => setOk(p => ({ ...p, [i]: true }))}
          onError={() => setErr(p => ({ ...p, [i]: true }))}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            i === idx && !err[i] ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {!ok[idx] && !err[idx] && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Dot indicators */}
      {valid.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => err[i] ? null : (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5'
              }`}
            />
          ))}
        </div>
      )}

      {valid.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}

      <div className="absolute bottom-2 right-2 text-[10px] text-white/70 bg-black/30 px-1.5 py-0.5 rounded">
        Street View
      </div>
    </div>
  );
}

// ── Embedded Google Map ──────────────────────────────────────────────────────
function EmbeddedMap({
  dest, userLat, userLng, onRouteLoaded,
}: {
  dest: NavDestination;
  userLat?: number;
  userLng?: number;
  onRouteLoaded: (route: NavRoute | null) => void;
}) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadMapsAPI();
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center:          { lat: dest.lat, lng: dest.lng },
          zoom:            17,
          mapTypeId:       'roadmap',
          disableDefaultUI: true,
          zoomControl:     true,
          styles: [
            { featureType: 'poi',     stylers: [{ visibility: 'simplified' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        });

        // Destination marker
        new google.maps.Marker({
          position:  { lat: dest.lat, lng: dest.lng },
          map,
          title:     dest.name,
          animation: google.maps.Animation.DROP,
          icon: {
            path:        google.maps.SymbolPath.CIRCLE,
            scale:       10,
            fillColor:   '#2E6BFF',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });

        // Walking directions when user location is available
        if (userLat !== undefined && userLng !== undefined) {
          const svc      = new google.maps.DirectionsService();
          const renderer = new google.maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: { strokeColor: '#2E6BFF', strokeWeight: 4, strokeOpacity: 0.85 },
          });
          renderer.setMap(map);

          const result = await svc.route({
            origin:      { lat: userLat, lng: userLng },
            destination: { lat: dest.lat, lng: dest.lng },
            travelMode:  google.maps.TravelMode.WALKING,
          });

          renderer.setDirections(result);

          const leg = result.routes[0]?.legs[0];
          if (leg) {
            onRouteLoaded({
              distanceText:    leg.distance?.text ?? '',
              durationText:    leg.duration?.text ?? '',
              distanceMeters:  leg.distance?.value ?? 0,
              durationSeconds: leg.duration?.value ?? 0,
              steps: (leg.steps ?? []).map((s: google.maps.DirectionsStep) => ({
                instruction: stripHtml(s.instructions),
                distance:    s.distance?.text ?? '',
                duration:    s.duration?.text ?? '',
              })),
            });

            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: userLat, lng: userLng });
            bounds.extend({ lat: dest.lat, lng: dest.lng });
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }
        }
      } catch {
        if (!cancelled) setMapError(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [dest.lat, dest.lng, userLat, userLng]);

  if (mapError) return (
    <div className="w-full h-[220px] rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-text-tertiary text-sm">
      Map unavailable
    </div>
  );

  return <div ref={mapRef} className="w-full h-[220px] md:h-[260px] rounded-xl overflow-hidden" />;
}

// ── Step-by-step Drawer ──────────────────────────────────────────────────────
function StepsDrawer({ steps, onClose }: { steps: NavStep[]; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 bg-card/95 backdrop-blur-sm rounded-2xl p-4 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary text-sm">Step-by-step directions</h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700">
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500/10 text-brand-500 text-[11px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary leading-snug">{step.instruction}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{step.distance} · {step.duration}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Main NavigationCard ──────────────────────────────────────────────────────
interface NavigationCardProps {
  destination: NavDestination;
}

export function NavigationCard({ destination }: NavigationCardProps) {
  const [userLat, setUserLat]       = useState<number | undefined>();
  const [userLng, setUserLng]       = useState<number | undefined>();
  const [locDenied, setLocDenied]   = useState(false);
  const [locAsked, setLocAsked]     = useState(false);
  const [route, setRoute]           = useState<NavRoute | null>(null);
  const [showSteps, setShowSteps]   = useState(false);
  const [showMap, setShowMap]       = useState(true);

  // Request location once on mount
  useEffect(() => {
    if (locAsked) return;
    setLocAsked(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
      ()  => setLocDenied(true),
      { timeout: 8000 }
    );
  }, []);

  const googleMapsUrl = buildGoogleMapsUrl(destination, userLat, userLng);

  const startNav = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile
      ? `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=walking`
      : googleMapsUrl;
    window.open(url, '_blank');
  };

  const categoryEmoji: Record<string, string> = {
    library: '📚', academic: '🎓', admin: '🏛', health: '🏥',
    hall: '🏠', dining: '🍽', sports: '⚽', services: '🏢',
    gate: '🚪', banking: '🏦',
  };

  return (
    <div className="relative w-full max-w-[600px] rounded-2xl border border-border bg-card overflow-hidden shadow-sm mt-3 mb-1 animate-in fade-in slide-in-from-bottom-2">
      {showSteps && route && (
        <StepsDrawer steps={route.steps} onClose={() => setShowSteps(false)} />
      )}

      {/* ── Photo Carousel ── */}
      <PhotoCarousel lat={destination.lat} lng={destination.lng} name={destination.name} />

      <div className="p-4 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0 text-xl">
            {categoryEmoji[destination.category] ?? '📍'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-text-primary text-[15px] leading-tight">{destination.name}</h2>
            <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{destination.address}</span>
            </p>
          </div>
        </div>

        {/* ── Description ── */}
        <p className="text-sm text-text-secondary leading-relaxed">{destination.description}</p>

        {/* ── Walking route info ── */}
        {route && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-500/5 border border-brand-500/10">
            <div className="flex items-center gap-1.5 text-brand-500">
              <Clock className="w-4 h-4" />
              <span className="font-semibold text-sm">{route.durationText}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Ruler className="w-4 h-4" />
              <span className="text-sm">{route.distanceText}</span>
            </div>
            <div className="ml-auto">
              <button onClick={() => setShowSteps(true)}
                className="text-xs text-brand-500 font-medium hover:underline">
                View steps →
              </button>
            </div>
          </div>
        )}

        {locDenied && !route && (
          <p className="text-xs text-text-tertiary bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            Enable location to see walking time and turn-by-turn directions
          </p>
        )}

        {/* ── Interactive Map ── */}
        <div>
          <button onClick={() => setShowMap(v => !v)}
            className="text-xs text-brand-500 font-medium mb-2 hover:underline">
            {showMap ? 'Hide map ↑' : 'Show map ↓'}
          </button>
          {showMap && (
            <EmbeddedMap
              dest={destination}
              userLat={userLat}
              userLng={userLng}
              onRouteLoaded={setRoute}
            />
          )}
        </div>

        {/* ── Nearby landmarks ── */}
        {destination.nearbyLandmarks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Nearby</p>
            <div className="flex flex-wrap gap-1.5">
              {destination.nearbyLandmarks.map(l => (
                <span key={l} className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-text-secondary">
                  ⭐ {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Contact & Hours ── */}
        {(destination.contact || destination.hours) && (
          <div className="space-y-1.5">
            {destination.hours && (
              <div className="flex items-start gap-2 text-xs text-text-secondary">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-tertiary" />
                <span>{destination.hours}</span>
              </div>
            )}
            {destination.contact?.phone && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Phone className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
                <a href={`tel:${destination.contact.phone}`} className="hover:text-brand-500 transition-colors">
                  {destination.contact.phone}
                </a>
              </div>
            )}
            {destination.contact?.email && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Mail className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
                <a href={`mailto:${destination.contact.email}`} className="hover:text-brand-500 transition-colors">
                  {destination.contact.email}
                </a>
              </div>
            )}
            {destination.contact?.website && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Globe className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
                <a href={`https://${destination.contact.website}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-brand-500 transition-colors">
                  {destination.contact.website}
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Services ── */}
        {destination.services && destination.services.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {destination.services.map(s => (
                <span key={s} className="text-xs px-2 py-1 rounded-full border border-border text-text-secondary">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA buttons ── */}
        <div className="flex gap-2 pt-1">
          <button onClick={startNav}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-brand-500 hover:bg-brand-500/90 active:scale-[0.98] text-white text-sm font-semibold transition-all">
            <Navigation className="w-4 h-4" />
            Start Navigation
          </button>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:scale-[0.98] text-text-primary text-sm font-medium transition-all">
            <ExternalLink className="w-4 h-4" />
            Open in Maps
          </a>
        </div>

      </div>
    </div>
  );
}
