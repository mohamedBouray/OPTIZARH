import React, { useState, useEffect } from 'react';
import api from "../../lib/apis/axiosConfig";
import { icons } from '../../lib/icons/icons';
import { Trash2, Clock, Search, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import DeleteConfirmModal from '../../lib/components/DeleteConfirmModal';

export default function Logs() {
    const { showNotification } = useNotification();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState(10);
    const [darkMode, setDarkMode] = useState(false);

    // State dial Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        onConfirm: () => {},
        title: "",
        message: ""
    });

    const fetchActivities = async (newLimit = 10) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/activity-logs?limit=${newLimit}`);
            setActivities(response.data.data || []);
            setLimit(newLimit);
        } catch (error) {
            console.error("Erreur fetch logs:", error);
            showNotification("Erreur lors du chargement des logs", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(10);
        // Detect dark mode
        setDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    const closeConfirm = () => setConfirmConfig({ ...confirmConfig, isOpen: false });

    const openDeleteModal = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: "Supprimer l'activité",
            message: "Êtes-vous sûr de vouloir supprimer définitivement ce log ? Cette action est irréversible.",
            onConfirm: () => handleDelete(id)
        });
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/activity-logs/${id}`);
            setActivities(prev => prev.filter(log => log.id !== id));
            showNotification("Log supprimé avec succès", "success");
        } catch (error) {
            console.error("Erreur suppression:", error);
            showNotification("Échec de la suppression", "error");
        } finally {
            closeConfirm();
        }
    };

    const filteredLogs = activities.filter(log => {
        const search = searchTerm.toLowerCase();
        const userName = log.user?.full_name?.toLowerCase() || "système";
        const titre = log.titre?.toLowerCase() || "";
        const type = log.action_type?.toLowerCase() || "";
        return userName.includes(search) || titre.includes(search) || type.includes(search);
    });

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans dark:bg-black transition-colors duration-300">
            
            {/* Header Section */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight dark:text-white">Journal d'activités</h1>
                    <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">
                        Traçabilité complète des actions effectuées sur <span className="font-bold text-indigo-600 dark:text-indigo-400">OptizaRH</span>
                    </p>
                </div>

                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Rechercher par utilisateur..."
                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-80 shadow-sm transition-all dark:bg-[#111] dark:border-white/10 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400"><Search size={18} /></span>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden dark:bg-[#0D0D0D] dark:border-white/5 transition-all">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-indigo-600 p-2 bg-indigo-50 rounded-lg dark:bg-indigo-500/10 dark:text-indigo-400"><Clock size={20} /></span>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">Historique Système</h2>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full dark:bg-white/5">
                        {filteredLogs.length} Actions
                    </span>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Chargement...</span>
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <div className="space-y-10 relative before:absolute before:inset-0 before:left-[23px] before:w-[2px] before:bg-gray-50 dark:before:bg-white/[0.03] before:h-full">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="relative flex items-start justify-between group pl-12">
                                    
                                    <div className="absolute left-0 top-1.5 w-[48px] h-[48px] rounded-2xl border-4 border-white dark:border-black shadow-sm bg-indigo-50 flex items-center justify-center z-10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 dark:bg-[#1A1A1A] dark:text-indigo-400">
                                        <span className="text-[10px] font-black uppercase italic">
                                            {log.action_type?.substring(0, 3) || 'LOG'}
                                        </span>
                                    </div>

                                    <div className="flex-1 ml-4">
                                        <h3 className="font-black text-slate-800 text-[15px] dark:text-gray-100">{log.titre}</h3>
                                        <p className="text-sm text-gray-400 mt-1.5 leading-relaxed max-w-3xl dark:text-gray-500">
                                            {log.description}
                                        </p>
                                    </div>

                                    <div className="text-right flex flex-col items-end min-w-[180px] gap-3">
                                        <button 
                                            onClick={() => openDeleteModal(log.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg inline-block dark:bg-violet-600/20 dark:border dark:border-violet-500/30">
                                            <p className="text-[11px] font-black uppercase tracking-tight">
                                                {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        
                                        <p className="text-[10px] font-black flex items-center gap-1 uppercase">
                                            <span className="text-indigo-600 dark:text-violet-500">PAR:</span> 
                                            <span className="text-slate-500 dark:text-gray-400">{log.user?.full_name || 'SYSTÈME'}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl dark:border-white/5 text-gray-400">
                            Aucun log trouvé
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-50 text-center dark:bg-white/[0.01] dark:border-white/5">
                    {limit === 10 && activities.length >= 10 ? (
                        <button onClick={() => fetchActivities(100)} className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Voir tout</button>
                    ) : limit > 10 ? (
                        <button onClick={() => fetchActivities(10)} className="text-gray-400 font-black text-xs uppercase tracking-widest hover:underline">Réduire</button>
                    ) : null}
                </div>
            </div>

            {/* Modal de Confirmation */}
            <DeleteConfirmModal 
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                darkMode={darkMode}
            />
        </div>
    );
}