import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, CheckCircle2, 
  Loader2, FileText, Star, Eye, EyeOff, Download, Calendar
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useNotification } from '../../../context/NotificationContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';

const GestionCotisation = ({ darkMode = false }) => {
  const { showNotification } = useNotification();
  const [config, setConfig] = useState({
    year: 2026,
    organismes: []
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [uiStates, setUiStates] = useState({});

  // Configuration dyal Modal Confirmation
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    onConfirm: () => {},
    title: "",
    message: ""
  });

  const closeConfirm = () => setConfirmConfig({ ...confirmConfig, isOpen: false });

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

  const fetchData = async () => {
    setFetching(true);
    try {
      const response = await api.get(`/api/get-cotisations?year=${config.year}`);
      if (response.data && response.data.length > 0) {
        setConfig(prev => ({ ...prev, organismes: response.data }));
        const initialStates = {};
        response.data.forEach(org => {
          initialStates[org.id] = { 
            visible: true, 
            favorite: org.is_favorite 
          };
        });
        setUiStates(initialStates);
      } else {
        setConfig(prev => ({ ...prev, organismes: [] }));
      }
    } catch (error) {
      showNotification("Erreur lors du chargement des données", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [config.year]);

  // --- Validations ---
  const validateValue = (field, val) => {
    let value = parseFloat(val);
    if (isNaN(value)) return val; 

    if (field === 'taux') {
      if (value > 100) return 100;
      if (value < 0) return 0;
    }
    if (field === 'plafond') {
      if (value < 0) return 0;
    }
    return value;
  };

  // --- Handlers ---
  const toggleVisibility = (id) => {
    setUiStates(prev => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id]?.visible }
    }));
  };

  const addOrganisme = () => {
    const newId = Date.now();
    const newOrg = { id: newId, name: 'Nouvel Organisme', rubriques: [] };
    setConfig({ ...config, organismes: [...config.organismes, newOrg] });
    setUiStates(prev => ({ ...prev, [newId]: { visible: true, favorite: false } }));
    showNotification("Organisme ajouté", "success");
  };

  const deleteOrganisme = (id, name) => {
    setConfirmConfig({
      isOpen: true,
      title: "Supprimer l'organisme",
      message: `Voulez-vous vraiment supprimer "${name}" et toutes ses rubriques ?`,
      onConfirm: () => {
        setConfig({ ...config, organismes: config.organismes.filter(o => o.id !== id) });
        showNotification("Organisme supprimé localement", "info");
        closeConfirm();
      }
    });
  };

  const addRubrique = (orgId) => {
    const updatedOrgs = config.organismes.map(org => {
      if (org.id === orgId) {
        return {
          ...org,
          rubriques: [...org.rubriques, { id: Date.now(), label: '', type: 'Social', taux: 0, plafond: 0 }]
        };
      }
      return org;
    });
    setConfig({ ...config, organismes: updatedOrgs });
  };

  const deleteRubrique = (orgId, rubId, label) => {
    setConfirmConfig({
      isOpen: true,
      title: "Supprimer la rubrique",
      message: `Supprimer "${label || 'cette ligne'}" ?`,
      onConfirm: () => {
        const updated = config.organismes.map(o => o.id === orgId ? {...o, rubriques: o.rubriques.filter(r => r.id !== rubId)} : o);
        setConfig({...config, organismes: updated});
        showNotification("Ligne supprimée", "info");
        closeConfirm();
      }
    });
  };

  const updateRubrique = (orgId, rubId, field, val) => {
    const validatedVal = (field === 'taux' || field === 'plafond') ? validateValue(field, val) : val;
    
    const updatedOrgs = config.organismes.map(org => {
      if (org.id === orgId) {
        const newRubriques = org.rubriques.map(rub => rub.id === rubId ? { ...rub, [field]: validatedVal } : rub);
        return { ...org, rubriques: newRubriques };
      }
      return org;
    });
    setConfig({ ...config, organismes: updatedOrgs });
  };

  const handleSave = async () => {
    // Check validation avant l'envoi
    for (const org of config.organismes) {
      for (const rub of org.rubriques) {
        if (rub.taux > 100 || rub.taux < 0) {
          showNotification(`Taux invalide pour ${rub.label} (${org.name})`, "error");
          return;
        }
      }
    }

    setLoading(true);
    try {
      await api.post('/api/save-cotisations', config);
      await fetchData();
      showNotification("Paramétrage enregistré avec succès !", "success");
    } catch (error) {
      showNotification("Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    const newStatus = !uiStates[id]?.favorite;
    try {
      const response = await api.post(`/api/favorite/${id}`, { is_favorite: newStatus });
      if (response.status === 200) {
        setUiStates(prev => ({ ...prev, [id]: { ...prev[id], favorite: newStatus } }));
        showNotification(newStatus ? "Ajouté aux favoris" : "Retiré des favoris", "info");
      }
    } catch (error) {
      showNotification("Erreur de synchronisation favoris", "error");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Paramétrage des Cotisations - ${config.year}`, 14, 20);
    
    let currentY = 30;
    config.organismes.forEach((org) => {
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(12);
      doc.text(org.name, 14, currentY);
      
      const tableData = org.rubriques.map(rub => [
        rub.label || '-',
        rub.plafond ? `${parseFloat(rub.plafond).toLocaleString()} DH` : '-',
        `${rub.taux || 0} %`
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Désignation', 'Plafond', 'Taux']],
        body: tableData,
        headStyles: { fillColor: [0, 51, 102] },
      });
      currentY = doc.lastAutoTable.finalY + 15;
    });
    doc.save(`Cotisations_${config.year}.pdf`);
    showNotification("Export PDF réussi", "success");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans antialiased text-slate-900 pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <Calendar size={16} className="text-slate-400 mr-2" />
              <select 
                value={config.year}
                onChange={(e) => setConfig(prev => ({...prev, year: parseInt(e.target.value)}))}
                className="bg-transparent text-xl font-bold text-[#003366] outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y.id} value={y.year || y.annee}>{y.year || y.annee}</option>
                ))}
              </select>
            </div>

            <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-2.5 bg-[#ff2d55] text-white rounded-xl font-bold text-xs uppercase shadow-sm">
              <Download size={18} /> PDF
            </button>

            <button onClick={addOrganisme} className="flex items-center gap-2 px-5 py-2.5 bg-[#00a878] text-white rounded-xl font-bold text-xs uppercase shadow-sm">
              <Plus size={18} /> Nouveau Type
            </button>
          </div>
          {fetching && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>

        {/* LIST */}
        <div className="space-y-6">
          {config.organismes.map((org) => (
            <div key={org.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="bg-[#003366] p-2 rounded-lg text-white"><FileText size={18}/></div>
                  <input 
                    className="font-bold text-slate-800 text-lg outline-none bg-transparent focus:border-b border-blue-500"
                    value={org.name}
                    onChange={(e) => {
                      const updated = config.organismes.map(o => o.id === org.id ? {...o, name: e.target.value} : o);
                      setConfig({...config, organismes: updated});
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFavorite(org.id)} className={`p-2 rounded-lg ${uiStates[org.id]?.favorite ? 'text-yellow-500 bg-yellow-50' : 'text-slate-300'}`}>
                    <Star size={20} fill={uiStates[org.id]?.favorite ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => toggleVisibility(org.id)} className={`p-2 rounded-lg ${uiStates[org.id]?.visible ? 'text-blue-500 bg-blue-50' : 'text-slate-300'}`}>
                    {uiStates[org.id]?.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                  <button onClick={() => deleteOrganisme(org.id, org.name)} className="text-slate-300 hover:text-rose-500 p-2">
                    <Trash2 size={20}/>
                  </button>
                </div>
              </div>

              {uiStates[org.id]?.visible && (
                <div className="p-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-4 w-1/3 text-center">Désignation</th>
                        <th className="pb-4 text-center">Plafond (DH)</th>
                        <th className="pb-4 text-center">Taux (%)</th>
                        <th className="pb-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {org.rubriques.map((rub) => (
                        <tr key={rub.id} className="hover:bg-slate-50/50">
                          <td className="py-4 pr-4">
                            <input 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:bg-white"
                              value={rub.label}
                              onChange={(e) => updateRubrique(org.id, rub.id, 'label', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input 
                              type="number"
                              className="w-32 mx-auto block bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-center outline-none"
                              value={rub.plafond}
                              onChange={(e) => updateRubrique(org.id, rub.id, 'plafond', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="relative w-28 mx-auto">
                              <input 
                                type="number"
                                className="w-full bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm font-bold text-blue-600 text-center outline-none"
                                value={rub.taux}
                                onChange={(e) => updateRubrique(org.id, rub.id, 'taux', e.target.value)}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 text-xs font-bold">%</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <button onClick={() => deleteRubrique(org.id, rub.id, rub.label)} className="text-slate-200 hover:text-rose-500">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => addRubrique(org.id)} className="mt-6 text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline uppercase">
                    <Plus size={16} /> Ajouter une ligne
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SAVE BUTTON */}
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#003366] hover:bg-[#002244] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all hover:scale-105 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span className="font-bold uppercase tracking-widest text-sm">Enregistrer</span>
          </button>
        </div>

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

export default GestionCotisation;