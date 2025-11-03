



const Sidebar = ({ userPosition, onGenerateRoutes, loading, error, routes, selectedRoute, setSelectedRoute, onNewDelivery }) => {

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-gray-700">Delivery Details</h2>
      <div className="mb-4">
        <div className="font-semibold text-gray-600">Selected Location:</div>
        {userPosition ? (
          <div className="text-sm text-gray-800">
            Lat: {userPosition[0].toFixed(6)}<br />
            Lng: {userPosition[1].toFixed(6)}
          </div>
        ) : (
          <div className="text-sm text-gray-400">No location selected</div>
        )}
      </div>
      <button
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold uppercase px-4 py-2 rounded-lg shadow border-2 border-yellow-600 disabled:opacity-50 mb-4"
        disabled={!userPosition || loading}
        onClick={onGenerateRoutes}
      >
        {loading ? 'Generating...' : 'Generate Routes'}
      </button>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {routes && routes.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Route Options:</h3>
          <ul className="space-y-2">
            {routes.map(route => {
              const isSelected = selectedRoute === route.id;
              return (
                <li
                  key={route.id}
                  className={`p-2 rounded border ${isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-600">Route {route.id}</div>
                      <div className="text-sm">Distance: {(route.distance / 1000).toFixed(2)} km</div>
                      <div className="text-sm">Duration: {(route.duration / 60).toFixed(1)} min</div>
                      <div className="text-sm font-semibold text-yellow-700">Cost: {route.cost ? route.cost + ' DA' : 'N/A'}</div>
                      {route.osm_summary && (
                        <div className="mt-2 text-xs text-gray-700">
                          <div className="font-semibold text-gray-600">Route Breakdown:</div>
                          <div>Highway types:</div>
                          <ul className="ml-4">
                            {Object.entries(route.osm_summary.highway).map(([type, count]) => (
                              <li key={type}>{type}: {count} <span className="text-blue-700">({route.osm_summary.highway_percent && route.osm_summary.highway_percent[type]})</span></li>
                            ))}
                          </ul>
                          <div>Surface types:</div>
                          <ul className="ml-4">
                            {Object.entries(route.osm_summary.surface).map(([type, count]) => (
                              <li key={type}>{type}: {count} <span className="text-blue-700">({route.osm_summary.surface_percent && route.osm_summary.surface_percent[type]})</span></li>
                            ))}
                          </ul>
                          <div>Climbs: {route.osm_summary.climbs}</div>
                          <div>Segments sampled: {route.osm_summary.segments_sampled}</div>
                          <div>Road Quality Penalty: {route.osm_summary.roadQualityPenalty}</div>
                        </div>
                      )}
                    </div>
                    <button
                      className={`ml-2 px-3 py-1 rounded font-bold text-xs uppercase border-2 ${isSelected ? 'bg-yellow-500 border-yellow-600 text-gray-900' : 'bg-white border-yellow-400 text-yellow-700 hover:bg-yellow-100'}`}
                      onClick={() => setSelectedRoute(route.id)}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {/* Schedule Delivery button, enabled only if a route is selected */}
          <button
            className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded disabled:opacity-50"
            disabled={!selectedRoute}
            onClick={onNewDelivery}
          >
            Schedule Delivery
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

