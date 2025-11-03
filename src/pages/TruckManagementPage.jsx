import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const TruckManagementPage = () => {
  // Edit modal logic and handlers
  const openEditModal = (truck) => {
    setEditForm({
      truck_id: truck.truck_id,
      plateNumber: truck.plateNumber,
      status: truck.status,
      capacity_m3: truck.capacity_m3,
      driver_id: truck.driver_id || ''
    });
    setEditFormError('');
    setEditModalOpen(true);
  };

  const handleEditFormChange = e => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const handleEditTruck = async e => {
    e.preventDefault();
    setEditFormError('');
    if (!editForm.plateNumber || !editForm.status || !editForm.capacity_m3) {
      setEditFormError('All fields except driver are required.');
      setNotification({ message: 'All fields except driver are required.', type: 'error' });
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/trucks/${editForm.truck_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plateNumber: editForm.plateNumber,
        status: editForm.status,
        capacity_m3: editForm.capacity_m3,
        driver_id: editForm.driver_id ? parseInt(editForm.driver_id, 10) : null
      })
    });
    if (res.ok) {
      setEditModalOpen(false);
      setEditForm({ truck_id: null, plateNumber: '', status: 'available', capacity_m3: '', driver_id: '' });
      setNotification({ message: 'Truck updated successfully.', type: 'success' });
      setLoading(true);
      fetch('${API_BASE_URL}/api/trucks')
        .then(res => res.json())
        .then(data => {
          setTrucks(data);
          setLoading(false);
        });
    } else {
      const data = await res.json();
      let msg = data.error || 'Failed to update truck.';
      if (msg.toLowerCase().includes('plate')) msg = 'This truck plate is already used.';
      setEditFormError(msg);
      setNotification({ message: msg, type: 'error' });
    }
  };

  // Notification state
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  const [retireModal, setRetireModal] = useState({ open: false, truckId: null });

  
  const handleRetireTruck = async (truck_id) => {
    // Called after confirmation in modal
    const res = await fetch(`${API_BASE_URL}/api/trucks/${truck_id}`, {
      method: 'DELETE'
    });
    if (res.status === 204) {
      setNotification({ message: 'Truck retired successfully.', type: 'success' });
      setLoading(true);
      fetch(`${API_BASE_URL}/api/trucks`)
        .then(res => res.json())
        .then(data => {
          setTrucks(data);
          setLoading(false);
        });
    } else {
      setNotification({ message: 'Failed to retire truck.', type: 'error' });
    }
    setRetireModal({ open: false, truckId: null });
  };

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [addDriverModalOpen, setAddDriverModalOpen] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', phone: '' });
  const [driverFormError, setDriverFormError] = useState('');
  // Add Driver logic
  const handleDriverFormChange = e => {
    const { name, value } = e.target;
    setDriverForm(f => ({ ...f, [name]: value }));
  };

  const handleAddDriver = async e => {
    e.preventDefault();
    setDriverFormError('');
    if (!driverForm.name || !driverForm.phone) {
      setDriverFormError('Both name and phone are required.');
      setNotification({ message: 'Both name and phone are required.', type: 'error' });
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: driverForm.name, phone: driverForm.phone })
    });
    if (res.ok) {
      setAddDriverModalOpen(false);
      setDriverForm({ name: '', phone: '' });
      setNotification({ message: 'Driver added successfully.', type: 'success' });
      // Refresh drivers
      fetch(`${API_BASE_URL}/api/drivers`)
        .then(res => res.json())
        .then(data => setDrivers(data));
    } else {
      const data = await res.json();
      let msg = data.error || 'Failed to add driver.';
      setDriverFormError(msg);
      setNotification({ message: msg, type: 'error' });
    }
  };
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({ plateNumber: '', status: 'available', capacity_m3: '', driver_id: '' });
  const [formError, setFormError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ truck_id: null, plateNumber: '', status: 'available', capacity_m3: '', driver_id: '' });
  const [editFormError, setEditFormError] = useState('');

  useEffect(() => {
    const fetchTrucks = () => {
      setLoading(true);
      fetch(`${API_BASE_URL}/api/trucks`)
        .then(res => res.json())
        .then(data => {
          setTrucks(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch trucks.');
          setLoading(false);
        });
    };
    fetchTrucks();
    const handler = () => fetchTrucks();
    window.addEventListener('refreshTrucks', handler);
    return () => window.removeEventListener('refreshTrucks', handler);
  }, []);

  // Fetch drivers for assignment
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/drivers`)
      .then(res => res.json())
      .then(data => setDrivers(data))
      .catch(() => setDrivers([]));
  }, []);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAddTruck = async e => {
    e.preventDefault();
    setFormError('');
    if (!form.plateNumber || !form.status || !form.capacity_m3) {
      setFormError('All fields except driver are required.');
      setNotification({ message: 'All fields except driver are required.', type: 'error' });
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/trucks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plateNumber: form.plateNumber,
        status: form.status,
        capacity_m3: form.capacity_m3,
        driver_id: form.driver_id ? parseInt(form.driver_id, 10) : null
      })
    });
    if (res.ok) {
      setAddModalOpen(false);
      setForm({ plateNumber: '', status: 'available', capacity_m3: '', driver_id: '' });
      setNotification({ message: 'Truck added successfully.', type: 'success' });
      // Refresh trucks
      setLoading(true);
      fetch(`${API_BASE_URL}/api/trucks`)
        .then(res => res.json())
        .then(data => {
          setTrucks(data);
          setLoading(false);
        });
    } else {
      const data = await res.json();
      let msg = data.error || 'Failed to add truck.';
      if (msg.toLowerCase().includes('plate')) msg = 'This truck plate is already used.';
      setFormError(msg);
      setNotification({ message: msg, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-yellow-700 mb-4">Truck Management</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-2 mb-4">
          <button className="bg-yellow-600 text-white px-4 py-2 rounded font-bold" onClick={() => setAddModalOpen(true)}>
            + Add Truck
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold" onClick={() => setAddDriverModalOpen(true)}>
            + Add Driver
          </button>
        </div>
      {/* Add Driver Modal */}
      {addDriverModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setAddDriverModalOpen(false); }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setAddDriverModalOpen(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-4">Add New Driver</h2>
            <form onSubmit={handleAddDriver} className="space-y-3">
              <input name="name" value={driverForm.name} onChange={handleDriverFormChange} placeholder="Driver Name" className="w-full border p-2 rounded" required />
              <input name="phone" value={driverForm.phone} onChange={handleDriverFormChange} placeholder="Phone Number" className="w-full border p-2 rounded" required />
              {driverFormError && <div className="text-red-600 text-sm mb-2">{driverFormError}</div>}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Add Driver</button>
            </form>
          </div>
        </div>
      )}
        {loading && <div className="text-center text-yellow-700 font-semibold mt-4">Loading trucks...</div>}
        {error && <div className="text-center text-red-600 font-semibold mt-4">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-yellow-100">
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Plate Number</th>
                <th className="px-4 py-2 border">Status</th>
        <th className="px-4 py-2 border">Capacity (m³)</th>
        <th className="px-4 py-2 border">Driver</th>
        <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map(truck => (
                <tr key={truck.truck_id} className="border-b">
                  <td className="px-4 py-2 border">{truck.truck_id}</td>
                  <td className="px-4 py-2 border">{truck.plateNumber}</td>
                  <td className="px-4 py-2 border">
                    {truck.status === 'available' && <span className="bg-green-200 text-green-800 px-2 py-1 rounded">Available</span>}
                    {truck.status === 'in_delivery' && <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded">In Delivery</span>}
                    {truck.status === 'maintenance' && <span className="bg-red-200 text-red-800 px-2 py-1 rounded">Maintenance</span>}
                  </td>
                  <td className="px-4 py-2 border">{truck.capacity_m3}</td>
                  <td className="px-4 py-2 border">{truck.driver ? truck.driver.name : <span className="text-gray-400">Unassigned</span>}</td>
                  <td className="px-4 py-2 border">
                    <button className="bg-yellow-500 text-white px-2 py-1 rounded mr-2" onClick={() => openEditModal(truck)}>Edit</button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => setRetireModal({ open: true, truckId: truck.truck_id })}>Retire</button>
                  </td>
      {/* Retire Truck Modal */}
      {retireModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setRetireModal({ open: false, truckId: null }); }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setRetireModal({ open: false, truckId: null })}>&times;</button>
            <h2 className="text-lg font-bold mb-4 text-red-700">Retire Truck</h2>
            <p className="mb-4">Are you sure you want to retire this truck? This will remove it from active use but keep it in the database.</p>
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded" onClick={() => setRetireModal({ open: false, truckId: null })}>Cancel</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded font-bold" onClick={() => handleRetireTruck(retireModal.truckId)}>Retire</button>
            </div>
          </div>
        </div>
      )}
      {/* Notification */}
      {notification.message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
             onClick={() => setNotification({ message: '', type: '' })}>
          {notification.message}
        </div>
      )}

      {/* Edit Truck Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setEditModalOpen(false); }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setEditModalOpen(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-4">Edit Truck</h2>
            <form onSubmit={handleEditTruck} className="space-y-3">
              <input name="plateNumber" value={editForm.plateNumber} onChange={handleEditFormChange} placeholder="Plate Number" className="w-full border p-2 rounded" required />
              <input name="capacity_m3" value={editForm.capacity_m3} onChange={handleEditFormChange} placeholder="Capacity (m³)" type="number" min="1" className="w-full border p-2 rounded" required />
              <select name="status" value={editForm.status} onChange={handleEditFormChange} className="w-full border p-2 rounded" required>
                <option value="available">Available</option>
                <option value="in_delivery">In Delivery</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select name="driver_id" value={editForm.driver_id} onChange={handleEditFormChange} className="w-full border p-2 rounded">
                <option value="">-- Assign Driver (optional) --</option>
                {drivers.filter(driver => {
                  // Only show drivers not assigned to any truck, or the current driver if not assigned elsewhere
                  const assignedDriverIds = trucks
                    .filter(t => t.driver_id && t.truck_id !== editForm.truck_id)
                    .map(t => t.driver_id);
                  // If driver is assigned to another truck, do not show
                  if (assignedDriverIds.includes(driver.driver_id)) return false;
                  // If driver is assigned to this truck, allow
                  if (driver.driver_id === editForm.driver_id) return true;
                  // If driver is not assigned, allow
                  return !trucks.some(t => t.driver_id === driver.driver_id);
                }).map(driver => (
                  <option key={driver.driver_id} value={driver.driver_id}>{driver.name} ({driver.phone})</option>
                ))}
              </select>
              {editFormError && <div className="text-red-600 text-sm mb-2">{editFormError}</div>}
              <button type="submit" className="w-full bg-yellow-600 text-white py-2 rounded font-bold hover:bg-yellow-700">Save Changes</button>
            </form>
          </div>
        </div>
      )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Add Truck Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setAddModalOpen(false); }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setAddModalOpen(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-4">Add New Truck</h2>
            <form onSubmit={handleAddTruck} className="space-y-3">
              <input name="plateNumber" value={form.plateNumber} onChange={handleFormChange} placeholder="Plate Number" className="w-full border p-2 rounded" required />
              <input name="capacity_m3" value={form.capacity_m3} onChange={handleFormChange} placeholder="Capacity (m³)" type="number" min="1" className="w-full border p-2 rounded" required />
              <select name="status" value={form.status} onChange={handleFormChange} className="w-full border p-2 rounded" required>
                <option value="available">Available</option>
                <option value="in_delivery">In Delivery</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select name="driver_id" value={form.driver_id} onChange={handleFormChange} className="w-full border p-2 rounded">
                <option value="">-- Assign Driver (optional) --</option>
                {drivers.filter(driver => {
                  // Only show drivers not assigned to any truck
                  const assignedDriverIds = trucks
                    .filter(t => t.driver_id)
                    .map(t => t.driver_id);
                  return !assignedDriverIds.includes(driver.driver_id);
                }).map(driver => (
                  <option key={driver.driver_id} value={driver.driver_id}>{driver.name} ({driver.phone})</option>
                ))}
              </select>
              {formError && <div className="text-red-600 text-sm mb-2">{formError}</div>}
              <button type="submit" className="w-full bg-yellow-600 text-white py-2 rounded font-bold hover:bg-yellow-700">Add Truck</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TruckManagementPage;
