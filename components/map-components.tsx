"use client";

import { MapContainer, TileLayer, Circle, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Compass } from "lucide-react";

interface ZoneData {
  lat: number;
  lon: number;
  aqi: number;
}

interface MapComponentsProps {
  mapKey: string;
  center: [number, number];
  zoom: number;
  mapType: "standard" | "satellite";
  zones: ZoneData[];
  getColor: (aqi: number) => string;
  getTip: (aqi: number) => string;
}

export default function MapComponents({
  mapKey,
  center: initialCenter,
  zoom: initialZoom,
  mapType,
  zones,
  getColor,
  getTip
}: MapComponentsProps) {
  // Use the first zone's coordinates as the center if available
  // This ensures the map is centered on the user's actual location
  const center = zones && zones.length > 0 ? [zones[0].lat, zones[0].lon] as [number, number] : initialCenter;
  const zoom = zones && zones.length > 0 ? 12 : initialZoom; // Adjust zoom level for better view
  return (
    <MapContainer 
      key={mapKey} 
      center={center} 
      zoom={zoom} 
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      className="z-0"
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        url={mapType === "standard" 
          ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
        attribution="&copy; OpenStreetMap contributors"
      />
      {zones.map((zone, i) => (
        <Circle
          key={i}
          center={[zone.lat, zone.lon]}
          radius={1000}
          pathOptions={{ 
            color: getColor(zone.aqi), 
            fillColor: getColor(zone.aqi), 
            fillOpacity: 0.7,
            weight: 2
          }}
        >
          <Popup className="rounded-lg shadow-xl glass-morphism border border-border/50">
            <div className="p-3">
              <div className="text-lg font-bold mb-1 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getColor(zone.aqi) }}
                />
                <span>AQI: {zone.aqi}</span>
              </div>
              <div className="text-sm">{getTip(zone.aqi)}</div>
              <div className="text-xs mt-2 text-muted-foreground flex items-center gap-1">
                <Compass className="h-3 w-3" />
                <span>Lat: {zone.lat.toFixed(4)}, Lon: {zone.lon.toFixed(4)}</span>
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}