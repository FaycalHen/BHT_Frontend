
import React, { useEffect, useState } from 'react';
import { FaTruck, FaChartPie, FaList, FaClock, FaUser, FaChartBar } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentDeliveries, setRecentDeliveries] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/analytics')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch recent deliveries (last 5)
    fetch('http://localhost:5000/api/deliveries?limit=5&sort=desc')
      .then(res => res.json())
      .then(data => setRecentDeliveries(data.slice(0, 5)))
      .catch(() => setRecentDeliveries([]));
  }, []);

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (!stats) return <div className="p-6">No data</div>;

  // Pie chart data for deliveries by status
  const totalDeliveries = stats.totalDeliveries || 0;
  const statusColors = [
    "bg-yellow-400 text-yellow-900",
    "bg-blue-400 text-blue-900",
    "bg-green-400 text-green-900",
    "bg-red-400 text-red-900",
    "bg-purple-400 text-purple-900",
    "bg-orange-300 text-orange-900"
  ];

  // Top 5 most utilized trucks
  const topTrucks = (stats.truckUtil || []).slice(0, 5);

  // Active deliveries (not completed)
  const activeDeliveries = recentDeliveries.filter(d => d.status && d.status !== 'completed');

  // Truck availability (requires truck status, fallback to truckUtil count)
  // This is a placeholder, as truck status is not in truckUtil. Adjust if available.
  const totalTrucks = stats.truckUtil ? stats.truckUtil.length : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 flex items-center gap-2"><FaChartBar className="text-blue-600" /> Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-xl transition">
          <div className="text-sm text-gray-500 flex items-center gap-2"><FaList /> Total deliveries</div>
          <div className="text-3xl font-extrabold text-blue-700 mt-2">{stats.totalDeliveries}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-xl transition">
          <div className="text-sm text-gray-500 flex items-center gap-2"><FaChartPie /> Total volume (m³)</div>
          <div className="text-3xl font-extrabold text-green-700 mt-2">{stats.totalVolume}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center hover:shadow-xl transition">
          <div className="text-sm text-gray-500 flex items-center gap-2"><FaTruck /> Trucks in delivery</div>
          <div className="text-3xl font-extrabold text-yellow-700 mt-2">{typeof stats.trucksInDelivery !== 'undefined' ? stats.trucksInDelivery : 0} <span className="text-lg text-gray-400">/ {totalTrucks}</span></div>
        </div>
      </div>

      {/* Deliveries by Status Badges */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg"><FaChartPie className="text-yellow-500" /> Deliveries by Status</h2>
        <div className="flex flex-wrap gap-4">
          {(stats.totalsByStatus || []).map((s, i) => (
            <span key={s.status} className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-xs ${statusColors[i % statusColors.length]}`}>{s.status}: {s.count}</span>
          ))}
        </div>
      </div>

      {/* Top 5 Most Utilized Trucks with Progress Bars */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg"><FaTruck className="text-green-600" /> Top 5 Most Utilized Trucks (30 days)</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="pr-4">Plate</th>
              <th className="pr-4">Capacity (m³)</th>
              <th>Deliveries</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {topTrucks.map(truck => {
              const maxDeliveries = topTrucks[0]?.deliveries_count || 1;
              const percent = Math.round((truck.deliveries_count / maxDeliveries) * 100);
              return (
                <tr key={truck.truck_id} className="hover:bg-gray-50 transition">
                  <td className="pr-4 font-mono">{truck.plateNumber}</td>
                  <td className="pr-4">{truck.capacity_m3}</td>
                  <td>{truck.deliveries_count}</td>
                  <td className="w-40">
                    <div className="bg-gray-200 rounded h-3">
                      <div className="bg-blue-500 h-3 rounded" style={{ width: `${percent}%` }}></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Deliveries with Status Badges */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg"><FaClock className="text-blue-600" /> Recent Deliveries</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="pr-4">Customer</th>
              <th className="pr-4">Status</th>
              <th>Trucks</th>
            </tr>
          </thead>
          <tbody>
            {recentDeliveries.map(d => (
              <tr key={d.delivery_id} className="hover:bg-gray-50 transition">
                <td className="pr-4">{d.customer?.name || '-'}</td>
                <td className="pr-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${d.status === 'completed' ? 'bg-green-200 text-green-800' : d.status === 'scheduled' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>{d.status}</span>
                </td>
                <td>{d.trucks ? d.trucks.map(t => t.plateNumber).join(', ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Deliveries */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg"><FaUser className="text-purple-600" /> Active Deliveries</h2>
        <div className="mb-2 font-bold text-blue-700">{activeDeliveries.length} active</div>
        <ul className="list-disc ml-6">
          {activeDeliveries.map(d => (
            <li key={d.delivery_id} className="mb-1">{d.customer?.name || '-'} <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${d.status === 'completed' ? 'bg-green-200 text-green-800' : d.status === 'scheduled' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>{d.status}</span></li>
          ))}
        </ul>
      </div>

      {/* Truck Availability (placeholder) */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg"><FaTruck className="text-gray-600" /> Truck Availability</h2>
        <div className="flex gap-8">
          <div className="font-semibold">Total trucks: <span className="text-blue-700">{totalTrucks}</span></div>
          <div className="font-semibold">In delivery: <span className="text-yellow-700">{typeof stats.trucksInDelivery !== 'undefined' ? stats.trucksInDelivery : 0}</span></div>
        </div>
        {/* Add more breakdown if truck status is available in API */}
      </div>

      {/* Deliveries per day chart */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg"><FaChartBar className="text-pink-600" /> Deliveries (last 7 days)</h2>
        <div className="flex space-x-2 items-end h-32">
          {(Array.isArray(stats.deliveriesPerDay) ? stats.deliveriesPerDay : []).map(({ day, count }) => (
            <div key={day} className="flex flex-col items-center justify-end">
              <div className="w-8 bg-yellow-300 rounded-t transition-all duration-300" style={{ height: `${Math.max(8, count * 12)}px` }}></div>
              <div className="text-xs mt-1 text-gray-500">{day.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
