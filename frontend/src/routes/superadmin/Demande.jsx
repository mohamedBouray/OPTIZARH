import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig';
import { Settings, Plus, Trash2, Save, Calendar, Loader2, FolderPlus } from 'lucide-react';

const SuperAdminConfig = () => {
  const [selectedYearId, setSelectedYearId] = useState('');
  const [years, setYears] = useState([]);
  const [categories, setCategories] = useState([]); // Hna nested categories + types
  const [loading, setLoading] = useState(false);

  // Forms states
  const [newCat, setNewCat] = useState({ name: '', max: 25 });
  const [newType, setNewType] = useState({ categoryId: '', name: '', maxDays: 0 });

  useEffect(() => {
    const fetchYears = async () => {
      const res = await api.get('/api/salary-years');
      setYears(res.data);
    };
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) fetchConfig(selectedYearId);
  }, [selectedYearId]);

  const fetchConfig = async (yearId) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/leave-config/full/${yearId}`);
      setCategories(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- F-React (SuperAdminConfig.jsx) ---

const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
        await api.post('/api/leave-config/save-category', {
            salary_year_id: parseInt(selectedYearId),
            category_name: newCat.name, // Khass hadi tkon m-definiya (newCat.name)
            annual_global_max: parseInt(newCat.max),
        });
        fetchConfig(selectedYearId);
        setNewCat({ name: '', max: 25 });
    } catch (e) { alert("Error adding category"); }
};

const handleAddType = async (e) => {
    e.preventDefault();
    if(!newType.categoryId) return alert("Khter l-catégorie!");
    try {
        // Hna khass l-URL i-koun kiy-chouf l-prefix "leave-config" kima f Laravel
        await api.post('/api/leave-config/types', { 
            salary_year_id: selectedYearId,
            leave_category_id: newType.categoryId,
            name: newType.name,
            max_days_per_request: newType.maxDays
        });
        fetchConfig(selectedYearId);
        setNewType({ categoryId: '', name: '', maxDays: 0 });
    } catch (e) { alert("Error adding type"); }
};

const deleteType = async (id) => {
    if(!confirm("M-t2aked?")) return;
    // Hna tany beddel l-URL l- "leave-config/types"
    await api.delete(`/api/leave-config/types/${id}`);
    fetchConfig(selectedYearId);
};

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-blue-600" /> Configuration RH
          </h1>
          <select 
            value={selectedYearId} 
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="border p-2 rounded-xl font-bold bg-slate-50"
          >
            <option value="">-- Sélectionner l'Année --</option>
            {years.map(y => <option key={y.id} value={y.id}>Année {y.year}</option>)}
          </select>
        </div>

        {selectedYearId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Formulaires */}
            <div className="space-y-6">
              {/* Add Category */}
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-slate-700">
                  <FolderPlus size={18}/> 1. Créer Catégorie
                </h2>
                <form onSubmit={handleAddCategory} className="space-y-3">
                  <input type="text" placeholder="Smit l-catégorie (ex: Congé)" className="w-full border p-2 rounded-lg" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} required/>
                  <input type="number" placeholder="Global Max (ex: 25j)" className="w-full border p-2 rounded-lg" value={newCat.max} onChange={e => setNewCat({...newCat, max: e.target.value})} />
                  <button className="w-full bg-slate-900 text-white p-2 rounded-lg font-bold">Ajouter Catégorie</button>
                </form>
              </div>

              {/* Add Type */}
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-slate-700">
                  <Plus size={18}/> 2. Ajouter Type à Catégorie
                </h2>
                <form onSubmit={handleAddType} className="space-y-3">
                  <select className="w-full border p-2 rounded-lg" value={newType.categoryId} onChange={e => setNewType({...newType, categoryId: e.target.value})} required>
                    <option value="">-- Khter l-catégorie --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                  <input type="text" placeholder="Smit l-type (ex: Maladie)" className="w-full border p-2 rounded-lg" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} required/>
                  <input type="number" placeholder="Max/Demande (ex: 3j)" className="w-full border p-2 rounded-lg" value={newType.maxDays} onChange={e => setNewType({...newType, maxDays: e.target.value})} />
                  <button className="w-full bg-blue-600 text-white p-2 rounded-lg font-bold">Lier le Type</button>
                </form>
              </div>
            </div>

            {/* View Config */}
            <div className="lg:col-span-2 space-y-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Catégorie</span>
                      <h3 className="font-bold text-lg text-slate-800">{cat.category_name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Plafond Global</span>
                      <p className="font-black text-slate-700">{cat.annual_global_max} Jours</p>
                    </div>
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y">
                      {cat.types?.map(type => (
                        <tr key={type.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium">{type.name}</td>
                          <td className="p-4 text-blue-600 font-bold">{type.max_days_per_request}j max/fois</td>
                          <td className="p-4 text-right">
                            <button onClick={() => deleteType(type.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminConfig;