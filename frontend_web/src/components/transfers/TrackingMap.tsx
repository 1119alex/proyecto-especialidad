import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for start and current position
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const currentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface TrackingPoint {
  id: number;
  latitude: number;
  longitude: number;
  speed?: number;
  accuracy?: number;
  recordedAt: string;
}

interface TrackingMapProps {
  trackingData: TrackingPoint[];
}

export function TrackingMap({ trackingData }: TrackingMapProps) {
  // Si no hay datos, mostrar mensaje
  if (!trackingData || trackingData.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No hay datos de seguimiento GPS disponibles
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Los datos se mostrarán cuando la transferencia esté en tránsito
          </p>
        </div>
      </div>
    );
  }

  // Crear array de coordenadas para la polilínea (asegurar conversión a número)
  const routeCoordinates: [number, number][] = trackingData.map((point) => [
    Number(point.latitude),
    Number(point.longitude),
  ]);

  // Calcular el centro del mapa (promedio de todas las coordenadas)
  const center = useMemo(() => {
    if (trackingData.length === 0) return [0, 0] as [number, number];
    const avgLat =
      trackingData.reduce((sum, point) => sum + Number(point.latitude), 0) /
      trackingData.length;
    const avgLng =
      trackingData.reduce((sum, point) => sum + Number(point.longitude), 0) /
      trackingData.length;
    return [avgLat, avgLng] as [number, number];
  }, [trackingData]);

  // Primer y último punto - con validación explícita
  const startPoint = trackingData[0];
  const currentPoint = trackingData[trackingData.length - 1];

  // Validación adicional por si acaso
  if (!startPoint || !currentPoint) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500">Error cargando datos GPS</p>
        </div>
      </div>
    );
  }

  // Formatear fecha/hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '500px', width: '100%', borderRadius: '0.5rem' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Línea del recorrido */}
        <Polyline positions={routeCoordinates} color="#3B82F6" weight={4} />

        {/* Marcador de inicio */}
        <Marker position={[Number(startPoint.latitude), Number(startPoint.longitude)]} icon={startIcon}>
          <Popup>
            <div className="text-sm">
              <strong>🟢 Punto de inicio</strong>
              <br />
              <span className="text-xs text-gray-600">
                {formatDateTime(startPoint.recordedAt)}
              </span>
              <br />
              <span className="text-xs">
                Lat: {Number(startPoint.latitude).toFixed(6)}
                <br />
                Lng: {Number(startPoint.longitude).toFixed(6)}
              </span>
            </div>
          </Popup>
        </Marker>

        {/* Marcador de posición actual */}
        <Marker
          position={[Number(currentPoint.latitude), Number(currentPoint.longitude)]}
          icon={currentIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>📍 Posición actual</strong>
              <br />
              <span className="text-xs text-gray-600">
                {formatDateTime(currentPoint.recordedAt)}
              </span>
              <br />
              <span className="text-xs">
                Lat: {Number(currentPoint.latitude).toFixed(6)}
                <br />
                Lng: {Number(currentPoint.longitude).toFixed(6)}
                <br />
                {currentPoint.speed !== null && currentPoint.speed !== undefined && (
                  <>
                    Velocidad: {Number(currentPoint.speed).toFixed(1)} km/h
                    <br />
                  </>
                )}
                {currentPoint.accuracy !== null &&
                  currentPoint.accuracy !== undefined && (
                    <>Precisión: {Number(currentPoint.accuracy).toFixed(1)}m</>
                  )}
              </span>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores intermedios cada 5 puntos (opcional, para no saturar el mapa) */}
        {trackingData.length > 2 &&
          trackingData.slice(1, -1).map((point, index) => {
            // Mostrar solo cada 5 puntos si hay muchos
            if (trackingData.length > 20 && index % 5 !== 0) return null;

            return (
              <Marker
                key={point.id}
                position={[Number(point.latitude), Number(point.longitude)]}
                opacity={0.6}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Punto #{index + 2}</strong>
                    <br />
                    <span className="text-xs text-gray-600">
                      {formatDateTime(point.recordedAt)}
                    </span>
                    <br />
                    <span className="text-xs">
                      Lat: {Number(point.latitude).toFixed(6)}
                      <br />
                      Lng: {Number(point.longitude).toFixed(6)}
                      <br />
                      {point.speed !== null && point.speed !== undefined && (
                        <>
                          Velocidad: {Number(point.speed).toFixed(1)} km/h
                          <br />
                        </>
                      )}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Información adicional debajo del mapa */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-semibold">Total de puntos</div>
          <div className="text-2xl font-bold text-blue-900">{trackingData.length}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-semibold">Primer registro</div>
          <div className="text-sm font-medium text-green-900">
            {formatDateTime(startPoint.recordedAt)}
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-xs text-red-600 font-semibold">Último registro</div>
          <div className="text-sm font-medium text-red-900">
            {formatDateTime(currentPoint.recordedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
