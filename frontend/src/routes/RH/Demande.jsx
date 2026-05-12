import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { 
  CheckCheck, X, Search, Filter, Calendar, 
  User, FileText, ExternalLink, MessageSquare, 
  Loader2, AlertCircle, Clock, Eye, FileDown,
  Info, Hash, Briefcase, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HRLeaveManagement = () => {
  const IMAGE_BASE_URL = "http://localhost:8000/storage/"; // Hna khass tkon l-base
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [processingId, setProcessingId] = useState(null);
  const [noteModal, setNoteModal] = useState({ show: false, req: null, action: '' });
  const [detailModal, setDetailModal] = useState({ show: false, req: null });
  const [hrNote, setHrNote] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/leaves/all');
      setRequests(res.data);
    } catch (err) {
      console.error("Mouchkil f jaban les demandes");
    } finally {
      setLoading(false);
    }
  };

  const processRequest = async () => {
    const { req, action } = noteModal;
    setProcessingId(req.id);
    try {
      await api.post(`/api/hr/leaves/update-status/${req.id}`, {
        status: action,
        hr_note: hrNote,
        salary_year_id: req.salary_year_id 
      });
      setNoteModal({ show: false, req: null, action: '' });
      setDetailModal({ show: false, req: null });
      setHrNote('');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la mise à jour");
    } finally {
      setProcessingId(null);
    }
  };

  // --- FONCTION PDF ---
  const generatePDF = (req) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("OPTIZARH - DEMANDE DE CONGÉ", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Réf: REQ-${req.id} | Date: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

    // Employee Info Table
    autoTable(doc, {
      startY: 40,
      head: [['Information de l\'Employé', 'Détails']],
      body: [
        ['Nom Complet', `${req.employee?.nom} ${req.employee?.prenom}`],
        ['Matricule', req.employee?.matricule || 'N/A'],
        ['Poste / Département', req.employee?.poste || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Leave Details Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Détails de la Demande', 'Valeur']],
      body: [
        ['Catégorie', req.leave_type?.category?.category_name || 'N/A'],
        ['Type d\'absence', req.leave_type?.name],
        ['Période', req.start_date ? `Du ${req.start_date} au ${req.end_date}` : 'Document Seul'],
        ['Durée totale', `${req.duration} Jours`],
        ['Statut Actuel', req.status],
        ['Commentaires Employé', req.comments || 'Aucun'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });

    // Signatures
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.text("Signature Employé", 40, finalY);
    doc.text("Cachet & Signature RH", 140, finalY);

    doc.save(`Demande_${req.employee?.nom}_${req.id}.pdf`);
  };

  const filteredRequests = filter === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Gestion des Congés</h1>
            <p className="text-slate-500 font-medium">Portail de validation OPTIZARH</p>
          </div>

          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'PENDING' ? 'En Attente' : tab === 'APPROVED' ? 'Approuvés' : tab === 'REJECTED' ? 'Refusés' : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Employé</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Absence</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Durée</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Justificatif</th>
                <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold">Aucune demande trouvée.</td></tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {req.employee?.nom?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{req.employee?.nom} {req.employee?.prenom}</p>
                          <p className="text-xs text-slate-400 font-medium">MAT: {req.employee?.id || '---'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{req.leave_type?.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">{req.leave_type?.category?.category_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-black">
                        {req.duration}j
                      </span>
                    </td>
                    <td className="p-6">
                      {req.attachment_path ? (
                        <a href={`${IMAGE_BASE_URL}${req.attachment_path}`} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1 text-xs font-bold">
                          <ExternalLink size={14} /> Voir
                        </a>
                      ) : <span className="text-slate-300 text-xs">Aucun</span>}
                    </td>
                    <td className="p-6">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setDetailModal({ show: true, req })}
                          className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        {req.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => setNoteModal({ show: true, req, action: 'APPROVED' })}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              <CheckCheck size={18} />
                            </button>
                            <button 
                              onClick={() => setNoteModal({ show: true, req, action: 'REJECTED' })}
                              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DÉTAILS --- */}
      {detailModal.show && detailModal.req && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black">{detailModal.req.employee?.nom} {detailModal.req.employee?.prenom}</h2>
                  <p className="text-blue-300 text-sm font-medium">Détails complets de la demande</p>
                </div>
              </div>
              <button onClick={() => setDetailModal({ show: false, req: null })} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Info size={20}/></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Catégorie & Type</p>
                    <p className="font-bold text-slate-800">{detailModal.req.leave_type?.category?.category_name}</p>
                    <p className="text-sm text-slate-600 font-medium">{detailModal.req.leave_type?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Calendar size={20}/></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Période d'absence</p>
                    <p className="font-bold text-slate-800">
                      {detailModal.req.start_date ? `Du ${detailModal.req.start_date} au ${detailModal.req.end_date}` : 'Justificatif seul'}
                    </p>
                    <p className="text-sm text-blue-600 font-black tracking-wide">{detailModal.req.duration} JOURS TOTAL</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><MessageSquare size={20}/></div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Commentaire Employé</p>
                    <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 font-medium italic">
                      "{detailModal.req.comments || 'Aucun commentaire fourni.'}"
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><FileText size={20}/></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Justificatif</p>
                    {detailModal.req.attachment_path ? (
                      <a href={`${IMAGE_BASE_URL}${detailModal.req.attachment_path}`} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all mt-1">
                        <ExternalLink size={14} /> Ouvrir le document
                      </a>
                    ) : <p className="text-sm text-slate-400 font-bold">Aucun fichier joint</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex flex-wrap gap-3 border-t border-slate-100">
              <button 
                onClick={() => generatePDF(detailModal.req)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg shadow-slate-200"
              >
                <FileDown size={18} /> Télécharger PDF
              </button>
              
              {detailModal.req.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => setNoteModal({ show: true, req: detailModal.req, action: 'APPROVED' })}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    <CheckCheck size={18} /> Approuver
                  </button>
                  <button 
                    onClick={() => setNoteModal({ show: true, req: detailModal.req, action: 'REJECTED' })}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                  >
                    <X size={18} /> Refuser
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NOTE RH (DÉJÀ 3ENDEK) --- */}
      {noteModal.show && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           {/* ... L-code dyal noteModal li 3endek mashi mbeddel ... */}
           <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-800 mb-6">Ajouter une Note RH</h3>
              <textarea 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 outline-none h-32 resize-none mb-4"
                placeholder="Note pour l'employé..."
                value={hrNote}
                onChange={(e) => setHrNote(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setNoteModal({ show: false, req: null, action: '' })} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-2xl">Annuler</button>
                <button onClick={processRequest} className={`flex-1 py-4 font-black text-white rounded-2xl ${noteModal.action === 'APPROVED' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Confirmer</button>
              </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default HRLeaveManagement;