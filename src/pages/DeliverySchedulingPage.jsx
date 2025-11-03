import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
const DeliverySchedulingPage = () => {
  const [customers, setCustomers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [form, setForm] = useState({
    customer_id: '',
    volume_m3: '',
    scheduled_at: '',
    assigned_driver_id: '',
    truck_ids: [],
    cost: '',
  });
  const [formError, setFormError] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/customers`)
      .then(res => res.json())
      .then(setCustomers);
    fetch(`${API_BASE_URL}/api/trucks`)
      .then(res => res.json())
      .then(setTrucks);
  }, []);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFormChange = e => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      setForm(f => ({ ...f, [name]: Array.from(selectedOptions, o => parseInt(o.value, 10)) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');
    if (!form.customer_id || !form.volume_m3 || !form.scheduled_at || !form.truck_ids.length) {
      setFormError('All fields are required.');
      setNotification({ message: 'All fields are required.', type: 'error' });
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: parseInt(form.customer_id, 10),
        volume_m3: parseFloat(form.volume_m3),
        scheduled_at: form.scheduled_at,
        truck_ids: form.truck_ids,
        cost: form.cost ? parseFloat(form.cost) : null,
      })
    });
    if (res.ok) {
      setNotification({ message: 'Delivery scheduled successfully.', type: 'success' });
      setForm({ customer_id: '', volume_m3: '', scheduled_at: '', assigned_driver_id: '', truck_ids: [], cost: '' });
    } else {
      const data = await res.json();
      setFormError(data.error || 'Failed to schedule delivery.');
      setNotification({ message: data.error || 'Failed to schedule delivery.', type: 'error' });
    }
  };

  // Only show available trucks/drivers
  const availableTrucks = trucks.filter(t => t.status === 'available');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Schedule Delivery</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <select name="customer_id" value={form.customer_id} onChange={handleFormChange} className="w-full border p-2 rounded" required>
            <option value="">-- Select Customer --</option>
            {customers.map(c => (
              <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.phone})</option>
            ))}
          </select>
          <input name="volume_m3" value={form.volume_m3} onChange={handleFormChange} placeholder="Volume (m³)" type="number" min="1" className="w-full border p-2 rounded" required />
          <input name="scheduled_at" value={form.scheduled_at} onChange={handleFormChange} type="datetime-local" className="w-full border p-2 rounded" required />
          <select name="truck_ids" value={form.truck_ids} onChange={handleFormChange} className="w-full border p-2 rounded" multiple required>
            {availableTrucks.map(t => (
              <option key={t.truck_id} value={t.truck_id}>{t.plateNumber} (Cap: {t.capacity_m3}m³)</option>
            ))}
          </select>
          <input name="cost" value={form.cost} onChange={handleFormChange} placeholder="Cost (optional)" type="number" min="0" className="w-full border p-2 rounded" />
          {formError && <div className="text-red-600 text-sm mb-2">{formError}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Schedule Delivery</button>
        </form>
      </div>
      {notification.message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
             onClick={() => setNotification({ message: '', type: '' })}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default DeliverySchedulingPage;
