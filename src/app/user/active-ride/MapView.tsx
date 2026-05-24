"use client"
import { useEffect, useRef } from "react"
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps"

type LatLng = { lat: number; lng: number }

interface MapViewProps {
  driverPos: [number, number] | null
  pickupPos: [number, number]
  dropPos: [number, number]
}

function MapContent({ driverPos, pickupPos, dropPos }: MapViewProps) {
  const map = useMap()
  const routesLib = useMapsLibrary("routes")
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null)

  const pickup: LatLng = { lat: pickupPos[0], lng: pickupPos[1] }
  const drop: LatLng = { lat: dropPos[0], lng: dropPos[1] }
  const driver: LatLng | null = driverPos
    ? { lat: driverPos[0], lng: driverPos[1] }
    : null

  useEffect(() => {
    if (!map || !routesLib) return
    const renderer = new routesLib.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#6366f1", strokeWeight: 4, strokeOpacity: 0.85 },
    })
    renderer.setMap(map)
    rendererRef.current = renderer
    const service = new routesLib.DirectionsService()
    service.route(
      { origin: pickup, destination: drop, travelMode: routesLib.TravelMode.DRIVING },
      (result, status) => { if (status === "OK" && result) renderer.setDirections(result) }
    )
    return () => { renderer.setMap(null); rendererRef.current = null }
  }, [map, routesLib, pickupPos[0], pickupPos[1], dropPos[0], dropPos[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) return
    const bounds = new google.maps.LatLngBounds()
    bounds.extend(pickup)
    bounds.extend(drop)
    if (driver) bounds.extend(driver)
    map.fitBounds(bounds, { top: 80, bottom: 80, left: 60, right: 60 })
  }, [map, pickupPos[0], pickupPos[1], dropPos[0], dropPos[1], driverPos]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AdvancedMarker position={pickup} title="Départ">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>
          <div style={{ background: "#16a34a", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>🟢 Départ</div>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #16a34a" }} />
        </div>
      </AdvancedMarker>

      <AdvancedMarker position={drop} title="Arrivée">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>
          <div style={{ background: "#dc2626", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>🔴 Arrivée</div>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #dc2626" }} />
        </div>
      </AdvancedMarker>

      {driver && (
        <AdvancedMarker position={driver} title="Conducteur">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>
            <div style={{ background: "#2563eb", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>🚗 Conducteur</div>
            <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #2563eb" }} />
          </div>
        </AdvancedMarker>
      )}
    </>
  )
}

export default function MapView({ driverPos, pickupPos, dropPos }: MapViewProps) {
  const center = driverPos
    ? { lat: driverPos[0], lng: driverPos[1] }
    : { lat: pickupPos[0], lng: pickupPos[1] }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <Map
        defaultZoom={13}
        defaultCenter={center}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "ridema_map"}
        style={{ width: "100%", height: "100%" }}
      >
        <MapContent driverPos={driverPos} pickupPos={pickupPos} dropPos={dropPos} />
      </Map>
    </APIProvider>
  )
}
