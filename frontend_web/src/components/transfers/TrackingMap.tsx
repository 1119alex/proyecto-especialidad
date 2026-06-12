import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
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
  recordedAt: string | Date;
}

interface TrackingMapProps {
  trackingData: TrackingPoint[];
}

/** Centra el mapa en la posición activa durante el replay */
function PanToPoint({
  position,
  enabled,
}: {
  position: [number, number];
  enabled: boolean;
}) {
  const map = useMap();
  const [lat, lng] = position;

  useEffect(() => {
    if (enabled) {
      map.panTo([lat, lng]);
    }
  }, [map, enabled, lat, lng]);

  return null;
}

const formatDateTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export function TrackingMap({ trackingData }: TrackingMapProps) {
  // Replay del recorrido: null = modo "en vivo" (recorrido completo);
  // un número = posición de la línea de tiempo seleccionada
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);

  // Puntos ordenados cronológicamente
  const points = useMemo(
    () =>
      [...(trackingData ?? [])].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      ),
    [trackingData]
  );

  const lastIndex = points.length - 1;
  const isLive = replayIndex === null;
  const activeIndex = isLive ? lastIndex : Math.min(replayIndex, lastIndex);

  // Avance automático durante la reproducción
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        const current = prev ?? 0;
        if (current >= lastIndex) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 900 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, lastIndex]);

  const center = useMemo(() => {
    if (points.length === 0) return [0, 0] as [number, number];
    const avgLat =
      points.reduce((sum, p) => sum + Number(p.latitude), 0) / points.length;
    const avgLng =
      points.reduce((sum, p) => sum + Number(p.longitude), 0) / points.length;
    return [avgLat, avgLng] as [number, number];
  }, [points]);

  // Si no hay datos, mostrar mensaje
  if (points.length === 0) {
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

  const startPoint = points[0];
  const activePoint = points[activeIndex];

  // Ruta completa (fantasma) y ruta recorrida hasta la posición activa
  const fullRoute: [number, number][] = points.map((p) => [
    Number(p.latitude),
    Number(p.longitude),
  ]);
  const traveledRoute: [number, number][] = points
    .slice(0, activeIndex + 1)
    .map((p) => [Number(p.latitude), Number(p.longitude)]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    // Si está al final (o en vivo), reproducir desde el inicio
    if (isLive || activeIndex >= lastIndex) {
      setReplayIndex(0);
    }
    setIsPlaying(true);
  };

  const handleScrub = (value: number) => {
    setIsPlaying(false);
    setReplayIndex(value >= lastIndex ? null : value);
  };

  const goLive = () => {
    setIsPlaying(false);
    setReplayIndex(null);
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

        {/* Ruta completa en gris (visible durante el replay como referencia) */}
        {!isLive && (
          <Polyline
            positions={fullRoute}
            color="#9CA3AF"
            weight={3}
            dashArray="6 8"
            opacity={0.7}
          />
        )}

        {/* Tramo recorrido hasta la posición activa */}
        <Polyline positions={traveledRoute} color="#3B82F6" weight={4} />

        {/* Seguir al camión durante el replay */}
        <PanToPoint
          position={[Number(activePoint.latitude), Number(activePoint.longitude)]}
          enabled={!isLive}
        />

        {/* Marcador de inicio */}
        <Marker
          position={[Number(startPoint.latitude), Number(startPoint.longitude)]}
          icon={startIcon}
        >
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

        {/* Marcador de la posición activa (actual o del replay) */}
        <Marker
          position={[Number(activePoint.latitude), Number(activePoint.longitude)]}
          icon={currentIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>{isLive ? '📍 Posición actual' : '🎬 Posición en el replay'}</strong>
              <br />
              <span className="text-xs text-gray-600">
                {formatDateTime(activePoint.recordedAt)}
              </span>
              <br />
              <span className="text-xs">
                Lat: {Number(activePoint.latitude).toFixed(6)}
                <br />
                Lng: {Number(activePoint.longitude).toFixed(6)}
                <br />
                {activePoint.speed !== null && activePoint.speed !== undefined && (
                  <>
                    Velocidad: {Number(activePoint.speed).toFixed(1)} km/h
                    <br />
                  </>
                )}
                {activePoint.accuracy !== null &&
                  activePoint.accuracy !== undefined && (
                    <>Precisión: {Number(activePoint.accuracy).toFixed(1)}m</>
                  )}
              </span>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores intermedios solo en modo en vivo (en replay saturan) */}
        {isLive &&
          points.length > 2 &&
          points.slice(1, -1).map((point, index) => {
            // Mostrar solo cada 5 puntos si hay muchos
            if (points.length > 20 && index % 5 !== 0) return null;

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

      {/* Reproductor del recorrido */}
      <div className="mt-3 bg-gray-900 text-white rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Play / Pausa */}
          <button
            onClick={handlePlayPause}
            disabled={points.length < 2}
            title={isPlaying ? 'Pausar' : 'Reproducir recorrido'}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 flex items-center justify-center transition"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V4zm7 0a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.84A1 1 0 005 3.7v12.6a1 1 0 001.54.84l9.9-6.3a1 1 0 000-1.68l-9.9-6.3z" />
              </svg>
            )}
          </button>

          {/* Línea de tiempo */}
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={Math.max(lastIndex, 0)}
              value={activeIndex}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 -mt-1">
              <span>{formatTime(startPoint.recordedAt)}</span>
              <span className="text-blue-300 font-medium">
                {formatTime(activePoint.recordedAt)} — punto {activeIndex + 1} de{' '}
                {points.length}
              </span>
              <span>{formatTime(points[lastIndex].recordedAt)}</span>
            </div>
          </div>

          {/* Velocidad de reproducción */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            title="Velocidad de reproducción"
            className="flex-shrink-0 bg-gray-800 border border-gray-700 rounded-md text-xs px-2 py-1.5"
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
            <option value={8}>8x</option>
          </select>

          {/* Volver al presente */}
          <button
            onClick={goLive}
            disabled={isLive}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-md transition ${
              isLive
                ? 'bg-green-700 text-white cursor-default'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            {isLive ? '● EN VIVO' : 'Ir al presente'}
          </button>
        </div>
      </div>

      {/* Información adicional debajo del mapa */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-semibold">Total de puntos</div>
          <div className="text-2xl font-bold text-blue-900">{points.length}</div>
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
            {formatDateTime(points[lastIndex].recordedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
