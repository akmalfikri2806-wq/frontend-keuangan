import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, ArrowUpRight, ArrowDownRight, Pencil, Trash2, X } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [percentageChange, setPercentageChange] = useState({ income: 0, expense: 0 });
  
  // State Form Tambah
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  // State untuk Mode Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const fetchData = useCallback(async () => {
    try {
      const resTx = await axios.get(`${API_URL}/api/transactions`);
      const resStats = await axios.get(`${API_URL}/api/statistics`);
      const resCat = await axios.get(`${API_URL}/api/categories`);
      const resMonthly = await axios.get(`${API_URL}/api/statistics/monthly`);
      
      setTransactions(resTx.data);
      setStats(resStats.data);
      setCategories(resCat.data);
      setMonthlyData(resMonthly.data);

      if (resMonthly.data.length >= 2) {
        const currentMonth = resMonthly.data[resMonthly.data.length - 1];
        const lastMonth = resMonthly.data[resMonthly.data.length - 2];

        const calcInc = lastMonth.income > 0 
          ? ((currentMonth.income - lastMonth.income) / lastMonth.income) * 100 
          : 0;
        
        const calcExp = lastMonth.expense > 0 
          ? ((currentMonth.expense - lastMonth.expense) / lastMonth.expense) * 100 
          : 0;

        setPercentageChange({
          income: calcInc.toFixed(1),
          expense: calcExp.toFixed(1)
        });
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Simpan (Tambah atau Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/transactions/${editId}`, form);
        setIsEditing(false);
        setEditId(null);
      } else {
        await axios.post(`${API_URL}/api/transactions`, form);
      }
      
      setForm({ 
        title: '', 
        amount: '', 
        type: 'EXPENSE', 
        category_id: '', 
        transaction_date: new Date().toISOString().split('T')[0] 
      });
      fetchData();
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
    }
  };

  // Handle Edit (Memasukkan data ke form)
  const handleEditClick = (tx) => {
    setIsEditing(true);
    setEditId(tx.id);
    setForm({
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category_id: tx.category_id || '',
      transaction_date: tx.transaction_date.split('T')[0]
    });
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Handle Batal Edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      title: '',
      amount: '',
      type: 'EXPENSE',
      category_id: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });
  };

  // Handle Hapus Transaksi
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      try {
        await axios.delete(`${API_URL}/api/transactions/${id}`);
        fetchData();
      } catch (err) {
        console.error("Gagal menghapus transaksi:", err);
      }
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === form.type);

  const chartData = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Pemasukan',
        data: monthlyData.map(item => item.income),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Pengeluaran',
        data: monthlyData.map(item => item.expense),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Title */}
        <header className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Aplikasi Keuangan</h1>
            <p className="text-sm text-gray-500">Kelola keuangan harian dengan statistik tren</p>
          </div>
          <Wallet className="w-10 h-10 text-blue-600" />
        </header>

        {/* Statistik Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-medium">Sisa Saldo</p>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Rp {Number(stats.balance).toLocaleString()}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Pemasukan</p>
                <h2 className="text-xl font-bold text-green-600 mt-1">Rp {Number(stats.total_income).toLocaleString()}</h2>
              </div>
              <TrendingUp className="w-7 h-7 text-green-500" />
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold">
              {Number(percentageChange.income) >= 0 ? (
                <span className="text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-4 h-4 mr-1" /> +{percentageChange.income}% dari bulan lalu
                </span>
              ) : (
                <span className="text-red-600 flex items-center bg-red-50 px-2 py-1 rounded-md">
                  <ArrowDownRight className="w-4 h-4 mr-1" /> {percentageChange.income}% dari bulan lalu
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Pengeluaran</p>
                <h2 className="text-xl font-bold text-red-600 mt-1">Rp {Number(stats.total_expense).toLocaleString()}</h2>
              </div>
              <TrendingDown className="w-7 h-7 text-red-500" />
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold">
              {Number(percentageChange.expense) <= 0 ? (
                <span className="text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-md">
                  <ArrowDownRight className="w-4 h-4 mr-1" /> {percentageChange.expense}% dari bulan lalu
                </span>
              ) : (
                <span className="text-red-600 flex items-center bg-red-50 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-4 h-4 mr-1" /> +{percentageChange.expense}% dari bulan lalu
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Diagram Garis */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Tren Keuangan Bulanan</h3>
          {monthlyData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p className="text-center text-gray-400 py-6">Belum cukup data untuk menampilkan grafik.</p>
          )}
        </div>

        {/* Form Tambah / Edit Transaksi */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border-2 ${isEditing ? 'border-amber-400 bg-amber-50/20' : 'border-transparent'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PlusCircle className={`w-5 h-5 ${isEditing ? 'text-amber-600' : 'text-blue-600'}`} /> 
              {isEditing ? `Edit Transaksi (ID: ${editId})` : 'Tambah Transaksi Baru'}
            </h3>
            {isEditing && (
              <button onClick={handleCancelEdit} className="text-xs flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium">
                <X className="w-4 h-4" /> Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input 
              type="text" placeholder="Nama Transaksi" 
              value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="border p-2.5 rounded-xl text-sm focus:outline-blue-500 bg-white" required 
            />
            <input 
              type="number" placeholder="Jumlah (Rp)" 
              value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              className="border p-2.5 rounded-xl text-sm focus:outline-blue-500 bg-white" required 
            />
            <select 
              value={form.type} onChange={e => setForm({...form, type: e.target.value, category_id: ''})}
              className="border p-2.5 rounded-xl text-sm focus:outline-blue-500 bg-white"
            >
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
            </select>
            <select 
              value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
              className="border p-2.5 rounded-xl text-sm focus:outline-blue-500 bg-white" required
            >
              <option value="">Pilih Kategori</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button type="submit" className={`text-white font-medium p-2.5 rounded-xl transition ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isEditing ? 'Update Data' : 'Simpan'}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-white p-6 rounded-2xl shadow-sm overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Transaksi</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-400 text-sm">
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Keterangan</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Jenis</th>
                <th className="pb-3 text-right">Nominal</th>
                <th className="pb-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-400">Belum ada data transaksi</td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-500">{tx.transaction_date.split('T')[0]}</td>
                    <td className="py-3 font-medium text-gray-800">{tx.title}</td>
                    <td className="py-3 text-gray-600">{tx.category_name}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(tx)} 
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx.id)} 
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default App;