import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { 
  Calendar, FileText, Paperclip, Send, Clock, 
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Folder, ListTree, X,
  LayoutDashboard, Info, Moon, Sun
} from 'lucide-react';

// Contexts requested
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const EmployeeLeave = () => {
  // Context Hooks
  const { showNotification } = useNotification();
  const { theme } = useTheme();

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [displayYear, setDisplayYear] = useState(''); 
  const [detailModal, setDetailModal] = useState({ show: false, req: null });
  
  const [categories, setCategories] = useState([]); 
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  const tomorrowStr = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }, []);

  const [formData, setFormData] = useState({
    category_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    duration: 0,
    comments: '',
    attachment: null 
  });

  // 1. Fetch l-years
  useEffect(() => {
    const fetchAndSetCurrentYear = async () => {
      try {
        const res = await api.get('/api/salary-years');
        setYears(res.data);
        const currentYearValue = new Date().getFullYear().toString();
        const foundYear = res.data.find(y => y.year.toString() === currentYearValue);
        
        if (foundYear) {
          setSelectedYear(foundYear.id);
          setDisplayYear(foundYear.year);
        } else if (res.data.length > 0) {
          setSelectedYear(res.data[0].id);
          setDisplayYear(res.data[0].year);
        }
      } catch (err) {
        addNotification({ type: 'error', message: "Erreur lors de la récupération de l'année" });
      }
    };
    fetchAndSetCurrentYear();
  }, []);

  // 2. Fetch data melli t-settat selectedYear
  useEffect(() => {
    if (selectedYear) fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, historyRes] = await Promise.all([
        api.get(`/api/leave-config/full/${selectedYear}`),
        api.get(`/api/leave-requests/my-history`)
      ]);
      setCategories(configRes.data);
      setRequests(historyRes.data);
    } catch (err) {
      addNotification({ type: 'error', message: "Mouchkil f chargement d data" });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryTypes = categories.find(c => c.id.toString() === formData.category_id)?.types || [];
  const selectedType = selectedCategoryTypes.find(t => t.id.toString() === formData.leave_type_id);
  const isDateRequired = selectedType && selectedType.max_days_per_request > 0;

  // Calcul de durée
  useEffect(() => {
    if (isDateRequired && formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, duration: diff > 0 ? diff : 0 }));
    } else {
      setFormData(prev => ({ ...prev, duration: 0 }));
    }
  }, [formData.start_date, formData.end_date, isDateRequired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation Logic: Start Date >= Tomorrow
    if (isDateRequired && formData.start_date < tomorrowStr) {
        showNotification("La date de début doit être à partir de demain." ,'success');
        return;
    }

    if (!selectedYear) return;
    setSubmitting(true);

    const data = new FormData();
    data.append('leave_type_id', formData.leave_type_id);
    data.append('salary_year_id', selectedYear);
    if (isDateRequired) {
      data.append('start_date', formData.start_date);
      data.append('end_date', formData.end_date);
      data.append('duration', formData.duration);
    } else {
      data.append('duration', 0);
    }
    data.append('comments', formData.comments || '');
    if (formData.attachment) data.append('attachment', formData.attachment);

    try {
      await api.post('/api/leave-requests/store', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification('Demande envoyée avec succès !' ,'success');
      setFormData({ category_id: '', leave_type_id: '', start_date: '', end_date: '', duration: 0, comments: '', attachment: null });
      if (fileInputRef.current) fileInputRef.current.value = ""; 
      fetchData(); 
    } catch (err) {
      showNotification( "Une erreur est survenue lors de l'envoi." ,'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  // Theme integration classes
  const isDark = theme === 'dark';
  const containerBg = isDark ? 'bg-slate-950' : 'bg-slate-50/50';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-white';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen ${containerBg} p-4 md:p-10 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* --- HEADER --- */}
        <header className={`${cardBg} backdrop-blur-md border p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden`}>
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                <LayoutDashboard size={28} />
              </div>
              <div>
                <h1 className={`text-4xl font-black tracking-tight ${textMain}`}>Espace Congés</h1>
                <p className={`${textMuted} font-semibold uppercase text-[11px] mt-1 tracking-widest`}>Gestion des Absences</p>
              </div>
            </div>
            
            <div className={`flex items-center gap-4 ${isDark ? 'bg-slate-800' : 'bg-white'} border border-slate-200 p-2 pl-5 rounded-2xl`}>
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-500" size={18} />
                <span className={`font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Session :</span>
              </div>
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black">
                {displayYear || '...'}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- FORM SECTION --- */}
          <section className="lg:col-span-5">
            <div className={`${cardBg} rounded-[3rem] p-10 shadow-2xl border`}>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                <h2 className={`text-2xl font-black ${textMain}`}>Nouvelle Demande</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Folder size={14} /> Catégorie
                  </label>
                  <select 
                    required
                    className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-bold`}
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value, leave_type_id: '' })}
                  >
                    <option value="">Sélectionnez la catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </div>

                {formData.category_id && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <ListTree size={14} /> Type d'absence
                    </label>
                    <select 
                      required
                      className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl px-5 py-4 focus:border-indigo-500 outline-none transition-all font-bold`}
                      value={formData.leave_type_id}
                      onChange={e => setFormData({...formData, leave_type_id: e.target.value})}
                    >
                      <option value="">Choisissez le type exact</option>
                      {selectedCategoryTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (Max {t.max_days_per_request}j)</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.leave_type_id && (
                  <div className="space-y-8 animate-in fade-in zoom-in-95">
                    {isDateRequired ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Début</label>
                          <input 
                            type="date" 
                            required 
                            min={tomorrowStr}
                            className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 font-bold`}
                            value={formData.start_date} 
                            onChange={e => setFormData({...formData, start_date: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Fin</label>
                          <input 
                            type="date" 
                            required 
                            min={formData.start_date || tomorrowStr}
                            className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 font-bold`}
                            value={formData.end_date} 
                            onChange={e => setFormData({...formData, end_date: e.target.value})} 
                          />
                        </div>
                        <div className="sm:col-span-2 bg-slate-900 rounded-[2rem] p-6 flex justify-between items-center text-white">
                          <span className="font-bold opacity-70">Période calculée</span>
                          <span className="text-3xl font-black">{formData.duration} Jours</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-6 flex items-start gap-4">
                        <Info size={20} className="text-indigo-600 mt-1" />
                        <p className="text-indigo-800 text-sm font-bold">Un justificatif officiel est nécessaire pour ce type de demande.</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Pièce jointe</label>
                      <input type="file" ref={fileInputRef} className="hidden" id="file-upload" onChange={e => setFormData({...formData, attachment: e.target.files[0]})} />
                      <label htmlFor="file-upload" className={`group flex flex-col items-center justify-center gap-3 w-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} border-2 border-dashed rounded-[2rem] py-10 cursor-pointer hover:border-indigo-500 transition-all`}>
                        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><Paperclip size={24} className="text-indigo-500" /></div>
                        <span className={`font-black text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                            {formData.attachment ? formData.attachment.name : "Cliquez pour uploader"}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Commentaires</label>
                      <textarea 
                        className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'} border-2 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 h-32 resize-none font-bold`} 
                        value={formData.comments} 
                        onChange={e => setFormData({...formData, comments: e.target.value})} 
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting || !formData.leave_type_id}
                  className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl shadow-xl transition-all flex justify-center items-center gap-4 disabled:bg-slate-300"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Envoyer la demande</>}
                </button>
              </form>
            </div>
          </section>

          {/* --- HISTORY SECTION --- */}
          <section className="lg:col-span-7 space-y-8">
            <div className={`${cardBg} rounded-[3rem] shadow-sm border overflow-hidden`}>
              <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <h2 className={`text-2xl font-black ${textMain}`}>Historique</h2>
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Clock size={24}/></div>
              </div>

              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="p-32 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                  </div>
                ) : (
                  requests.map(req => (
                    <div 
                      key={req.id} 
                      onClick={() => setDetailModal({ show: true, req })}
                      className={`p-8 hover:bg-indigo-50/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between group cursor-pointer`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 flex items-center justify-center rounded-[1.5rem] font-black text-lg border-2 ${getStatusStyles(req.status)}`}>
                          {req.duration}j
                        </div>
                        <div>
                          <h4 className={`font-black uppercase text-sm tracking-widest ${textMain}`}>{req.leave_type?.name}</h4>
                          <p className="text-xs text-slate-400 font-bold mt-1 uppercase">
                            {req.start_date ? `${req.start_date} → ${req.end_date}` : 'Document'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 flex items-center gap-4">
                         <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 ${getStatusStyles(req.status)}`}>
                            {req.status}
                         </span>
                         <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {detailModal.show && detailModal.req && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    detailModal.req.status === 'APPROVED' ? 'bg-emerald-500' : 
                    detailModal.req.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Suivi de Demande</h2>
                    <p className="text-slate-400 text-sm font-medium">Référence: #REQ-{detailModal.req.id}</p>
                  </div>
                </div>
                <button onClick={() => setDetailModal({ show: false, req: null })} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className={`p-6 rounded-[2rem] border-2 ${
                  detailModal.req.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' : 
                  detailModal.req.status === 'REJECTED' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Réponse des Ressources Humaines</p>
                  <p className="text-sm font-bold text-slate-800 italic">
                    {detailModal.req.hr_note ? `"${detailModal.req.hr_note}"` : "Aucun commentaire de la part du RH."}
                  </p>
                  {detailModal.req.status !== 'PENDING' && (
                     <p className="mt-3 text-[10px] font-bold opacity-50">
                        Traité le: {new Date(detailModal.req.updated_at).toLocaleDateString()}
                     </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type d'absence</p>
                    <p className="font-bold text-slate-800">{detailModal.req.leave_type?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Durée</p>
                    <p className="font-black text-blue-600">{detailModal.req.duration} JOURS</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Votre Commentaire</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {detailModal.req.comments || "Aucun commentaire."}
                  </p>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setDetailModal({ show: false, req: null })}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeLeave;