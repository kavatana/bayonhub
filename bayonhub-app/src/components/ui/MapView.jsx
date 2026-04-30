import { memo, useMemo } from "react"
import L from "leaflet"
import { MapPin } from "lucide-react"
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"
import ErrorBoundary from "./ErrorBoundary"

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function FallbackMap({ className }) {
  const { t } = useTranslation()
  return (
    <div className={cn("grid place-items-center rounded-xl bg-neutral-100 text-center", className)}>
      <div className="grid gap-2 text-neutral-400">
        <MapPin className="mx-auto h-8 w-8" aria-hidden="true" />
        <p className="text-sm font-bold">{t("map.unavailable")}</p>
      </div>
    </div>
  )
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect?.({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

function InnerMapView({
  lat,
  lng,
  zoom = 14,
  markers = [],
  interactive = false,
  className = "",
  onLocationSelect,
}) {
  const { t } = useTranslation()
  const center = useMemo(() => [Number(lat), Number(lng)], [lat, lng])

  return (
    <div className={cn("overflow-hidden rounded-xl bg-neutral-100", className)}>
      <MapContainer
        aria-label={t("map.ariaLabel")}
        attributionControl={interactive}
        boxZoom={interactive}
        center={center}
        className="h-full w-full"
        doubleClickZoom={interactive}
        dragging={interactive}
        keyboard={interactive}
        scrollWheelZoom={interactive}
        touchZoom={interactive}
        zoom={zoom}
        zoomControl={interactive}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {interactive ? <MapClickHandler onLocationSelect={onLocationSelect} /> : null}
        {markers.map((marker) => (
          <Marker
            draggable={Boolean(marker.draggable)}
            eventHandlers={{
              dragend(event) {
                const position = event.target.getLatLng()
                marker.onDragEnd?.({ lat: position.lat, lng: position.lng })
              },
            }}
            key={marker.id || `${marker.lat}-${marker.lng}`}
            position={[Number(marker.lat), Number(marker.lng)]}
          >
            {marker.popup ? <Popup>{marker.popup}</Popup> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

function MapView(props) {
  return (
    <ErrorBoundary fallback={<FallbackMap className={props.className} />}>
      <InnerMapView {...props} />
    </ErrorBoundary>
  )
}

export default memo(MapView)
