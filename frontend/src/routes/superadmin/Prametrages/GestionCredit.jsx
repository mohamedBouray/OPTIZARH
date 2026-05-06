import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit2, X, Loader2, 
    Tag, Search, CheckCircle, ChevronDown,
    CreditCard, Save, ArrowLeft
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';

const GestionCredit = () => {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    
    // États
    const [types, setTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Édition
    const [editingType, setEditingType] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: '' });
    
    // Nouveau Type
    const [showNewTypeForm, setShowNewTypeForm] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeCode, setNewTypeCode] = useState('');
    const [selectedCategoriesForType, setSelectedCategoriesForType] = useState([]);
    
    // Classes CSS
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = `w-full px-3 py-2 rounded-lg border ${borderClass} ${darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
    
    const btnPrimary = "px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer";
    const btnSuccess = "px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer";
    const btnOutline = `px-4 py-2 rounded-lg border ${borderClass} ${textClass} hover:bg-gray-100 dark:hover:bg-[#252525] transition-all flex items-center gap-2 cursor-pointer`;
    const btnDanger = "px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center gap-2 cursor-pointer";
    
    // Récupération des données
    const fetchData = async () => {
        setLoading(true);
        try {
            const [typesRes, categoriesRes] = await Promise.all([
                api.get('/api/credit-types'),
                api.get('/api/credit-categories')
            ]);
            setTypes(typesRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            showNotification("❌ Erreur chargement", "error");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => { 
        fetchData(); 
    }, []);
    
    // Types CRUD
    const addType = async () => {
        if (!newTypeName.trim()) return showNotification("❌ Nom requis", "error");
        try {
            const res = await api.post('/api/credit-types', {
                name: newTypeName,
                code: newTypeCode.toUpperCase() || newTypeName.toUpperCase().replace(/\s/g, '_'),
                category_ids: selectedCategoriesForType
            });
            setTypes([...types, res.data]);
            setNewTypeName('');
            setNewTypeCode('');
            setSelectedCategoriesForType([]);
            setShowNewTypeForm(false);
            showNotification("✅ Type ajouté", "success");
            fetchData();
        } catch (error) { 
            showNotification("❌ Erreur", "error"); 
        }
    };
    
    const updateType = async (id, name) => {
        try {
            const res = await api.put(`/api/credit-types/${id}`, { name });
            setTypes(types.map(t => t.id === id ? res.data : t));
            setEditingType(null);
            showNotification("✅ Type modifié", "success");
        } catch (error) { 
            showNotification("❌ Erreur", "error"); 
        }
    };
    
    const deleteType = (id, name) => {
        setDeleteModal({ isOpen: true, type: 'type', id, name });
    };
    
    const confirmDelete = async () => {
        try {
            await api.delete(`/api/credit-types/${deleteModal.id}`);
            setTypes(types.filter(t => t.id !== deleteModal.id));
            showNotification("✅ Type supprimé", "success");
        } catch (error) { 
            showNotification("❌ Erreur", "error"); 
        }
        setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
    };
    
    // Filtrage
    const filteredTypes = types.filter(t => 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }
    
    return (
        <div className={`min-h-screen ${bgClass}`}>
            <div className="max-w-7xl mx-auto ">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => window.history.back()}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'} hover:scale-105`}
                            title="Retour"
                        >
                            <ArrowLeft size={20} className={textClass} />
                        </button>
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                            <Tag size={22} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className={`text-xl md:text-2xl font-bold ${textClass}`}>Types de Crédit</h1>
                            <p className={`text-sm ${textMuted} mt-0.5`}>
                                Gérez les types de crédit pour les employés
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowNewTypeForm(true)} className={btnPrimary}>
                        <Plus size={16} /> Nouveau type
                    </button>
                </div>

                {/* Formulaire d'ajout */}
                {showNewTypeForm && (
                    <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden mb-6 animate-fadeIn`}>
                        <div className={`p-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                            <h2 className={`font-semibold ${textClass}`}>Ajouter un type de crédit</h2>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-xs font-medium ${textMuted} mb-1 block`}>Nom *</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Crédit Standard" 
                                        value={newTypeName} 
                                        onChange={e => setNewTypeName(e.target.value)} 
                                        className={inputClass} 
                                    />
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMuted} mb-1 block`}>Code *</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: STD" 
                                        value={newTypeCode} 
                                        onChange={e => setNewTypeCode(e.target.value.toUpperCase())} 
                                        className={inputClass} 
                                    />
                                </div>
                                
                                <div className="md:col-span-2 flex gap-3">
                                    <button onClick={addType} className={btnSuccess}>
                                        <CheckCircle size={16} /> Enregistrer
                                    </button>
                                    <button onClick={() => { 
                                        setShowNewTypeForm(false); 
                                        setNewTypeName(''); 
                                        setNewTypeCode(''); 
                                        setSelectedCategoriesForType([]); 
                                    }} className={btnOutline}>
                                        <X size={16} /> Annuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Liste des types */}
                <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
                    <div className={`p-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                        <h2 className={`font-semibold ${textClass}`}>Liste des types de crédit</h2>
                        <p className={`text-xs ${textMuted} mt-0.5`}>
                            {filteredTypes.length} type(s) de crédit disponible(s)
                        </p>
                    </div>
                    
                    <div className="divide-y dark:divide-[#2A2A2A]">
                        {filteredTypes.length === 0 ? (
                            <div className="p-8 text-center">
                                <Tag size={48} className={`mx-auto mb-3 opacity-30 ${textMuted}`} />
                                <p className={textMuted}>Aucun type trouvé</p>
                                <button onClick={() => setShowNewTypeForm(true)} className={`mt-3 text-sm text-indigo-600 hover:text-indigo-700 ${textClass}`}>
                                    + Ajouter un type
                                </button>
                            </div>
                        ) : (
                            filteredTypes.map((type) => (
                                <div key={type.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#252525]/30 transition-colors">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        {editingType === type.id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    defaultValue={type.name}
                                                    className="flex-1 px-3 py-1 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500"
                                                    onBlur={(e) => updateType(type.id, e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => setEditingType(null)} className="p-1 text-gray-400 cursor-pointer">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-medium ${textClass}`}>{type.name}</p>
                                                        <code className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                                            {type.code}
                                                        </code>
                                                        {type.is_active === false && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                                                Inactif
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {type.categories?.map(cat => (
                                                            <span key={cat.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                                                {cat.name}
                                                            </span>
                                                        ))}
                                                        {(!type.categories || type.categories.length === 0) && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-[#252525] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                                                Aucune catégorie
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => setEditingType(type.id)} 
                                                        className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg cursor-pointer" 
                                                        title="Modifier"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteType(type.id, type.name)} 
                                                        className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg cursor-pointer" 
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modale de confirmation */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '' })}
                onConfirm={confirmDelete}
                title="Confirmation de suppression"
                message={`Êtes-vous sûr de vouloir supprimer le type "${deleteModal.name}" ?`}
                darkMode={darkMode}
            />
        </div>
    );
};

export default GestionCredit;