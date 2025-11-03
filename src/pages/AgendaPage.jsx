
import { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import { exportRecapAsPDF } from '../utils/exportRecapAsPDF';
import { Calendar } from 'react-big-calendar';
import { parseISO, format } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { enUS } from 'date-fns/locale';
import { dateFnsLocalizer } from 'react-big-calendar';


const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: () => 0,
  getDay: date => (date instanceof Date ? date.getDay() : new Date(date).getDay()),
  locales,
});

const AgendaPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmContext, setConfirmContext] = useState({ type: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // make fetchDeliveries reusable for actions
  const fetchDeliveries = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/deliveries')
      .then(res => res.json())
      .then(data => {
        setDeliveries(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch deliveries.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDeliveries();
    // Listen for refresh event
    const handler = () => fetchDeliveries();
    window.addEventListener('refreshDeliveries', handler);
    return () => window.removeEventListener('refreshDeliveries', handler);
  }, []);

  // Map deliveries to calendar events
  const events = deliveries
    .filter(d => d.scheduled_at)
    .map(d => ({
      id: d.delivery_id,
      title: `${d.customer?.name || 'Delivery'} (${d.volume_m3} m³)` + (d.status === 'completed' ? ' ✔' : ''),
      start: new Date(d.scheduled_at),
      end: new Date(new Date(d.scheduled_at).getTime() + 60 * 60 * 1000), // 1 hour duration default
      resource: d,
      allDay: false,
      status: d.status,
    }));

  // Color events by status
  function eventStyleGetter(event) {
    let bg = '#fde68a'; // yellow-200
    if (event.status === 'completed') bg = '#bbf7d0'; // green-200
    if (event.status === 'scheduled') bg = '#fef9c3'; // yellow-100
    if (event.status === 'delayed') bg = '#fecaca'; // red-200
    return {
      style: {
        backgroundColor: bg,
        color: '#78350f',
        borderRadius: '6px',
        border: '1px solid #facc15',
        fontWeight: 600,
        fontSize: '0.95em',
        paddingLeft: 6,
        paddingRight: 6,
      },
    };
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-yellow-700 mb-4">Agenda - Delivery Calendar</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={event => setActionTarget(event.resource)}
          views={['month', 'week', 'day']}
          popup
        />
        {loading && <div className="text-center text-yellow-700 font-semibold mt-4">Loading deliveries...</div>}
        {error && <div className="text-center text-red-600 font-semibold mt-4">{error}</div>}
      </div>
      {/* Delivery details modal */}
        {/* Action popup: shown on initial click */}
        {actionTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-30" onClick={e => { if (e.target === e.currentTarget) setActionTarget(null); }}>
            <div className="bg-white rounded-lg shadow p-4 w-full max-w-sm mx-4">
              <h3 className="text-lg font-bold mb-2">Delivery Actions</h3>
              <p className="text-sm text-gray-700 mb-4">Choose an action for <strong>{actionTarget.customer?.name || 'Delivery'}</strong></p>
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold"
                  onClick={() => { setActionTarget(null); setConfirmContext({ type: 'delete', id: actionTarget.delivery_id }); setConfirmOpen(true); }}
                >
                  Delete
                </button>
                <button
                  className={
                    `flex-1 py-2 rounded font-semibold text-white ${actionTarget.status === 'completed' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`
                  }
                  onClick={() => {
                    // if already completed, do nothing
                    if (actionTarget.status === 'completed') return;
                    setActionTarget(null);
                    setConfirmContext({ type: 'complete', id: actionTarget.delivery_id });
                    setConfirmOpen(true);
                  }}
                  disabled={actionTarget.status === 'completed'}
                  title={actionTarget.status === 'completed' ? 'This delivery is already completed' : 'Mark as completed'}
                >
                  {actionTarget.status === 'completed' ? 'Completed ✓' : 'Completed'}
                </button>
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                  onClick={() => {
                    setSelectedDelivery(actionTarget);
                    setActionTarget(null);
                  }}
                >
                  See delivery details
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setSelectedDelivery(null); }}>
          <div id="agenda-delivery-recap-export" className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl relative border border-yellow-100 animate-fadeIn overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500 text-2xl font-bold" onClick={() => setSelectedDelivery(null)}>&times;</button>
            {/* Save PDF action in header */}
            <button
              aria-label="Save PDF"
              className="absolute top-3 right-14 bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded-md font-semibold text-sm"
              onClick={() => exportRecapAsPDF('agenda-delivery-recap-export', `delivery_recap_${selectedDelivery.customer?.name || 'customer'}.pdf`, selectedDelivery.route_link)}
            >
              Save PDF
            </button>
            <h2 className="text-2xl font-extrabold mb-4 text-yellow-700 border-b pb-2">Delivery Details</h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Delivery Info */}
              <div className="flex-1 space-y-2">
                <div><span className="font-semibold">Customer:</span> {selectedDelivery.customer?.name || '-'}</div>
                <div><span className="font-semibold">Address:</span> {selectedDelivery.customer?.address || '-'}</div>
                <div><span className="font-semibold">Phone:</span> {selectedDelivery.customer?.phone || '-'}</div>
                <div>
                  <span className="font-semibold">Truck(s):</span> {selectedDelivery.trucks && selectedDelivery.trucks.length > 0 ? (
                    <ul className="list-disc ml-6">
                      {selectedDelivery.trucks.map(truck => (
                        <li key={truck.truck_id}>
                          {truck.plateNumber} (Capacity: {truck.capacity_m3} m³)
                        </li>
                      ))}
                    </ul>
                  ) : '-'}
                </div>
                <div><span className="font-semibold">Volume:</span> {selectedDelivery.volume_m3} m³</div>
                <div><span className="font-semibold">Scheduled:</span> {selectedDelivery.scheduled_at ? new Date(selectedDelivery.scheduled_at).toLocaleString() : '-'}</div>
                <div><span className="font-semibold">Departure Time:</span> {selectedDelivery.departure_time ? new Date(selectedDelivery.departure_time).toLocaleString() : '-'}</div>
                <div><span className="font-semibold">Est. Delivery Time:</span> {selectedDelivery.estimated_delivery_time ? new Date(selectedDelivery.estimated_delivery_time).toLocaleString() : '-'}</div>
                <div><span className="font-semibold">Est. Return Time:</span> {selectedDelivery.estimated_return_time ? new Date(selectedDelivery.estimated_return_time).toLocaleString() : '-'}</div>
                <div><span className="font-semibold">Batching Time:</span> {selectedDelivery.batching_time_min ? selectedDelivery.batching_time_min + ' min' : '-'}</div>
                <div><span className="font-semibold">Filling Time:</span> {selectedDelivery.filling_time_min ? selectedDelivery.filling_time_min + ' min' : '-'}</div>
                <div>
                  <span className="font-semibold">Route:</span>{' '}
                  {selectedDelivery.route_link ? (
                    <a href={selectedDelivery.route_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open route in Google Maps</a>
                  ) : (
                    (selectedDelivery.route || selectedDelivery.chosen_route_id) || '-'
                  )}
                </div>
                <div><span className="font-semibold">Status:</span> {selectedDelivery.status || 'Scheduled'}</div>
              </div>
              {/* Right: Pricing Breakdown */}
              {selectedDelivery.pricing_details && (
                <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-4 h-fit self-start min-w-[220px] max-w-xs mx-auto md:mx-0">
                  <div className="font-bold text-yellow-700 mb-2 text-lg">Pricing Breakdown</div>
                  <div className="grid grid-cols-1 gap-y-1 text-sm">
                    <div><span className="font-semibold">Concrete price per m³:</span> {selectedDelivery.pricing_details.concretePricePerM3} DA</div>
                    <div><span className="font-semibold">Total concrete price:</span> {selectedDelivery.pricing_details.concreteTotal} DA</div>
                    <div><span className="font-semibold">Delivery price:</span> {selectedDelivery.pricing_details.deliveryPrice} DA</div>
                    <div><span className="font-semibold">Total cost:</span> <span className="text-green-700 font-bold">{selectedDelivery.pricing_details.totalCost} DA</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal used for delete/complete actions */}
      <ConfirmationModal
        open={confirmOpen}
        title={confirmContext.type === 'delete' ? 'Confirm Delete' : 'Confirm Completion'}
        message={confirmContext.type === 'delete' ? 'Delete this delivery? This will release assigned trucks.' : 'Mark this delivery as completed? This will release assigned trucks.'}
        confirmLabel={confirmContext.type === 'delete' ? 'Delete' : 'Mark Completed'}
        onCancel={() => { setConfirmOpen(false); setConfirmContext({ type: null }); }}
        onConfirm={async () => {
          // perform the requested action
          try {
            if (confirmContext.type === 'delete') {
              const res = await fetch(`http://localhost:5000/api/deliveries/${confirmContext.id}`, { method: 'DELETE' });
              if (!res.ok) throw new Error('Delete failed');
              setActionTarget(null);
              setSelectedDelivery(null);
              fetchDeliveries();
              window.dispatchEvent(new Event('refreshTrucks'));
              console.log('Deleted delivery', confirmContext.id);
            } else if (confirmContext.type === 'complete') {
              const res = await fetch(`http://localhost:5000/api/deliveries/${confirmContext.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) });
              if (!res.ok) throw new Error('Update failed');
              const updated = await res.json();
              console.log('PUT /api/deliveries response:', updated);
              setActionTarget(null);
              setSelectedDelivery(null);
              fetchDeliveries();
              window.dispatchEvent(new Event('refreshTrucks'));
              console.log('Marked completed delivery', confirmContext.id, 'released trucks:', updated.released_truck_ids || []);
              if (!updated.released_truck_ids || updated.released_truck_ids.length === 0) {
                // Let user know, but don't block
                alert('No trucks were released for this delivery according to the server. Check server logs.');
              }
            }
          } catch (e) {
            console.error('Confirmation action failed', e);
            alert('Action failed');
          } finally {
            setConfirmOpen(false);
            setConfirmContext({ type: null });
          }
        }}
      />
    </div>
  );
};

export default AgendaPage;
