import React, { useState, useEffect } from 'react';
import { 
  Download, Loader2, Building2, ListTree, 
  TrendingUp, Calendar, ShieldCheck, FileText,
  Search, Activity
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const ConsultationCotisation = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [availableYears, setAvailableYears] = useState([]);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // <--- Search state
  const [fetching, setFetching] = useState(false);

  // --- Fetching Data ---
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        setAvailableYears(response.data);
      } catch (err) { console.error(err); }
    };
    fetchYears();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/api/get-cotisations?year=${selectedYear}`);
        setData(res.data || []);
      } catch (err) { console.error(err); }
      finally { setFetching(false); }
    };
    fetchData();
  }, [selectedYear]);

  // --- Search Logic ---
  const filteredData = data.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Stats Logic (based on filtered data or total data) ---
  const stats = {
    totalOrganismes: data.length,
    totalRubriques: data.reduce((acc, org) => acc + (org.rubriques?.length || 0), 0),
    maxTaux: data.length > 0 ? Math.max(...data.flatMap(org => org.rubriques?.map(r => parseFloat(r.taux) || 0) || [0])) : 0,
  };

  // --- Export PDF ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Rapport des Cotisations - Année ${selectedYear}`, 14, 20);
    
    let currentY = 30;
    filteredData.forEach((org) => {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text(org.name, 14, currentY);
      
      const rows = org.rubriques.map(r => [
        r.label, 
        r.plafond ? `${parseFloat(r.plafond).toLocaleString()} DH` : 'N/A', 
        `${r.taux}%`
      ]);

      autoTable(doc, {
        startY: currentY + 2,
        head: [['Désignation', 'Plafond', 'Taux']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        margin: { left: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`Synthese_Cotisations_${selectedYear}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <ShieldCheck className="text-blue-600" size={32} />
              Consultation des Paramètres
            </h1>
            <p className="text-slate-500 text-sm italic">Système de gestion des cotisations sociales</p>
          </div>

          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all uppercase shadow-md shadow-rose-200"
          >
            <Download size={16} /> Exporter PDF
          </button>
        </div>

        {/* TOP STATS BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Organismes</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.totalOrganismes}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <ListTree size={24} className="text-[#003366]" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Total Rubriques</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.totalRubriques}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp size={24} className="text-rose-600" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Taux Maximal</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-800">{stats.maxTaux}</span>
                <span className="text-sm font-semibold text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR - THE ONE YOU PROVIDED */}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {fetching && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>

        

        {/* DATA DISPLAY */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-slate-500 font-medium italic">Traitement des paramètres en cours...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredData.map((org) => (
              <div key={org.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-all group">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between group-hover:bg-blue-50/30">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-sm tracking-tight">
                    <FileText size={16} className="text-blue-500" />
                    {org.name}
                  </h4>
                  <span className="text-[10px] bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-400 font-bold">
                    {org.rubriques?.length || 0} Rubriques
                  </span>
                </div>
                <div className="p-0 text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white text-slate-400 border-b border-slate-50">
                        <th className="px-6 py-3 font-black uppercase tracking-tighter">Désignation</th>
                        <th className="px-6 py-3 font-black uppercase tracking-tighter text-right">Plafond</th>
                        <th className="px-6 py-3 font-black uppercase tracking-tighter text-center">Taux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {org.rubriques?.map((rub) => (
                        <tr key={rub.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-600">{rub.label}</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-500">
                            {rub.plafond ? `${parseFloat(rub.plafond).toLocaleString('fr-FR')} DH` : '-'}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-black">
                              {rub.taux}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredData.length === 0 && !fetching && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-300" />
             </div>
            <p className="text-slate-400 font-bold">Aucun résultat trouvé pour "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationCotisation;