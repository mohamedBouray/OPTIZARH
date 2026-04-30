import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Star, Download, Printer, 
  Search, ChevronRight, Calculator, Calendar, FileText, Loader2,TrendingUp, ArrowUpRight, Wallet, Users,Shield
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ConsulterRCAR = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [availableYears, setAvailableYears] = useState([]);
  const [rcarData, setRcarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

    const stats = React.useMemo(() => {
    // Vérification 3la rcarData hit hiya li fiha l-jawwab dial l-API
    if (!rcarData || rcarData.length === 0) return { totalTaux: "0.00", maxPlafond: 0, totalTypes: 0 };
    
    let totalTaux = 0;
    let maxPlafond = 0;
    
    rcarData.forEach(type => {
        if (type.details) {
        type.details.forEach(d => {
            totalTaux += parseFloat(d.percentage || 0);
            const p = parseFloat(d.plafond || 0);
            if (p > maxPlafond) maxPlafond = p;
        });
        }
    });

    return {
        totalTaux: totalTaux.toFixed(2),
        maxPlafond: maxPlafond,
        totalTypes: rcarData.length
    };
    }, [rcarData]);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        setAvailableYears(response.data);
      } catch (error) { console.error(error); }
    };
    fetchYears();
  }, []);

  const fetchConfig = async (year) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/rcar/config/${year}`);
      setRcarData(response.data?.rcar_types || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfig(selectedYear); }, [selectedYear]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Consultation RCAR - Année ${selectedYear}`, 14, 22);
    let finalY = 30;

    rcarData.forEach((type) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text(type.label.toUpperCase(), 14, finalY + 10);
      
      autoTable(doc, {
        startY: finalY + 15,
        head: [['Désignation', 'Plafond (DH)', 'Taux (%)']],
        body: type.details.map(d => [
          d.designation, 
          d.plafond ? `${parseFloat(d.plafond).toLocaleString()} DH` : '---', 
          `${d.percentage} %`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] }
      });
      finalY = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`Consultation_RCAR_${selectedYear}.pdf`);
  };

  const filteredData = rcarData.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        
        {/* HEADER BHAL PAGE COTISATION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">Consultation RCAR</h1>
            <p className="text-slate-500 text-sm italic">Affichage des taux et plafonds par année</p>
          </div>
          <div className="flex gap-3">
             <button onClick={exportToPDF} className="flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-600 transition-all uppercase shadow-md">
               <Download size={16} /> Exporter PDF
             </button>
          </div>
        </div>

{/* TOP STATS BOXES - STANDARDIZED DESIGN */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
    
    {/* Card 1: Somme des Taux */}
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
        <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
        <TrendingUp size={24} className="text-indigo-600" />
        </div>
        <div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Somme des Taux</p>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{stats.totalTaux}</span>
            <span className="text-sm font-semibold text-slate-400">%</span>
        </div>
        </div>
    </div>

    {/* Card 2: Plafond Maximal */}
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
        <Wallet size={24} className="text-[#003366]" />
        </div>
        <div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Plafond Maximal</p>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">
            {stats.maxPlafond > 0 ? stats.maxPlafond.toLocaleString('fr-FR') : "0"}
            </span>
            <span className="text-sm font-semibold text-slate-400">DH</span>
        </div>
        </div>
    </div>

    {/* Card 3: Organismes Actifs */}
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
        <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
        <Shield size={24} className="text-rose-600" />
        </div>
        <div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Organismes Actifs</p>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{stats.totalTypes}</span>
            <span className="text-sm font-semibold text-slate-400 ml-1">Entités</span>
        </div>
        </div>
    </div>

    </div>

        {/* CONTROLS AREA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-4 tracking-tight">Année</span>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-lg font-bold text-[#003366] outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y.id} value={y.year || y.annee}>{y.year || y.annee}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Rechercher un organisme..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>

        {/* DATA DISPLAY */}
        <div className="space-y-6">
          {filteredData.length === 0 && !loading ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
              <p className="text-slate-400 font-medium">Aucune donnée trouvée pour cette sélection.</p>
            </div>
          ) : (
            filteredData.map((type) => (
              <div key={type.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#003366] p-1.5 rounded text-white shadow-md shadow-blue-900/20"><FileText size={16}/></div>
                    <h2 className="font-bold text-slate-700 uppercase tracking-tight">{type.label}</h2>
                    {type.is_favorite && <Star size={14} className="text-amber-500" fill="currentColor" />}
                  </div>
                </div>

                <div className="p-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                        <th className="pb-3 pl-2 w-1/2">Désignation</th>
                        <th className="pb-3 px-4 text-center">Plafond (DH)</th>
                        <th className="pb-3 px-4 text-right">Taux (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {type.details.map((det, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-40"></div>
                              <span className="text-sm font-semibold text-slate-600">{det.designation}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                              {det.plafond ? `${parseFloat(det.plafond).toLocaleString('fr-FR')} DH` : 'SANS PLAFOND'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-lg font-black text-indigo-600">{det.percentage}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default ConsulterRCAR;