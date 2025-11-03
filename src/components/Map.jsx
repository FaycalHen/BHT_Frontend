
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvent } from 'react-leaflet';
// Component to handle map click and set marker
function ClickMarker({ setUserPosition, setMapCenter }) {
  useMapEvent('click', (e) => {
    const coords = [e.latlng.lat, e.latlng.lng];
    setUserPosition(coords);
    setMapCenter(coords);
  });
  return null;
}
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useRef } from 'react';
// Fix default icon issue in Leaflet + React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';



const factoryIcon = new L.Icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


// Red marker for user search
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeMapView({ coords }) {
  const map = useMap();
  if (coords) map.setView(coords, 13);
  return null;
}


const Map = ({ userPosition, setUserPosition, routes = [], factoryPosition, selectedRoute }) => {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [mapCenter, setMapCenter] = useState(factoryPosition);
  const inputRef = useRef();

  // Geocode using Nominatim API
  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    if (!search.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setUserPosition(coords);
        setMapCenter(coords);
      } else {
        setError("Location not found.");
      }
    } catch {
      setError("Error searching location.");
    }
  };

  // Center map on factory
  const handleCenterFactory = () => {
    setMapCenter(factoryPosition);
  };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow flex flex-col z-0">
      {/* Search Bar + Center Button */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring focus:border-blue-400 text-sm"
            placeholder="Search for a location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded text-sm">Search</button>
        </form>
        <button onClick={handleCenterFactory} title="Center on Factory" className="px-2 py-1 bg-gray-200 hover:bg-yellow-200 text-gray-700 rounded text-xs font-semibold border border-gray-300">Center Base</button>
      </div>
      {error && <div className="text-red-500 text-xs px-2 py-1">{error}</div>}
      {/* Map */}
      <div className="flex-1">
        <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickMarker setUserPosition={setUserPosition} setMapCenter={setMapCenter} />
          <Marker position={factoryPosition} icon={factoryIcon}>
            <Popup>
              Concrete Factory (Tlemcen)
            </Popup>
          </Marker>
          {userPosition && (
            <>
              <ChangeMapView coords={mapCenter} />
              <Marker position={userPosition} icon={redIcon}>
                <Popup>
                  Lat: {userPosition[0].toFixed(6)}<br />
                  Lng: {userPosition[1].toFixed(6)}
                </Popup>
              </Marker>
            </>
          )}
          {/* Draw route polylines */}
          {routes && routes.length > 0 && routes.map(route => {
            const isSelected = selectedRoute === route.id;
            return (
              <Polyline
                key={route.id}
                positions={route.geometry.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: isSelected ? '#2563eb' : '#888',
                  weight: isSelected ? 7 : 3,
                  opacity: isSelected ? 0.9 : 0.5,
                  dashArray: isSelected ? undefined : '6',
                }}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;

