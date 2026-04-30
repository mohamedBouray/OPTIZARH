import React, { useState, useEffect } from 'react';
import { 
  FileDown, Loader2, Truck, Search, 
  ShieldCheck, Calendar, Filter, Users,
  ChevronDown, ArrowRight, Info
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig'; 
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const ConsultationSNTL = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [availableYears, setAvailableYears] = useState([]);
  const [sntlData, setSntlData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetching, setFetching] = useState(false);

  // Charger les années
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        setAvailableYears(response.data);
      } catch (err) { console.error(err); }
    };
    fetchYears();
  }, []);

  // Charger les données SNTL
  useEffect(() => {
    const fetchData = async () => {
      const yearObj = availableYears.find(y => y.year === selectedYear);
      if (!yearObj) return;

      setFetching(true);
      try {
        const res = await api.get(`/api/sntl/configs?year_id=${yearObj.id}`);
        setSntlData(res.data || []);
      } catch (err) { console.error(err); }
      finally { setFetching(false); }
    };
    fetchData();
  }, [selectedYear, availableYears]);

  // Filter Logic
  const filteredData = sntlData.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculate
  const stats = {
    totalConfigs: sntlData.length,
    activeConfigs: sntlData.filter(d => d.is_active === 1).length,
    specificConfigs: sntlData.filter(d => d.categorie_cible === 'cadres').length
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Récapitulatif SNTL - ${selectedYear}`, 14, 20);
    
    const rows = filteredData.map(item => [
      item.label,
      `${item.valeur} ${item.type_montant === 'fixe' ? 'DH' : '%'}`,
      item.categorie_cible === 'tous' ? 'Tous les agents' : 'Cible spécifique',
      item.is_active ? 'Actif' : 'Inactif'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Désignation', 'Valeur', 'Application', 'Statut']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    });
    doc.save(`Consultation_SNTL_${selectedYear}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
              <Truck className="text-[#003366]" size={32} />
              Consultation Assurance SNTL
            </h1>
            <p className="text-slate-500 text-sm italic">Visualisation des paramètres de retenue SNTL</p>
          </div>

          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all uppercase shadow-md shadow-rose-200"
          >
            <FileDown size={16} className="text-rose-600" /> Télécharger Synthèse
          </button>
        </div>

                {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Configurations</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.totalConfigs}</h3>
            </div>
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Statut Actif</p>
              <h3 className="text-3xl font-black text-emerald-600">{stats.activeConfigs}</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Ciblages Cadres</p>
              <h3 className="text-3xl font-black text-blue-800">{stats.specificConfigs}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Search & Year Selector Bar (Nefs l-style li bghiti) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-4 tracking-tight">Année</span>
              <div className="relative flex items-center">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-lg font-bold text-[#003366] outline-none cursor-pointer appearance-none pr-6"
                >
                  {availableYears.map(y => (
                    <option key={y.id} value={y.year}>{y.year}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Rechercher une retenue..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {fetching && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>



        {/* Content Table / List */}
        {fetching ? (
          <div className="bg-white rounded-3xl p-20 flex flex-col items-center border border-slate-200">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-slate-400 font-bold italic tracking-tight">Récupération des données SNTL...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredData.map((item) => (
              <div key={item.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden ${item.is_active === 0 ? 'opacity-70 bg-slate-50' : ''}`}>
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`h-2 w-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <h4 className="font-black text-slate-700 uppercase text-sm tracking-tight">{item.label}</h4>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Valeur Actuelle</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#003366]">
                            {item.valeur}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {item.type_montant === 'fixe' ? 'DH' : '%'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="h-10 w-px bg-slate-100" />
                      
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Application</p>
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase">
                          {item.categorie_cible === 'tous' ? (
                            <> <Users size={14} className="text-blue-500" /> Tous les agents </>
                          ) : (
                            <> <Filter size={14} className="text-orange-500" /> Spécifique (Cadres) </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black border ${item.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    {item.is_active ? 'ACTIF' : 'INACTIF'}
                  </div>
                </div>

                {item.categorie_cible === 'cadres' && (
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-hidden">
                    <Info size={14} className="text-blue-400 shrink-0" />
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                      <span>Rôle ID: {item.role_id}</span>
                      <ArrowRight size={10} />
                      <span>Grade: {item.grade_id}</span>
                      <ArrowRight size={10} />
                      <span>Échelle: {item.echelle_id}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!fetching && filteredData.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-slate-500 font-black uppercase text-sm tracking-widest">Aucune donnée trouvée</h3>
            <p className="text-slate-400 text-xs mt-2 italic font-medium">Réessayez avec un autre filtre ou une autre année.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationSNTL;