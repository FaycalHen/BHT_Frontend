import { useState } from 'react';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import NewDeliveryModal from '../components/NewDeliveryModal';
import DeliveryRecapModal from '../components/DeliveryRecapModal';
import { getGoogleMapsDirectionsUrl } from '../components/RouteQRCode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {API_BASE_URL} from '../../config';
// Factory coordinates (Tlemcen)
const FACTORY_POSITION = [34.937822, -1.378849];

/**
 * HomePage - Main landing page with map, sidebar, and delivery modals.
 * Handles all delivery creation, route generation, and user interaction.
 */
const HomePage = () => {
  // State for user position, routes, and UI
  const [userPosition, setUserPosition] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Delivery modal state
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryInitialData, setDeliveryInitialData] = useState({});

  // Recap modal state
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [recapData, setRecapData] = useState(null);
  const [feasibility, setFeasibility] = useState(null);
  const [feasibilityLoading, setFeasibilityLoading] = useState(false);
  const [feasibilityError, setFeasibilityError] = useState("");

  // (manual modal open helper removed — not used)

  // Open modal with prefilled data (from selected route)
  const handleOpenDeliveryModalPrefill = () => {
    if (selectedRoute && routes.length > 0) {
      const route = routes.find(r => r.id === selectedRoute);
      if (route) {
        setDeliveryInitialData({
          latitude: userPosition ? userPosition[0] : '',
          longitude: userPosition ? userPosition[1] : '',
          route: `Route ${route.id}`,
          price: route.cost ? `${route.cost} DA` : '',
        });
      }
    } else if (userPosition) {
      setDeliveryInitialData({
        latitude: userPosition[0],
        longitude: userPosition[1],
      });
    } else {
      setDeliveryInitialData({});
    }
    setDeliveryModalOpen(true);

  };

  // Handle delivery form submit: show recap modal and check feasibility
  const handleDeliveryFormSubmit = async (form) => {
    setDeliveryModalOpen(false);
    setRecapModalOpen(true);
    setFeasibility(null);
    setFeasibilityError("");
    setFeasibilityLoading(true);
    try {
      // 1. Check feasibility (get batching info)
      const feasRes = await fetch(`${API_BASE_URL}/api/deliveries/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: form.date, time: form.time, volume: form.volume })
      });
      const feasData = await feasRes.json();
      setFeasibility(feasData);
      setFeasibilityError(feasData.reason || "");
      // 2. If feasible, use cached selected route for recap/cost (no extra route API call)
      let recap = { ...form };
      if (feasData && feasData.feasible && selectedRoute && routes.length > 0) {
        const route = routes.find(r => r.id === selectedRoute);
        if (route) {
          // Adjust cost/time for batching if needed
          const batchingMultiplier = feasData.tripsPerTruck || 1;
          const adjustedCost = Math.round(route.cost / (route.batching?.tripsPerTruck || 1) * batchingMultiplier);
          const adjustedDuration = route.duration * batchingMultiplier;
          recap = {
            ...recap,
            route: `Route ${route.id}`,
            price: adjustedCost ? `${adjustedCost} DA` : '',
            adjustedDuration: adjustedDuration ? (adjustedDuration / 60).toFixed(1) + ' min' : '',
            batching: { ...route.batching, tripsPerTruck: batchingMultiplier },
            // include geometry so recap modal can render QR immediately
            route_trajectory: route.geometry?.coordinates || route.trajectory || undefined,
          };
        }
      }
      setRecapData(recap);
    } catch (err) {
      console.error('Delivery feasibility check failed:', err);
      setFeasibility(false);
      setFeasibilityError("Could not check delivery feasibility.");
    } finally {
      setFeasibilityLoading(false);
    }
  };

  // Handle final confirmation: save delivery to backend
  const handleConfirmDelivery = () => {
    if (!recapData) return;
    setFeasibilityLoading(true);
    setFeasibilityError("");
      // Find selected route details
      let routeDetails = {};
      if (selectedRoute && routes.length > 0) {
        const route = routes.find(r => r.id === selectedRoute);
        if (route) {
          routeDetails = {
            chosen_route_id: route.id,
            // use geometry.coordinates (GeoJSON style) if available
            route_trajectory: route.geometry?.coordinates || route.trajectory || undefined,
            route_distance_km: route.distance || route.distance_km || 0,
            route_duration_min: route.duration || 0,
            road_quality: route.road_quality || undefined,
            route_description: route.description || undefined,
          };
        }
      }
      // compute route link (null if absent)
      const routeLink = (() => {
        const coords = routeDetails.route_trajectory || recapData.route_trajectory;
        if (!coords) return null;
        let candidate = coords;
        if (candidate && candidate.type && Array.isArray(candidate.coordinates)) candidate = candidate.coordinates;
        if (Array.isArray(candidate) && Array.isArray(candidate[0]) && Array.isArray(candidate[0][0])) candidate = candidate.flat();
        const l = getGoogleMapsDirectionsUrl(candidate);
        return l || null;
      })();
      const costPerM3 = (routeDetails && routeDetails.chosen_route_id && routes.length>0)
        ? (routes.find(r=>r.id===routeDetails.chosen_route_id)?.cost || Number((recapData.price || '').replace(/[^\d.]/g, '')))
        : Number((recapData.price || '').replace(/[^\d.]/g, '')) || 0;
      const volume = Number(recapData.volume) || 0;
      const final_price = Number((costPerM3 * volume).toFixed(2));
      const scheduledAtIso = (recapData.date && recapData.time) ? new Date(recapData.date + 'T' + recapData.time).toISOString() : new Date().toISOString();

      const deliveryPayload = {
        // customer snapshot
        customer_name: recapData.customerName || recapData.customer_name || '',
        customer_phone: recapData.customerPhone || recapData.customer_phone || '',
        // core delivery fields
        volume_m3: volume,
        cost: Number(costPerM3), // cost per m3
        final_price,
        status: 'pending',
        assigned_driver_id: null,
        scheduled_at: scheduledAtIso,
        // trucks selected in the modal (support multiple trucks)
        truck_ids: Array.isArray(recapData.truck_ids) ? recapData.truck_ids : (recapData.truck_ids ? [recapData.truck_ids] : []),
        // Loading / batching and timing assumptions
        // minutesPerM3: used to estimate how long loading/unloading takes per cubic meter
        minutes_per_m3: recapData.minutes_per_m3 || 5,
        // total loading time in minutes (rounded up)
        load_minutes: Math.ceil(((recapData.minutes_per_m3 || 5) * (volume || 0)) || 0),
        // departure_time: when truck must leave factory to arrive on site by scheduled time
        // estimated_return_time: scheduled + load_minutes + route_duration (minutes)
        departure_time: (() => {
          try {
            const scheduled = new Date(scheduledAtIso);
            const minutesBefore = Math.ceil(((recapData.minutes_per_m3 || 5) * (volume || 0)) || 0);
            const dep = new Date(scheduled.getTime() - minutesBefore * 60 * 1000);
            return dep.toISOString();
    } catch (err) { console.error('Failed to compute departure_time:', err); return scheduledAtIso; }
        })(),
        estimated_return_time: (() => {
          try {
            const scheduled = new Date(scheduledAtIso);
            const loadMs = Math.ceil(((recapData.minutes_per_m3 || 5) * (volume || 0)) || 0) * 60 * 1000;
            const routeDurationMs = (routeDetails.route_duration_min || recapData.adjustedDuration || 0) * 60 * 1000;
            const ret = new Date(scheduled.getTime() + loadMs + routeDurationMs);
            return ret.toISOString();
          } catch (err) { console.error('Failed to compute estimated_return_time:', err); return scheduledAtIso; }
        })(),
        // route snapshot/details
        chosen_route_id: routeDetails.chosen_route_id || undefined,
        route_trajectory: routeDetails.route_trajectory || undefined,
        route_distance_km: routeDetails.route_distance_km || undefined,
        route_duration_min: routeDetails.route_duration_min || undefined,
        road_quality: routeDetails.road_quality || undefined,
        route_description: routeDetails.route_description || undefined,
        // pricing audit
        pricing_details: {
          concretePricePerM3: null,
          concreteTotal: null,
          deliveryPrice: Number(costPerM3),
          totalCost: final_price,
        },
        // include a direct Google Maps link for driver's phone (null if not available)
        route_link: routeLink || null,
        
      };
      console.log('Sending delivery payload:', deliveryPayload);
      fetch(`${API_BASE_URL}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryPayload)
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save delivery');
        return res.json();
      })
      .then(() => {
        setRecapModalOpen(false);
        toast.success('Delivery scheduled successfully!', { position: 'top-right', autoClose: 3000 });
        window.dispatchEvent(new Event('refreshDeliveries'));
      })
      .catch(() => {
        setFeasibilityError("Failed to save delivery.");
      })
      .finally(() => setFeasibilityLoading(false));
  };

  // Auto-fill route/price when lat/lng entered
  const handleAutoFill = async (lat, lng) => {
    let tripsPerTruck = 1;
    if (feasibility && feasibility.tripsPerTruck) {
      tripsPerTruck = feasibility.tripsPerTruck;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factory: [FACTORY_POSITION[1], FACTORY_POSITION[0]], customer: [parseFloat(lng), parseFloat(lat)], tripsPerTruck })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const best = data.routes[0];
        setDeliveryInitialData({
          latitude: lat,
          longitude: lng,
          route: `Route ${best.id}`,
          price: best.cost ? `${best.cost} DA` : '',
          adjustedDuration: best.adjustedDuration ? (best.adjustedDuration / 60).toFixed(1) + ' min' : '',
          batching: best.batching || {},
        });
      }
    } catch (err) {
      console.error('Failed to auto-fill delivery data:', err);
    }
  };

  // Generate routes from backend
  const generateRoutes = async () => {
    if (!userPosition) return;
    setLoading(true);
    setError("");
    setRoutes([]);
    setSelectedRoute(null);
    let tripsPerTruck = 1;
    if (feasibility && feasibility.tripsPerTruck) {
      tripsPerTruck = feasibility.tripsPerTruck;
    }
    const payload = {
      factory: [FACTORY_POSITION[1], FACTORY_POSITION[0]],
      customer: [userPosition[1], userPosition[0]],
      tripsPerTruck
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to fetch routes');
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error('Failed to generate routes:', err);
      setError('Could not generate routes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <ToastContainer />
      {/* Delivery Creation Modal */}
      <NewDeliveryModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        onSubmit={handleDeliveryFormSubmit}
        initialData={deliveryInitialData}
        onAutoFill={handleAutoFill}
      />
      {/* Delivery Recap Modal */}
      <DeliveryRecapModal
        isOpen={recapModalOpen}
        onClose={() => setRecapModalOpen(false)}
        deliveryData={recapData || {}}
        feasibility={feasibility}
        loading={feasibilityLoading}
        error={feasibilityError}
        onConfirm={handleConfirmDelivery}
      />
      <main className="flex-1 flex flex-col lg:flex-row p-2 md:p-4 gap-4">
        {/* Map Section */}
        <section className="flex-1 bg-white rounded-lg shadow p-4 mb-4 lg:mb-0">
          <Map userPosition={userPosition} setUserPosition={setUserPosition} routes={routes} factoryPosition={FACTORY_POSITION} selectedRoute={selectedRoute} />
        </section>
        {/* Sidebar Section */}
        <aside className="w-full lg:w-80 bg-white rounded-lg shadow p-4">
          <Sidebar
            userPosition={userPosition}
            onGenerateRoutes={generateRoutes}
            loading={loading}
            error={error}
            routes={routes}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
            onNewDelivery={handleOpenDeliveryModalPrefill}
          />
        </aside>
      </main>
    </div>
  );
};

export default HomePage;
