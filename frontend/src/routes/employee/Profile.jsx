import React, { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Shield, 
  Bell, Smartphone, Monitor, Download, 
  Edit3, Share2, ArrowLeft, Camera, 
  CheckCircle, Lock, ChevronUp, Palette,
  Languages, Save, Loader2
} from 'lucide-react';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const darkMode = false; // logic toggle dark mode dyalk

  // Classes m9adin kif l-mitall li 3titini
  const cardClass = darkMode ? 'bg-[#1A1A1A]' : 'bg-white';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-100';
  const textClass = darkMode ? 'text-white' : 'text-slate-800';
  const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-slate-700';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0F0F0F]' : 'bg-gray-50/50'} font-sans pb-20`}>
      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="flex items-center gap-5 mb-8">
          <button className={`p-2.5 rounded-xl ${cardClass} border ${borderClass} shadow-sm transition-all hover:scale-105 active:scale-95`}>
            <ArrowLeft size={20} className={textClass} />
          </button>
          <div>
            <h1 className={`text-3xl font-extrabold bg-gradient-to-r ${darkMode ? 'from-white to-gray-400' : 'from-slate-900 to-slate-600'} bg-clip-text text-transparent`}>
              Paramètres
            </h1>
            <p className={`text-sm ${textMutedClass} mt-1`}>Gérez votre profil et les paramètres de la plateforme</p>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className={`flex gap-2 mb-8 p-1.5 rounded-2xl ${cardClass} border ${borderClass} w-fit shadow-sm`}>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md scale-105' 
                : `${textMutedClass} hover:bg-gray-100 dark:hover:bg-[#252525]`
            }`}
          >
            <User size={16} /> Mon Profil
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'security' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md scale-105' 
                : `${textMutedClass} hover:bg-gray-100 dark:hover:bg-[#252525]`
            }`}
          >
            <Shield size={16} /> Sécurité
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Avatar & Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className={`${cardClass} rounded-3xl border ${borderClass} shadow-xl shadow-indigo-500/5 overflow-hidden`}>
                <div className={`p-8 border-b ${borderClass} bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent`}>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                      <div className={`w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl transition-transform duration-500 group-hover:rotate-3`}>
                        <img 
                          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200" 
                          className="w-full h-full object-cover"
                          alt="Profile"
                        />
                      </div>
                      <label className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-indigo-600 text-white cursor-pointer shadow-xl hover:bg-indigo-700 transition-all hover:scale-110">
                        <Camera size={18} />
                        <input type="file" className="hidden" />
                      </label>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h2 className={`text-2xl font-bold ${textClass}`}>Alexander Sterling</h2>
                        <CheckCircle size={20} className="text-blue-500" />
                      </div>
                      <p className={textMutedClass}>Senior Product Strategy Lead</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all">Change Photo</button>
                        <button className={`px-4 py-2 rounded-xl text-xs font-bold border ${borderClass} ${textClass} hover:bg-gray-50 transition-all`}>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Personal Info Grid */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                      <h3 className={`text-lg font-bold ${textClass}`}>Informations Personnelles</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={`text-xs font-bold ${textMutedClass} uppercase tracking-wider`}>Nom Complet</label>
                        <input type="text" defaultValue="Alexander J. Sterling" className={`w-full px-4 py-3 rounded-2xl border ${borderClass} ${inputClass} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`} />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-bold ${textMutedClass} uppercase tracking-wider`}>Email Professionnel</label>
                        <input type="email" defaultValue="a.sterling@corporate.com" className={`w-full px-4 py-3 rounded-2xl border ${borderClass} ${inputClass} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`} />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-bold ${textMutedClass} uppercase tracking-wider`}>Téléphone</label>
                        <input type="text" defaultValue="+1 (555) 012-3456" className={`w-full px-4 py-3 rounded-2xl border ${borderClass} ${inputClass} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`} />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-bold ${textMutedClass} uppercase tracking-wider`}>Localisation</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" defaultValue="New York, HQ" className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${borderClass} ${inputClass} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95">
                      <Save size={18} /> Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;