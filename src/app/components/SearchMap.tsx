"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import axios from 'axios';
import polyline from '@mapbox/polyline';

type LatLng = { lat: number; lng: number };

export type DriverMarker = {
  id: string
  lat: number
  lng: number
  baseFare?: number
  pricePerKM?: number
  waitingCharge?: number
  model?: string
}

type Props = {
  pickup: string
  drop: string
  pickupLat?: number
  pickupLng?: number
  dropLat?: number
  dropLng?: number
  onChange: (pickup: string, drop: string) => void
  onDistance: (km: number,minutes:number) => void
  drivers?: DriverMarker[]
}

const CASABLANCA: LatLng = { lat: 33.5731, lng: -7.5898 };


function toRad(deg: number) { return deg * (Math.PI / 180); }

function getDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function SearchMap({ pickup, drop, pickupLat, pickupLng, dropLat, dropLng, onChange, onDistance, drivers = [] }: Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const pickupPosition = useMemo<LatLng | null>(() =>
    pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : null,
    [pickupLat, pickupLng]
  );

  const dropPosition = useMemo<LatLng | null>(() =>
    dropLat && dropLng ? { lat: dropLat, lng: dropLng } : null,
    [dropLat, dropLng]
  );

  // Local state tracks actual current positions (including drags)
  const [localPickup, setLocalPickup] = useState<LatLng | null>(pickupPosition);
  const [localDrop, setLocalDrop] = useState<LatLng | null>(dropPosition);

  // Sync from props when parent changes coords (e.g., autocomplete selection)
  useEffect(() => { setLocalPickup(pickupPosition); }, [pickupPosition]);
  useEffect(() => { setLocalDrop(dropPosition); }, [dropPosition]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const isMapInitialized = useRef(false);
  const onDistanceRef = useRef(onDistance);
  // AbortControllers — cancel stale in-flight requests when a new one is triggered
  const routeAbortRef = useRef<AbortController | null>(null);
  const geocodePickupAbortRef = useRef<AbortController | null>(null);
  const geocodeDropAbortRef = useRef<AbortController | null>(null);
  const pendingRouteRef = useRef<LatLng[] | null>(null);
  

  useEffect(() => { onDistanceRef.current = onDistance; }, [onDistance]);

  // fitBounds driven by prop-based positions only (autocomplete) — not by drags
  const targetView = useMemo(() => {
    if (pickupPosition && dropPosition) {
      const distance = getDistance(pickupPosition, dropPosition);
      const center = {
        lat: (pickupPosition.lat + dropPosition.lat) / 2,
        lng: (pickupPosition.lng + dropPosition.lng) / 2,
      };
      const z = distance > 300 ? 6 : distance > 100 ? 8 : distance > 50 ? 10 : distance > 10 ? 12 : 14;
      return { center, zoom: z };
    }
    if (pickupPosition) return { center: pickupPosition, zoom: 14 };
    return { center: CASABLANCA, zoom: 13 };
  }, [pickupPosition, dropPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapInitialized.current) return;
    if (pickupPosition && dropPosition) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickupPosition);
      bounds.extend(dropPosition);
      map.fitBounds(bounds, { top: 80, bottom: 80, left: 60, right: 60 });
    } else {
      map.setCenter(targetView.center);
      map.setZoom(targetView.zoom);
    }
  }, [targetView]);

  const drawRoute = useCallback((path: LatLng[]) => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    const map = mapRef.current;
   if (!map) {
    pendingRouteRef.current = path;
    return;
  }

  if (path.length === 0) return;
    const line = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#2563eb",
      strokeOpacity: 0.45,
      strokeWeight: 3,
      icons: [{
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: "#fff" },
        offset: "50%",
      }],
    });
    line.setMap(map);
    polylineRef.current = line;
    pendingRouteRef.current = null;
  }, []);

  const fetchRoute = useCallback((origin: LatLng, dest: LatLng) => {
    // Abort any in-flight route request to avoid race conditions
    routeAbortRef.current?.abort();
    routeAbortRef.current = new AbortController();
    axios
      .get(`/api/directions?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${dest.lat}&destLng=${dest.lng}`,
        { signal: routeAbortRef.current.signal }
      )
      .then(({ data }) => {
       
        const decoded = polyline.decode(data.polyline).map(([lat, lng]) => ({ lat, lng }));
        drawRoute(decoded);
        const km = data.distanceValue /1000;
        const minutes= Math.ceil(data.durationValue/60);
        onDistanceRef.current(km,minutes);
      })
      .catch((err) => { if (!axios.isCancel(err)) console.error("Directions error:", err); });
  }, [drawRoute]);

  useEffect(() => {
    if (!localPickup || !localDrop) {
      drawRoute([]);
      return;
    }
   
    fetchRoute(localPickup, localDrop);
    return () => {
      routeAbortRef.current?.abort();
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [localPickup, localDrop, fetchRoute, drawRoute]);

  return (
    <div className='relative w-full h-full bg-zinc-200'>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
        <Map
          defaultZoom={13}
          defaultCenter={CASABLANCA}
          mapId="MaRide_map"
          style={{ width: '100%', height: '100%' }}
          onTilesLoaded={(e) => {
            mapRef.current = e.map;
            if (!isMapInitialized.current) {
              isMapInitialized.current = true;
              if (pickupPosition && dropPosition) {
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(pickupPosition);
                bounds.extend(dropPosition);
                e.map.fitBounds(bounds, { top: 80, bottom: 80, left: 60, right: 60 });
              } else {
                e.map.setCenter(targetView.center);
                e.map.setZoom(targetView.zoom);
              }
              if (pendingRouteRef.current && pendingRouteRef.current.length > 0) {
      const path = pendingRouteRef.current;
      const line = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 0.9,
        strokeWeight: 5,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: "#fff"
          },
          offset: "50%",
        }],
      });
      line.setMap(e.map);
      polylineRef.current = line;
      pendingRouteRef.current = null;
    }
            }
          }}
        >
          {localPickup && (
            <AdvancedMarker
              position={localPickup}
              title={pickup}
              draggable={true}
              onDragEnd={(e) => {
                const lat = e.latLng?.lat();
                const lng = e.latLng?.lng();
                if (!lat || !lng) return;
                setLocalPickup({ lat, lng });
                // Abort stale geocode and start fresh
                geocodePickupAbortRef.current?.abort();
                geocodePickupAbortRef.current = new AbortController();
                axios
                  .get(`/api/geocode?lat=${lat}&lon=${lng}`, { signal: geocodePickupAbortRef.current.signal })
                  .then(({ data }) => {
                    const address = [data.street, data.city, data.postcode, data.country]
                      .filter(Boolean).join(", ");
                    onChange(address, drop);
                  })
                  .catch((err) => { if (!axios.isCancel(err)) console.error("Geocode error:", err); });
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
                <div style={{ background: "#09090b", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  🟢 Départ
                </div>
                <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #09090b" }} />
              </div>
            </AdvancedMarker>
          )}

          {localDrop && (
            <AdvancedMarker
              position={localDrop}
              title={drop}
              draggable={true}
              onDragEnd={(e) => {
                const lat = e.latLng?.lat();
                const lng = e.latLng?.lng();
                if (!lat || !lng) return;
                setLocalDrop({ lat, lng });
                // Abort stale geocode and start fresh
                geocodeDropAbortRef.current?.abort();
                geocodeDropAbortRef.current = new AbortController();
                axios
                  .get(`/api/geocode?lat=${lat}&lon=${lng}`, { signal: geocodeDropAbortRef.current.signal })
                  .then(({ data }) => {
                    const address = [data.street, data.city, data.postcode, data.country]
                      .filter(Boolean).join(", ");
                    onChange(pickup, address);
                  })
                  .catch((err) => { if (!axios.isCancel(err)) console.error("Geocode error:", err); });
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
                <div style={{ background: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  🔴 Arrivée
                </div>
                <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #ef4444" }} />
              </div>
            </AdvancedMarker>
          )}

          {drivers.map((d) => (
            <AdvancedMarker
              key={d.id}
              position={{ lat: d.lat, lng: d.lng }}
              title={d.model}
              onClick={() => setSelectedDriverId(prev => prev === d.id ? null : d.id)}
            >
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#4f46e5",
                border: "3px solid white",
                display: "flex", alignItems: "center", justifyContent: "center",
                filter: "drop-shadow(0 4px 14px rgba(79,70,229,.55))",
                cursor: "pointer",
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
            </AdvancedMarker>
          ))}

          {selectedDriverId && (() => {
            const d = drivers.find(x => x.id === selectedDriverId);
            if (!d) return null;
            return (
              <InfoWindow
                position={{ lat: d.lat, lng: d.lng }}
                onCloseClick={() => setSelectedDriverId(null)}
                pixelOffset={[0, -50]}
              >
                <div style={{ padding: "2px 4px", minWidth: "120px" }}>
                  {d.model && <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>{d.model}</div>}
                  {d.baseFare != null && (
                    <div style={{ fontSize: "12px", color: "#374151" }}>
                      Prise en charge : <strong>{d.baseFare} MAD</strong>
                    </div>
                  )}
                  {d.pricePerKM != null && (
                    <div style={{ fontSize: "12px", color: "#374151" }}>
                      Par km : <strong>{d.pricePerKM} MAD</strong>
                    </div>
                  )}
                  {d.waitingCharge != null && (
                    <div style={{ fontSize: "12px", color: "#374151" }}>
                      Attente : <strong>{d.waitingCharge} MAD/min</strong>
                    </div>
                  )}
                </div>
              </InfoWindow>
            );
          })()}
        </Map>
      </APIProvider>
    </div>
  );
}

export default SearchMap;
