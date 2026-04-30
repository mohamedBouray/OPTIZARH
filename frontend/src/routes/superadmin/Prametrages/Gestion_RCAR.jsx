import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, Users, Layers, 
  Grid, Database, DollarSign, FileText, Download, ChevronDown, Layout, Loader2,
  Star, Eye
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNotification } from '../../../context/NotificationContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';

const GestionRCAR = ({ darkMode = false }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [rcarData, setRcarData] = useState({
    salary_year_id: null,
    types: [] 
  });
  const [availableYears, setAvailableYears] = useState([]);

  // --- Modal Confirmation State ---
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    onConfirm: () => {},
    title: "",
    message: ""
  });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        setAvailableYears(response.data);
      } catch (error) {
        showNotification("Erreur lors du chargement des années", "error");
      }
    };
    fetchYears();
  }, []);

  const fetchConfig = async (year) => {
    setFetching(true);
    try {
      const response = await api.get(`/api/rcar/config/${year}`);
      const data = response.data; 

      if (data && data.rcar_types) {
        setRcarData({
          salary_year_id: data.id,
          types: data.rcar_types.map(t => ({
            id: t.id,
            label: t.label,
            isFavorite: Boolean(t.is_favorite),
            isVisible: true,
            details: t.details.map(d => ({
              id: d.id,
              name: d.designation,
              plafond: d.plafond || '',
              percentage: d.percentage
            }))
          }))
        });
      } else {
        setRcarData({ salary_year_id: data?.id || null, types: [] });
      }
    } catch (error) {
      showNotification("Erreur de chargement des données RCAR", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchConfig(selectedYear);
  }, [selectedYear]);

  // --- VALIDATION HELPER ---
  const validateInput = (field, value) => {
    let val = parseFloat(value);
    if (isNaN(val)) return value;
    if (field === 'percentage') {
      if (val > 100) return 100;
      if (val < 0) return 0;
    }
    if (field === 'plafond') {
      if (val < 0) return 0;
    }
    return val;
  };

  // --- ACTIONS ---
  const handleToggleFavorite = async (typeId, currentStatus) => {
    const updated = rcarData.types.map(t => 
      t.id === typeId ? { ...t, isFavorite: !currentStatus } : t
    );
    setRcarData({ ...rcarData, types: updated });

    try {
      if (!String(typeId).startsWith('new-')) {
        await api.patch(`/api/rcar/type/${typeId}/toggle-favorite`, {
          is_favorite: !currentStatus
        });
        showNotification(!currentStatus ? "Ajouté aux favoris (Global)" : "Retiré des favoris", "info");
      }
    } catch (error) {
      showNotification("Erreur de synchronisation favoris", "error");
      fetchConfig(selectedYear);
    }
  };

  const handleToggleView = (typeId) => {
    const updated = rcarData.types.map(t => 
      t.id === typeId ? { ...t, isVisible: !t.isVisible } : t
    );
    setRcarData({ ...rcarData, types: updated });
  };

  const addType = () => {
    const newType = { 
      id: `new-${Date.now()}`, 
      label: 'Nouveau Type de Cotisation', 
      isFavorite: false, 
      isVisible: true, 
      details: [] 
    };
    setRcarData(prev => ({ ...prev, types: [...prev.types, newType] }));
    showNotification("Nouveau type ajouté", "success");
  };

  const addDetail = (typeId) => {
    const updated = rcarData.types.map(t => {
      if (t.id === typeId) {
        return { ...t, details: [...t.details, { id: `det-${Date.now()}`, name: '', plafond: 0, percentage: 0 }] };
      }
      return t;
    });
    setRcarData(prev => ({ ...prev, types: updated }));
  };

  const handleDeleteType = (typeId, label) => {
    setConfirmConfig({
      isOpen: true,
      title: "Supprimer l'organisme RCAR",
      message: `Voulez-vous vraiment supprimer "${label}" ? Cette action supprimera également toutes les rubriques associées.`,
      onConfirm: async () => {
        if (String(typeId).startsWith('new-')) {
          setRcarData(prev => ({ ...prev, types: prev.types.filter(t => t.id !== typeId) }));
          showNotification("Organisme supprimé", "info");
        } else {
          try {
            await api.delete(`/api/rcar/type/${typeId}`);
            setRcarData(prev => ({ ...prev, types: prev.types.filter(t => t.id !== typeId) }));
            showNotification("Organisme supprimé de la base de données", "success");
          } catch (error) {
            showNotification("Erreur lors de la suppression", "error");
          }
        }
        closeConfirm();
      }
    });
  };

  const handleDeleteDetail = (typeId, detailId, label) => {
    setConfirmConfig({
      isOpen: true,
      title: "Supprimer la rubrique",
      message: `Voulez-vous supprimer la ligne "${label || 'sans nom'}" ?`,
      onConfirm: async () => {
        if (String(detailId).startsWith('det-')) {
          const updated = rcarData.types.map(t => 
            t.id === typeId ? { ...t, details: t.details.filter(d => d.id !== detailId) } : t
          );
          setRcarData(prev => ({ ...prev, types: updated }));
          showNotification("Ligne supprimée", "info");
        } else {
          try {
            await api.delete(`/api/rcar/detail/${detailId}`);
            const updated = rcarData.types.map(t => 
              t.id === typeId ? { ...t, details: t.details.filter(d => d.id !== detailId) } : t
            );
            setRcarData(prev => ({ ...prev, types: updated }));
            showNotification("Ligne supprimée définitivement", "success");
          } catch (error) {
            showNotification("Erreur lors de la suppression", "error");
          }
        }
        closeConfirm();
      }
    });
  };

  const handleSave = async () => {
    // Check validation avant l'envoi
    for (const type of rcarData.types) {
      for (const d of type.details) {
        if (d.percentage > 100 || d.percentage < 0) {
          showNotification(`Taux invalide (${d.percentage}%) pour ${d.name || 'une ligne'}`, "error");
          return;
        }
      }
    }

    if (!rcarData.salary_year_id) {
      showNotification("ID de l'année introuvable", "error");
      return;
    }

    setLoading(true);
    const payload = {
      salary_year_id: rcarData.salary_year_id,
      types: rcarData.types.map(t => ({
        label: t.label,
        details: t.details.map(d => ({
          designation: d.name,
          plafond: d.plafond === '' ? null : d.plafond,
          percentage: d.percentage || 0
        }))
      }))
    };

    try {
      await api.post('/api/rcar/config/save', payload);
      showNotification("Paramétrage RCAR enregistré avec succès", "success");
      fetchConfig(selectedYear);
    } catch (error) {
      showNotification("Erreur lors de la sauvegarde", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Grille des Salaires RCAR - Année ${selectedYear}`, 14, 22);
    let finalY = 35;

    rcarData.types.forEach((type) => {
      if (finalY > 240) { doc.addPage(); finalY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102); 
      doc.text(type.label, 14, finalY + 10);

      const tableData = type.details.map(d => [
        d.name || '---',
        d.plafond ? `${parseFloat(d.plafond).toLocaleString()} DH` : '---',
        `${d.percentage} %`
      ]);

      autoTable(doc, {
        startY: finalY + 15,
        head: [['Désignation', 'Plafond (DH)', 'Taux (%)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
      });
      finalY = doc.lastAutoTable.finalY + 5;
    });
    doc.save(`Grille_RCAR_${selectedYear}.pdf`);
    showNotification("Export PDF réussi", "success");
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 font-sans antialiased text-slate-900 pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">Grille des Salaires RCAR</h1>
            <p className="text-slate-500 text-sm italic">Gestion et paramétrage des taux de RCAR</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-4 tracking-tight">Année</span>
              <div className="relative flex items-center">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-xl font-bold text-[#003366] outline-none cursor-pointer appearance-none pr-6 z-10"
                >
                  {availableYears.map(y => (
                    <option key={y.id} value={y.year || y.annee}>{y.year || y.annee}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-0 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button onClick={exportToPDF} className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-rose-600 transition-all uppercase shadow-md">
              <Download size={16} /> Exporter PDF
            </button>
            <button onClick={addType} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all uppercase shadow-md">
              <Plus size={16} /> Nouveau Type
            </button>
          </div>
          {fetching && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>

        {/* DATA AREA */}
        <div className="space-y-6 min-h-[300px]">
          {rcarData.types.length === 0 && !fetching ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-6"><Layout size={48} className="text-slate-300" /></div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">Aucune configuration trouvée</h2>
              <button onClick={addType} className="bg-[#003366] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#002244] transition-all">
                <Plus size={20} /> Ajouter le premier type
              </button>
            </div>
          ) : (
            rcarData.types.map((type) => (
              <div key={type.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#003366] p-1.5 rounded text-white"><FileText size={16}/></div>
                    <input 
                      className="bg-transparent font-bold text-slate-700 outline-none border-b border-transparent focus:border-blue-500 px-1"
                      value={type.label}
                      onChange={(e) => {
                        const updated = rcarData.types.map(t => t.id === type.id ? {...t, label: e.target.value} : t);
                        setRcarData({...rcarData, types: updated});
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleToggleFavorite(type.id, type.isFavorite)} className={`transition-colors ${type.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}>
                      <Star size={18} fill={type.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => handleToggleView(type.id)} className={`transition-colors ${type.isVisible ? 'text-blue-500' : 'text-slate-300 hover:text-blue-500'}`}>
                      <Eye size={18} />
                    </button>
                    <button onClick={() => handleDeleteType(type.id, type.label)} className="text-slate-300 hover:text-rose-500 ml-2">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

                {type.isVisible && (
                  <div className="p-6">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                          <th className="pb-3 pl-2 w-1/2">Désignation</th>
                          <th className="pb-3 px-4 text-center">Plafond (DH)</th>
                          <th className="pb-3 px-4 text-center">Taux (%)</th>
                          <th className="pb-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {type.details.map((det) => (
                          <tr key={det.id} className="group">
                            <td className="py-3 pr-4">
                              <input 
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-sm focus:bg-white outline-none transition-all"
                                value={det.name}
                                placeholder="Désignation"
                                onChange={(e) => {
                                  const updated = rcarData.types.map(t => t.id === type.id ? {
                                    ...t, details: t.details.map(d => d.id === det.id ? {...d, name: e.target.value} : d)
                                  } : t);
                                  setRcarData({...rcarData, types: updated});
                                }}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input 
                                type="number"
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-sm font-bold text-center"
                                value={det.plafond}
                                onChange={(e) => {
                                  const val = validateInput('plafond', e.target.value);
                                  const updated = rcarData.types.map(t => t.id === type.id ? {
                                    ...t, details: t.details.map(d => d.id === det.id ? {...d, plafond: val} : d)
                                  } : t);
                                  setRcarData({...rcarData, types: updated});
                                }}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-lg px-2 max-w-[120px] mx-auto">
                                <input 
                                  type="number"
                                  className="w-full bg-transparent p-2.5 text-sm font-black text-indigo-600 text-center outline-none"
                                  value={det.percentage}
                                  onChange={(e) => {
                                    const val = validateInput('percentage', e.target.value);
                                    const updated = rcarData.types.map(t => t.id === type.id ? {
                                      ...t, details: t.details.map(d => d.id === det.id ? {...d, percentage: val} : d)
                                    } : t);
                                    setRcarData({...rcarData, types: updated});
                                  }}
                                />
                                <span className="text-indigo-300 font-bold text-xs">%</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <button onClick={() => handleDeleteDetail(type.id, det.id, det.name)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => addDetail(type.id)} className="mt-4 text-[11px] font-black text-indigo-600 flex items-center gap-1 hover:text-indigo-800 uppercase tracking-wider">
                      <Plus size={14} /> Ajouter une ligne
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        {rcarData.types.length > 0 && (
          <div className="mt-12 flex justify-end">
            <button onClick={handleSave} disabled={loading || fetching} className="flex items-center gap-3 bg-[#003366] text-white px-10 py-4 rounded-xl text-sm font-black hover:bg-[#002244] shadow-xl disabled:opacity-50 transition-all hover:scale-[1.02]">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? "ENREGISTREMENT..." : "SAUVEGARDER LE PARAMÉTRAGE"}
            </button>
          </div>
        )}

        <DeleteConfirmModal 
          isOpen={confirmConfig.isOpen}
          onClose={closeConfirm}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default GestionRCAR;