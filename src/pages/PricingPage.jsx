import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaMoneyBillWave, FaHistory, FaPlusCircle, FaCheckCircle } from 'react-icons/fa';

const PARAM_LABELS = {
  fuel: 'Fuel Price (per L)',
  repair: 'Repair Cost (per km)',
  concrete: 'Concrete Price (per m³)',
  // Add more as needed
};

export default function PricingPage() {
  const [params, setParams] = useState([]);
  const [form, setForm] = useState({ type: '', value: '', currency: 'DA', note: '' });
  const [history, setHistory] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParams();
  }, []);

  const fetchParams = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/cost-parameters');
      // Ensure params is always an array
      setParams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Failed to load parameters');
      setParams([]);
    }
    setLoading(false);
  };

  const fetchHistory = async (type) => {
    setSelectedType(type);
    setHistory([]);
    setShowHistoryModal(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/cost-parameters/history/${type}`);
      setHistory(res.data);
    } catch (err) {
      setError('Failed to load history');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/cost-parameters', form);
      setForm({ type: '', value: '', currency: 'DA', note: '' });
      fetchParams();
    } catch (err) {
      setError('Failed to update parameter');
    }
  };

  return (
  <div className="max-w-[98vw] md:max-w-[1400px] mx-auto p-1 md:p-2 bg-white rounded-2xl shadow-lg mt-4 border border-yellow-100">
  <div className="flex items-center gap-3 mb-4">
        <FaMoneyBillWave className="text-yellow-500 text-3xl" />
        <h2 className="text-3xl font-extrabold text-yellow-700 tracking-tight">Pricing & Cost Parameters</h2>
      </div>
      {error && <div className="text-red-600 mb-2 font-semibold">{error}</div>}
  <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Left: Form */}
        <div className="flex-1 min-w-[320px] max-w-lg">
          <form onSubmit={handleSubmit} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 md:p-4 shadow-sm mb-4 md:mb-0">
            <h3 className="font-semibold mb-3 text-lg flex items-center gap-2"><FaPlusCircle className="text-yellow-600" /> Update/Add Parameter</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <select name="type" value={form.type} onChange={handleChange} className="border p-2 rounded min-w-[120px] bg-white" required>
                <option value="">Select Type</option>
                <option value="fuel">Fuel</option>
                <option value="repair">Repair</option>
                <option value="concrete">Concrete</option>
                {/* Add more types as needed */}
              </select>
              <input name="value" type="number" step="0.01" placeholder="Value" value={form.value} onChange={handleChange} className="border p-2 rounded w-32" required />
              <input name="currency" type="text" placeholder="Currency" value={form.currency} onChange={handleChange} className="border p-2 rounded w-24" />
              <input name="note" type="text" placeholder="Note (optional)" value={form.note} onChange={handleChange} className="border p-2 rounded flex-1 min-w-[180px]" />
            </div>
            <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-6 py-2 rounded-lg shadow transition">Save</button>
          </form>
        </div>
        {/* Right: Parameters Table */}
        <div className="flex-1 min-w-[320px]">
          <h3 className="font-semibold mb-2 text-lg flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Current Parameters</h3>
          {loading ? <div className="text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-yellow-50 text-yellow-900">
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Value</th>
                    <th className="p-3 text-left">Currency</th>
                    <th className="p-3 text-left">Effective</th>
                    <th className="p-3 text-left">History</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(params) && params.map(param => (
                    <tr key={param.type} className="border-t hover:bg-yellow-50 transition cursor-pointer" onClick={() => fetchHistory(param.type)}>
                      <td className="p-3 font-semibold">{PARAM_LABELS[param.type] || param.type}</td>
                      <td className="p-3">{param.value}</td>
                      <td className="p-3">{param.currency || 'DA'}</td>
                      <td className="p-3">{new Date(param.effective_at).toLocaleString()}</td>
                      <td className="p-3">
                        <button type="button" className="flex items-center gap-1 text-blue-700 hover:underline font-semibold" onClick={e => { e.stopPropagation(); fetchHistory(param.type); }}>
                          <FaHistory className="inline-block" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative animate-fadeIn" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500 text-2xl font-bold" onClick={() => setShowHistoryModal(false)}>&times;</button>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-base text-yellow-700"><FaHistory className="text-yellow-500" /> History for {PARAM_LABELS[selectedType] || selectedType}</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Value</th>
                    <th className="p-2 text-left">Currency</th>
                    <th className="p-2 text-left">Effective</th>
                    <th className="p-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="border-t">
                      <td className="p-2">{h.value}</td>
                      <td className="p-2">{h.currency || 'DA'}</td>
                      <td className="p-2">{new Date(h.effective_at).toLocaleString()}</td>
                      <td className="p-2">{h.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
