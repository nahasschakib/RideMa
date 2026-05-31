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

function MapContent({ driverLocation, pickupLocation, dropLocation, onStats }: MapViewProps) {
  const map = useMap()
  const routesLib = useMapsLibrary("routes")
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [heading, setHeading] = useState(0)
  const prevDriverRef = useRef<LatLng | null>(null)
  const driverToPickupRef = useRef<google.maps.DirectionsRenderer | google.maps.Polyline | null>(null)
  const pickup: LatLng = { lat: pickupLocation[0], lng: pickupLocation[1] }
  const drop: LatLng = { lat: dropLocation[0], lng: dropLocation[1] }
  const driver: LatLng | null = driverLocation
    ? { lat: driverLocation[0], lng: driverLocation[1] }
    : null

  // Met à jour le cap de déplacement dès que la position change (seuil 5m pour éviter le jitter GPS)
  useEffect(() => {
    if (!driver) return
    if (prevDriverRef.current) {
      const dist = getDistance(prevDriverRef.current, driver)
      if (dist > 0.005) setHeading(getBearing(prevDriverRef.current, driver))
    }
    prevDriverRef.current = { ...driver }
  }, [driverLocation?.[0], driverLocation?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  // DirectionsRenderer: crée + demande la route pickup → drop
  useEffect(() => {
    if (!map || !routesLib) return

    const renderer = new routesLib.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#6366f1",
        strokeWeight: 4,
        strokeOpacity: 0.85,
      },
    })
    renderer.setMap(map)
    rendererRef.current = renderer

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
      rendererRef.current = null
    }
  }, [map, routesLib, pickupLocation[0], pickupLocation[1], dropLocation[0], dropLocation[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ajuste la vue pour inclure tous les markers
  useEffect(() => {
    if (!map) return
    const bounds = new google.maps.LatLngBounds()
    bounds.extend(pickup)
    bounds.extend(drop)
    if (driver) bounds.extend(driver)
    map.fitBounds(bounds, { top: 80, bottom: 80, left: 60, right: 60 })
  }, [map, pickupLocation[0], pickupLocation[1], dropLocation[0], dropLocation[1], driverLocation]) // eslint-disable-line react-hooks/exhaustive-deps
   
  useEffect(() => {
    onStats?.({
      distanceToPickup: driver ? getDistance(driver, pickup) : 0,
      etaToPickup: driver ? (getDistance(driver, pickup) / 40) * 60 : 0,
      distanceToDrop: driver ? getDistance(driver, drop) : 0,
      etaToDrop: driver ? (getDistance(driver, drop) / 40) * 60 : 0,
    })
  }, [driverLocation?.[0], driverLocation?.[1], pickupLocation[0], pickupLocation[1], dropLocation[0], dropLocation[1]]) // eslint-disable-line react-hooks/exhaustive-deps
   
   // Ligne pointillée conducteur → départ (via route)
useEffect(() => {
  if (!map || !routesLib || !driver) {
    driverToPickupRef.current?.setMap(null)
    return
  }

  driverToPickupRef.current?.setMap(null)

  const service = new routesLib.DirectionsService()
  service.route(
    {
      origin: driver,
      destination: pickup,
      travelMode: routesLib.TravelMode.DRIVING,
    },
    (result, status) => {
      if (status === "OK" && result) {
        const directionsRenderer = new routesLib.DirectionsRenderer({
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
        }) as unknown as google.maps.DirectionsRenderer
        driverToPickupRef.current = directionsRenderer
        driverToPickupRef.current.setMap(map)
      }
    }
  )

  return () => {
    driverToPickupRef.current?.setMap(null)
  }
}, [map, routesLib, driverLocation?.[0], driverLocation?.[1], pickupLocation[0], pickupLocation[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Marker pickup (vert) */}
      <AdvancedMarker position={pickup} title="Départ">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>
          <div style={{ background: "#16a34a", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
            🟢 Départ
          </div>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #16a34a" }} />
        </div>
      </AdvancedMarker>

      {/* Marker dropoff (rouge) */}
      <AdvancedMarker position={drop} title="Arrivée">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>
          <div style={{ background: "#dc2626", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
            🔴 Arrivée
          </div>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #dc2626" }} />
        </div>
      </AdvancedMarker>

      {/* Marker conducteur — cercle indigo avec icône voiture orientée selon le cap */}
      {driver && (
        <AdvancedMarker position={driver} title="Conducteur">
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
