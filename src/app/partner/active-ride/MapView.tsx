"use client"
import { useEffect, useRef, useState } from "react"
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps"

type LatLng = { lat: number; lng: number }

interface MapViewProps {
  driverLocation: [number, number] | null
  pickupLocation: [number, number]
  dropLocation: [number, number]
  mapStatus: string
  onStats: (data: {
    distanceToPickup: number
    etaToPickup: number
    distanceToDrop: number
    etaToDrop: number
  }) => void
}

function toRad(deg: number) { return deg * (Math.PI / 180) }

function getBearing(prev: LatLng, curr: LatLng): number {
  const dLng = toRad(curr.lng - prev.lng)
  const lat1 = toRad(prev.lat)
  const lat2 = toRad(curr.lat)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function getDistance(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// FIX 1: fitBounds uniquement au montage + changement de statut, pas à chaque position GPS
// FIX 2: La ligne pointillée est mise à jour seulement si le driver bouge de > 10m
// FIX 3: mapStatus pris en compte pour afficher pickup→drop ou driver→pickup

function MapContent({ driverLocation, pickupLocation, dropLocation, onStats, mapStatus }: MapViewProps) {
  const map = useMap()
  const routesLib = useMapsLibrary("routes")

  // Refs pour les renderers (évite de recréer à chaque render)
  const mainRouteRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const driverRouteRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)

  const [heading, setHeading] = useState(0)
  const prevDriverRef = useRef<LatLng | null>(null)
  const prevDriverRouteRef = useRef<LatLng | null>(null) // Pour throttle la ligne pointillée
  const initialFitDoneRef = useRef(false) // FIX: fitBounds fait une seule fois au départ
  const prevStatusRef = useRef<string>("")

  const pickup: LatLng = { lat: pickupLocation[0], lng: pickupLocation[1] }
  const drop: LatLng = { lat: dropLocation[0], lng: dropLocation[1] }
  const driverLat = driverLocation ? driverLocation[0] : null
  const driverLng = driverLocation ? driverLocation[1] : null
  const driver: LatLng | null = driverLocation
    ? { lat: driverLocation[0], lng: driverLocation[1] }
    : null

  // ─── Cap de déplacement (seuil 5m) ────────────────────────────────────────
  useEffect(() => {
    if (!driver) return
    if (prevDriverRef.current) {
      const dist = getDistance(prevDriverRef.current, driver)
      if (dist > 0.005) setHeading(getBearing(prevDriverRef.current, driver))
    }
    prevDriverRef.current = { ...driver }
  }, [driverLat, driverLng]) // eslint-disable-line

  // ─── Route principale pickup → drop ───────────────────────────────────────
  useEffect(() => {
    if (!map || !routesLib) return

    mainRouteRendererRef.current?.setMap(null)

    const renderer = new routesLib.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#6366f1",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
    })
    renderer.setMap(map)
    mainRouteRendererRef.current = renderer

    const service = new routesLib.DirectionsService()
    service.route(
      {
        origin: pickup,
        destination: drop,
        travelMode: routesLib.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) renderer.setDirections(result)
      }
    )

    return () => {
      renderer.setMap(null)
      mainRouteRendererRef.current = null
    }
  }, [map, routesLib, pickupLocation[0], pickupLocation[1], dropLocation[0], dropLocation[1]]) // eslint-disable-line

  // ─── Ligne pointillée driver → pickup ─────────────────────────────────────
  // FIX: throttle — ne refait la route que si le driver a bougé de > 30m
  useEffect(() => {
    if (!map || !routesLib || !driver) {
      driverRouteRendererRef.current?.setMap(null)
      driverRouteRendererRef.current = null
      return
    }

    // Throttle: ignore si le conducteur n'a pas assez bougé
    if (prevDriverRouteRef.current) {
      const dist = getDistance(prevDriverRouteRef.current, driver)
      if (dist < 0.03) return // < 30m → on ne refait pas la requête
    }
    prevDriverRouteRef.current = { ...driver }

    driverRouteRendererRef.current?.setMap(null)
    driverRouteRendererRef.current = null

    const service = new routesLib.DirectionsService()
    service.route(
      {
        origin: driver,
        destination: pickup,
        travelMode: routesLib.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          const renderer = new routesLib.DirectionsRenderer({
            suppressMarkers: true,
            directions: result,
            polylineOptions: {
              strokeColor: "#6366f1",
              strokeOpacity: 0,
              icons: [{
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  strokeWeight: 2.5,
                  strokeColor: "#6366f1",
                  scale: 4,
                },
                offset: "0",
                repeat: "16px",
              }],
            },
          })
          renderer.setMap(map)
          driverRouteRendererRef.current = renderer
        }
      }
    )

    return () => {
      driverRouteRendererRef.current?.setMap(null)
      driverRouteRendererRef.current = null
    }
  }, [map, routesLib, driverLat, driverLng, pickupLocation[0], pickupLocation[1]]) // eslint-disable-line

  // ─── FitBounds : une seule fois au montage ou si le statut change ──────────
  // FIX desktop : on attend que le layout (panneau latéral) soit rendu via ResizeObserver
  // avant de faire fitBounds, sinon la carte calcule sur une largeur incorrecte → zoom max
  useEffect(() => {
    if (!map) return

    const statusChanged = prevStatusRef.current !== mapStatus
    if (!initialFitDoneRef.current || statusChanged) {

      const doFit = () => {
        const bounds = new google.maps.LatLngBounds()
        bounds.extend(pickup)
        bounds.extend(drop)
        if (driver) bounds.extend(driver)

        const isDesktop = window.innerWidth >= 1024
        const mapDiv = map.getDiv()
        // Largeur réelle du panneau = viewport - largeur actuelle de la carte
        const rightPad = isDesktop && mapDiv
          ? Math.max(window.innerWidth - mapDiv.offsetWidth, 0)
          : isDesktop ? 420 : 60

        map.fitBounds(bounds, {
          top: 80,
          bottom: isDesktop ? 80 : 160,
          left: 60,
          right: rightPad,
        })

        // Cap zoom à 16 pour éviter un zoom trop serré quand les points sont proches
        const listener = map.addListener("idle", () => {
          google.maps.event.removeListener(listener)
          if ((map.getZoom() ?? 0) > 16) map.setZoom(16)
        })

        initialFitDoneRef.current = true
        prevStatusRef.current = mapStatus
      }

      // Attend que le conteneur ait sa taille définitive (layout stable)
      const container = map.getDiv()
      if (!container) { doFit(); return }

      const ro = new ResizeObserver((_, obs) => {
        if (container.offsetWidth > 0) {
          obs.disconnect()
          // Petit délai supplémentaire pour laisser le panneau finir son animation
          setTimeout(doFit, 150)
        }
      })
      ro.observe(container)

      // Fallback si ResizeObserver ne se déclenche pas (conteneur déjà stable)
      const fallback = setTimeout(() => { ro.disconnect(); doFit() }, 600)

      return () => { ro.disconnect(); clearTimeout(fallback) }
    }
  }, [map, mapStatus]) // eslint-disable-line

  // ─── Statistiques ──────────────────────────────────────────────────────────
  useEffect(() => {
    onStats?.({
      distanceToPickup: driver ? getDistance(driver, pickup) : 0,
      etaToPickup: driver ? (getDistance(driver, pickup) / 40) * 60 : 0,
      distanceToDrop: driver ? getDistance(driver, drop) : 0,
      etaToDrop: driver ? (getDistance(driver, drop) / 40) * 60 : 0,
    })
  }, [driverLat, driverLng, pickupLocation[0], pickupLocation[1], dropLocation[0], dropLocation[1]]) // eslint-disable-line

  return (
    <>
      {/* Marker pickup (vert) */}
      <AdvancedMarker position={pickup} title="Départ" zIndex={10}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>
          <div style={{ background: "#16a34a", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
            🟢 Départ
          </div>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #16a34a" }} />
        </div>
      </AdvancedMarker>

      {/* Marker dropoff (rouge) */}
      <AdvancedMarker position={drop} title="Arrivée" zIndex={10}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>
          <div style={{ background: "#dc2626", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
            🔴 Arrivée
          </div>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #dc2626" }} />
        </div>
      </AdvancedMarker>

      {/* Marker conducteur */}
      {driver && (
        <AdvancedMarker position={driver} title="Conducteur" zIndex={20}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#4f46e5",
            border: "3px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "drop-shadow(0 4px 14px rgba(79,70,229,.55))",
            transform: `rotate(${heading}deg)`,
            transition: "transform 0.6s ease",
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        </AdvancedMarker>
      )}
    </>
  )
}

export default function MapView({ driverLocation, pickupLocation, dropLocation, onStats, mapStatus }: MapViewProps) {
  const center = driverLocation
    ? { lat: driverLocation[0], lng: driverLocation[1] }
    : { lat: pickupLocation[0], lng: pickupLocation[1] }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <Map
        defaultZoom={13}
        defaultCenter={center}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "MaRide_map"}
        style={{ width: "100%", height: "100%" }}
        clickableIcons={false}
        gestureHandling="greedy"
      >
        <MapContent
          driverLocation={driverLocation}
          pickupLocation={pickupLocation}
          dropLocation={dropLocation}
          onStats={onStats}
          mapStatus={mapStatus}
        />
      </Map>
    </APIProvider>
  )
}
