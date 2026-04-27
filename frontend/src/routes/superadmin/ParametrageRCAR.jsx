import React, { useState, useEffect } from 'react';
import { 
    Download, Loader2, ChevronDown, Landmark, FileText 
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ConsultationRCAR = () => {
    const [configData, setConfigData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState('');
    const [currentConfig, setCurrentConfig] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/rcar');
            const data = response.data;
            setConfigData(data);
            
            if (data && data.length > 0) {
                // Kan-akhedo l'année li 3liha l-khedma (masalan 2026)
                const latest = data.find(c => c.annee === 2026) || data[0];
                setSelectedYear(latest.annee);
                setCurrentConfig(latest);
            }
        } catch (err) {
            console.error("Erreur de chargement", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const exportToPDF = () => {
        if (!currentConfig) return;
        const doc = new jsPDF();
        doc.text(`Récapitulatif RCAR - ${selectedYear}`, 14, 15);
        autoTable(doc, {
            startY: 25,
            head: [['Désignation', 'Plafond (DH)', 'Taux (%)']],
            body: [
                ['RC (Patronal)', currentConfig.patronale_rc_plafond || '0', `${currentConfig.patronale_rc_taux}%`],
                ['RG (Patronal)', currentConfig.patronale_rg_plafond || '0', `${currentConfig.patronale_rg_taux}%`],
                ['RC (Salarial)', currentConfig.salariale_rc_plafond || '0', `${currentConfig.salariale_rc_taux}%`],
                ['RG (Salarial)', currentConfig.salariale_rg_plafond || '0', `${currentConfig.salariale_rg_taux}%`],
            ],
        });
        doc.save(`RCAR_${selectedYear}.pdf`);
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="p-6 space-y-6">
            {/* Header: Année et Export */}
            <div className="flex items-center justify-between bg-white dark:bg-[#121212] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-[#262626]">
                <div className="flex items-center gap-4">
                    <div className="bg-gray-50 dark:bg-[#1c1c1c] px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262626] flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Année</span>
                        <span className="font-black text-slate-800 dark:text-white">{selectedYear}</span>
                    </div>
                </div>

                <button 
                    onClick={exportToPDF}
                    className="bg-[#FF1F4B] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                    <Download size={16}/> Exporter PDF
                </button>
            </div>

            {/* Section Patronal (Visual Only) */}
            <div className="bg-white dark:bg-[#121212] rounded-[2rem] border border-gray-100 dark:border-[#262626] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-[#262626] flex items-center gap-3">
                    <div className="bg-[#1e3a8a]/10 p-2 rounded-lg text-[#1e3a8a]"><FileText size={20}/></div>
                    <h2 className="font-black text-[#1e3a8a] dark:text-blue-400 uppercase tracking-wider">Patronal</h2>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-4">
                        <div>Désignation</div>
                        <div className="text-center">Plafond (DH)</div>
                        <div className="text-right">Taux (%)</div>
                    </div>

                    <div className="space-y-4">
                        <DisplayRow label="RC" plafond={currentConfig?.patronale_rc_plafond} taux={currentConfig?.patronale_rc_taux} color="text-indigo-600" />
                        <DisplayRow label="RG" plafond={currentConfig?.patronale_rg_plafond} taux={currentConfig?.patronale_rg_taux} color="text-indigo-600" />
                    </div>
                </div>
            </div>

            {/* Section Salarial (Visual Only) */}
            <div className="bg-white dark:bg-[#121212] rounded-[2rem] border border-gray-100 dark:border-[#262626] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-[#262626] flex items-center gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg text-emerald-600"><Landmark size={20}/></div>
                    <h2 className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Salarial</h2>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-4">
                        <div>Désignation</div>
                        <div className="text-center">Plafond (DH)</div>
                        <div className="text-right">Taux (%)</div>
                    </div>

                    <div className="space-y-4">
                        <DisplayRow label="RC" plafond={currentConfig?.salariale_rc_plafond} taux={currentConfig?.salariale_rc_taux} color="text-emerald-600" />
                        <DisplayRow label="RG" plafond={currentConfig?.salariale_rg_plafond} taux={currentConfig?.salariale_rg_taux} color="text-emerald-600" />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Component pour afficher chaque ligne proprement sans inputs */
const DisplayRow = ({ label, plafond, taux, color }) => (
    <div className="grid grid-cols-3 items-center bg-gray-50/50 dark:bg-[#1c1c1c]/50 p-4 rounded-2xl border border-gray-100 dark:border-[#262626]">
        <div className="font-bold text-slate-700 dark:text-gray-300">{label}</div>
        <div className="text-center font-black text-slate-800 dark:text-white">
            {plafond ? plafond.toLocaleString() : '0'}
        </div>
        <div className="flex items-center justify-end gap-2">
            <span className={`font-black ${color}`}>{taux || 0}</span>
            <span className="text-[10px] font-bold text-gray-400">%</span>
        </div>
    </div>
);

export default ConsultationRCAR;