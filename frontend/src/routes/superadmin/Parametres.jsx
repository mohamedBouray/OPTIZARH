import React, { useState, useEffect } from 'react';
import { 
    Camera, Trash2, ChevronUp, Sun, Moon, Save, Globe, 
    Loader2, Eye, EyeOff, User, ShieldCheck, Settings2, 
    CheckCircle, XCircle, Ban, UserCheck 
} from 'lucide-react';
import md5 from 'crypto-js/md5';
import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Settings() {
    const { t, i18n } = useTranslation(['superadmin/settings', 'common']);
    const { showNotification } = useNotification();
    const { updateTheme } = useTheme();

    // --- STATES ---
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'platform'
    const [loading, setLoading] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);

    // 1. Profile States
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        profile_image: "",
        theme: "light",
        language: "en"
    });

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false, new: false, confirm: false
    });

    // 2. Platform States (Registration & Users)
    const [platformSettings, setPlatformSettings] = useState({
        registration_enabled: true,
        default_role: 'employee'
    });
    const [pendingUsers, setPendingUsers] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [platformLoading, setPlatformLoading] = useState(false);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/Settings/profile');
                setFormData(res.data);
            } catch (err) {
                console.error("Erreur fetching profile:", err);
            }
        };
        fetchData();
    }, []);

    // Fetch Platform Data only when switching to platform tab
    useEffect(() => {
        if (activeTab === 'platform') {
            fetchPlatformData();
        }
    }, [activeTab]);

    const fetchPlatformData = async () => {
        setPlatformLoading(true);
        try {
            // Call wahed l-endpoint li sayebna f Controller
            const res = await api.get('/api/Settings/admin/platform-data');
            
            setPlatformSettings(res.data.settings);
            setActiveUsers(res.data.users);
        } catch (err) {
            console.error("Erreur fetching platform data:", err);
            showNotification("Failed to load platform data", "error");
        } finally {
            setPlatformLoading(false);
        }
    };

    // --- HANDLERS (PROFILE) ---
    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const res = await api.post('/api/Settings/profile', formData);
            const userData = res.data.user || res.data; 
            localStorage.setItem('user', JSON.stringify(userData));
            window.dispatchEvent(new Event('userUpdated'));
            updateTheme(formData.theme);
            i18n.changeLanguage(formData.language);
            showNotification(t('common:success_update'), 'success');
        } catch (err) {
            showNotification(t('common:error_update'), 'error');
        } finally { setLoading(false); }
    };

    const handleUpdatePassword = async () => {
        setLoading(true);
        try {
            await api.post('/api/Settings/password', passwordData);
            showNotification(t('common:success_password'), 'success');
            setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
            setIsPasswordOpen(false);
        } catch (err) {
            showNotification(err.response?.data?.message || t('common:error_password'), 'error');
        } finally { setLoading(false); }
    };

    // --- HANDLERS (PLATFORM) ---
    const handleToggleRegistration = async () => {
        const newVal = !platformSettings.registration_enabled;
        try {
            await api.post('/api/Settings/admin/settings', { ...platformSettings, registration_enabled: newVal });
            setPlatformSettings({ ...platformSettings, registration_enabled: newVal });
            showNotification("Registration status updated", "success");
        } catch (err) { showNotification("Update failed", "error"); }
    };

    const handleToggleBlock = async (id) => {
        try {
            const res = await api.patch(`/api/Settings/admin/users/${id}/toggle-block`);
            setActiveUsers(activeUsers.map(u => u.id === id ? { ...u, is_blocked: res.data.is_blocked } : u));
            showNotification(res.data.is_blocked ? "User blocked" : "User unblocked", "success");
        } catch (err) { showNotification("Operation failed", "error"); }
    };

    // --- HELPERS ---
    const getInitials = (name) => {
        if (!name) return "??";
        const parts = name.split(' ');
        return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleSetGravatar = () => {
        const hash = md5(formData.email.trim().toLowerCase());
        const url = `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
        setFormData({ ...formData, profile_image: url });
    };
    const toggleVisibility = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

    return (
        <div className="p-6 bg-gray-50 dark:bg-zinc-900 min-h-screen font-sans transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                
                {/* --- TAB NAVIGATION --- */}
                <div className="flex gap-2 mb-8 bg-white dark:bg-zinc-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 w-fit">
                    <button onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}>
                        <User size={18} /> {t('superadmin/settings:profile_tab', 'My Profile')}
                    </button>
                    <button onClick={() => setActiveTab('platform')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'platform' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}>
                        <ShieldCheck size={18} /> {t('superadmin/settings:platform_tab', 'Platform Control')}
                    </button>
                </div>

                {/* --- TAB 1: PROFILE --- */}
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-700 p-8 transition-all">
                        {/* Profile Image & Name Section */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-blue-50 dark:bg-zinc-700 border-4 border-white dark:border-zinc-800 shadow-md flex items-center justify-center">
                                    {formData.profile_image ? (
                                        <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-blue-300">{getInitials(formData.full_name)}</span>
                                    )}
                                </div>
                                <label className="absolute bottom-1 right-1 bg-blue-500 p-2 rounded-full border-2 border-white dark:border-zinc-800 text-white cursor-pointer shadow-sm hover:bg-blue-600">
                                    <Camera size={16} />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setFormData({...formData, profile_image: reader.result});
                                        if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
                                    }} />
                                </label>
                            </div>

                            <div className="flex-1 space-y-4 w-full">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('superadmin/settings:profile_image_label')}</label>
                                    <div className="flex gap-3">
                                        <button onClick={() => setFormData({...formData, profile_image: `https://ui-avatars.com/api/?name=${getInitials(formData.full_name)}&background=random&color=fff`})} className="px-4 py-1.5 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200">Initials</button>
                                        <button onClick={handleSetGravatar} className="px-4 py-1.5 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200">{t('superadmin/settings:btn_gravatar')}</button>
                                        <button onClick={() => setFormData({...formData, profile_image: ""})} className="px-4 py-1.5 border border-red-100 text-red-500 rounded-full text-xs font-medium hover:bg-red-50">{t('common:remove')}</button>
                                    </div>
                                </div>
                                <div className="max-w-md">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('superadmin/settings:name_label')}</label>
                                    <input type="text" value={formData.full_name || ''} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:border-blue-400 outline-none dark:text-white" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-zinc-700 mb-8" />

                        {/* Password Accordion */}
                        <div className={`bg-blue-50/30 dark:bg-zinc-700/30 rounded-3xl border border-blue-100/50 dark:border-zinc-600 overflow-hidden mb-8 transition-all ${isPasswordOpen ? 'pb-6' : 'pb-0'}`}>
                            <button onClick={() => setIsPasswordOpen(!isPasswordOpen)} className="w-full px-8 py-5 flex justify-between items-center text-gray-800 dark:text-gray-200 font-bold hover:bg-blue-50/50">
                                <span>{t('superadmin/settings:change_password_title')}</span>
                                <ChevronUp className={`transition-transform ${!isPasswordOpen ? 'rotate-180' : ''}`} size={20} />
                            </button>
                            {isPasswordOpen && (
                                <div className="px-8 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {['current', 'new', 'confirm'].map((f) => (
                                            <div key={f} className="relative">
                                                <input type={showPasswords[f] ? "text" : "password"} 
                                                    placeholder={t(`superadmin/settings:placeholder_${f === 'confirm' ? 'confirm' : f}_pass`)}
                                                    value={passwordData[`${f === 'confirm' ? 'new_password_confirmation' : f + '_password'}`]}
                                                    onChange={(e) => setPasswordData({...passwordData, [`${f === 'confirm' ? 'new_password_confirmation' : f + '_password'}`]: e.target.value})}
                                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-600 rounded-xl outline-none pr-12 dark:text-white" />
                                                <button onClick={() => toggleVisibility(f)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                    {showPasswords[f] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={handleUpdatePassword} disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                                            {loading && <Loader2 className="animate-spin" size={16} />} Update Password
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme & Language */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('superadmin/settings:theme_label')}</label>
                                <select value={formData.theme} onChange={(e) => { updateTheme(e.target.value); setFormData({...formData, theme: e.target.value}); }} className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-2xl outline-none dark:text-white">
                                    <option value="light">light</option><option value="dark">dark</option><option value="system">system</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('superadmin/settings:language_label')}</label>
                                <select value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-2xl outline-none dark:text-white">
                                    <option value="en">english</option><option value="fr">french</option><option value="ar">arabic</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t dark:border-zinc-700">
                            <button onClick={handleUpdateProfile} disabled={loading} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:bg-blue-700 flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {t('common:save_changes')}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: PLATFORM CONTROL --- */}
                {activeTab === 'platform' && (
                    <div className="space-y-6">
                        
                        {/* 1. Global Config Card */}
                        <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-700 p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl"><Settings2 size={24} /></div>
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white">Public Registration</h3>
                                        <p className="text-sm text-gray-500">Control if new users can create accounts</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm font-bold ${platformSettings.registration_enabled ? 'text-green-500' : 'text-red-500'}`}>
                                        {platformSettings.registration_enabled ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                    <button onClick={handleToggleRegistration} 
                                        className={`w-14 h-8 rounded-full relative transition-all ${platformSettings.registration_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${platformSettings.registration_enabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Active Users Management */}
                        <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-700 p-8">
                            <h3 className="font-bold text-lg mb-6 dark:text-white">Active Accounts</h3>
                            <div className="space-y-4">
                                {activeUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-700">
                                        <div className="flex items-center gap-4">
                                            {/* Hna beddel user.name l- user.full_name */}
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                                                {getInitials(user.full_name)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm dark:text-white">{user.full_name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => handleToggleBlock(user.id)} 
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${user.is_blocked ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-red-500 hover:bg-red-50'}`}>
                                            <Ban size={14} /> {user.is_blocked ? 'Unblock' : 'Block'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
