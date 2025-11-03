// React is available globally in newer JSX runtimes; explicit import removed to satisfy linter.
import { getGoogleMapsDirectionsUrl } from './RouteQRCode';
import { exportRecapAsImage } from '../utils/exportRecapAsImage';
import { exportRecapAsPDF } from '../utils/exportRecapAsPDF';

// Props: isOpen, onClose, deliveryData, feasibility, onConfirm, loading, error
// feasibility can be boolean or an object with batching info
const DeliveryRecapModal = ({ isOpen, onClose, deliveryData, feasibility, onConfirm, loading, error }) => {
  // Try to get a Google Maps link from trajectory if available
  let routeUrl = '';
    if (deliveryData && deliveryData.route_trajectory) {
      try {
        // Try to parse as JSON array of coordinates or accept an array or GeoJSON
        const raw = (typeof deliveryData.route_trajectory === 'string' && deliveryData.route_trajectory.startsWith('['))
          ? JSON.parse(deliveryData.route_trajectory)
          : deliveryData.route_trajectory;

        // Accept GeoJSON LineString: { type: 'LineString', coordinates: [...] }
        let candidate = raw;
        if (raw && raw.type && Array.isArray(raw.coordinates)) {
          candidate = raw.coordinates;
        }
        // Accept GeoJSON MultiLineString: coordinates = [[...]] -> flatten
        if (Array.isArray(candidate) && candidate.length > 0 && Array.isArray(candidate[0]) && Array.isArray(candidate[0][0])) {
          // flatten one level
          candidate = candidate.flat();
        }

        if (Array.isArray(candidate) && candidate.length >= 2) {
          // Normalize coordinate pairs to [lat, lng]. Some sources use [lng, lat].
          const coords = candidate.map(pair => {
            if (!Array.isArray(pair) || pair.length < 2) return null;
            const a = Number(pair[0]);
            const b = Number(pair[1]);
            // Heuristic: latitude is within -90..90
            if (Math.abs(a) <= 90 && Math.abs(b) <= 180 && Math.abs(b) > 90) return [a, b];
            if (Math.abs(b) <= 90 && Math.abs(a) <= 180 && Math.abs(a) > 90) return [b, a];
            // fallback: assume [lat, lng]
            return [a, b];
          }).filter(Boolean);
          if (coords.length >= 2) {
            routeUrl = getGoogleMapsDirectionsUrl(coords);
          }
        } else if (typeof deliveryData.route_trajectory === 'string' && deliveryData.route_trajectory.startsWith('http')) {
          routeUrl = deliveryData.route_trajectory;
        } else {
          console.warn('DeliveryRecapModal: route_trajectory present but could not parse coordinates', deliveryData.route_trajectory);
        }
      } catch (e) {
        // fallback: if it's a URL, use it
        if (typeof deliveryData.route_trajectory === 'string' && deliveryData.route_trajectory.startsWith('http')) {
          routeUrl = deliveryData.route_trajectory;
        } else {
          console.warn('DeliveryRecapModal: failed to parse route_trajectory', e, deliveryData.route_trajectory);
        }
      }
    }
  if (!isOpen) return null;

  // Click outside to close handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()} id="delivery-recap-modal-export">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-lg font-bold mb-4">Confirm Delivery</h2>
  <div className="mb-4 space-y-1">
          <div><span className="font-semibold">Customer:</span> {deliveryData.customerName}</div>
          <div><span className="font-semibold">Phone:</span> {deliveryData.customerPhone}</div>
          <div><span className="font-semibold">Address:</span> {deliveryData.customerAddress}</div>
          <div><span className="font-semibold">Date:</span> {deliveryData.date} {deliveryData.time}</div>
          <div><span className="font-semibold">Location:</span> {deliveryData.latitude}, {deliveryData.longitude}</div>
            <div><span className="font-semibold">Volume:</span> {deliveryData.volume} m³</div>
            {/* Compute and show timing info if present or derivable */}
            {(() => {
              try {
                const minutesPerM3 = deliveryData.minutes_per_m3 || deliveryData.minutesPerM3 || 5;
                const volume = Number(deliveryData.volume || deliveryData.volume_m3 || 0);
                const loadMinutes = deliveryData.load_minutes || deliveryData.loadMinutes || Math.ceil(minutesPerM3 * volume);
                const scheduled = deliveryData.scheduled_at ? new Date(deliveryData.scheduled_at) : (deliveryData.date && deliveryData.time ? new Date(deliveryData.date + 'T' + deliveryData.time) : null);
                const routeDurMin = deliveryData.route_duration_min || (deliveryData.adjustedDuration ? Number(deliveryData.adjustedDuration) / 60 : 0) || 0;
                const departure = deliveryData.departure_time ? new Date(deliveryData.departure_time) : (scheduled ? new Date(scheduled.getTime() - loadMinutes * 60000) : null);
                const estReturn = deliveryData.estimated_return_time ? new Date(deliveryData.estimated_return_time) : (scheduled ? new Date(scheduled.getTime() + (loadMinutes + routeDurMin) * 60000) : null);
                return (
                  <>
                    <div><span className="font-semibold">Load (min):</span> {loadMinutes ? `${loadMinutes} min` : '-'}</div>
                    <div><span className="font-semibold">Departure Time:</span> {departure ? departure.toLocaleString() : '-'}</div>
                    <div><span className="font-semibold">Est. Return Time:</span> {estReturn ? estReturn.toLocaleString() : '-'}</div>
                  </>
                );
              } catch (e) {
                console.warn('Failed to compute timing in recap modal', e);
                return null;
              }
            })()}
          <div><span className="font-semibold">Route:</span> {deliveryData.route}</div>
          <div><span className="font-semibold">Price:</span> {deliveryData.price}</div>
          {/* Pricing breakdown if available */}
          {deliveryData.pricing_details && (
            <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
              <div className="font-semibold text-yellow-700 mb-1">Pricing Breakdown</div>
              <div className="text-sm"><span className="font-semibold">Concrete price per m³:</span> {deliveryData.pricing_details.concretePricePerM3} DA</div>
              <div className="text-sm"><span className="font-semibold">Total concrete price:</span> {deliveryData.pricing_details.concreteTotal} DA</div>
              <div className="text-sm"><span className="font-semibold">Delivery price:</span> {deliveryData.pricing_details.deliveryPrice} DA</div>
              <div className="text-sm"><span className="font-semibold">Total cost:</span> {deliveryData.pricing_details.totalCost} DA</div>
            </div>
          )}
          {/* Link to route on Google Maps (opens directions) */}
          {routeUrl && (
            <div className="mt-4">
              <a href={routeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">Open route in Google Maps</a>
            </div>
          )}
        </div>
        {loading ? (
          <div className="text-center text-yellow-700 font-semibold mb-2">Checking availability...</div>
        ) : feasibility && feasibility.feasible ? (
          <>
            <div className="text-green-700 font-semibold mb-2">Delivery is feasible. Enough trucks/drivers available.</div>
            {feasibility.tripsNeeded && (
              <div className="text-sm text-gray-700 mb-1">
                <span className="font-semibold">Batching:</span> {feasibility.tripsNeeded} trip(s) needed
                {feasibility.trucksAvailable !== undefined && (
                  <> using {feasibility.trucksAvailable} truck(s)</>
                )}
                {feasibility.tripsPerTruck > 1 && (
                  <> ({feasibility.tripsPerTruck} trip(s) per truck)</>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-red-600 font-semibold mb-2">Not enough trucks/drivers available for this slot.</div>
        )}
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex gap-2">
            <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-bold" onClick={onClose}>Cancel</button>
            <button
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded font-bold disabled:opacity-50"
              onClick={onConfirm}
              disabled={!feasibility || loading}
            >
              Confirm & Schedule
            </button>
          </div>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold mt-1"
            onClick={() => exportRecapAsImage('delivery-recap-modal-export', `delivery_recap_${deliveryData.customerName || 'customer'}.png`)}
          >
            Export Recap as Image
          </button>
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold mt-1"
            onClick={() => exportRecapAsPDF('delivery-recap-modal-export', `delivery_recap_${deliveryData.customerName || 'customer'}.pdf`, routeUrl)}
          >
            Export Recap as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRecapModal;
