import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Smartphone, Globe } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl text-white shadow-lg shadow-teal-200">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <p className="text-sm text-gray-500">Manage your application preferences</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Preferences Card */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" /> Language & Region
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Default Language</label>
                <select className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 text-sm">
                  <option>English (English)</option>
                  <option>Hindi (हिंदी)</option>
                  <option>Gujarati (ગુજરાતી)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Primary Region</label>
                <input type="text" className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 text-sm" defaultValue="Surat" />
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600" /> Notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition">Push Alerts</div>
                  <div className="text-xs text-gray-500">Receive critical health alerts</div>
                </div>
                <div className="relative w-10 h-5 bg-teal-500 rounded-full">
                  <div className="absolute right-1 top-1 bg-white w-3 h-3 rounded-full"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition">SMS Fallback</div>
                  <div className="text-xs text-gray-500">Use USSD/SMS when offline</div>
                </div>
                <div className="relative w-10 h-5 bg-gray-300 rounded-full">
                  <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Accessibility Card */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-teal-600" /> Accessibility
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition">High Contrast</div>
                  <div className="text-xs text-gray-500">Improve readability</div>
                </div>
                <div className="relative w-10 h-5 bg-gray-300 rounded-full">
                  <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition">Voice Auto-Play</div>
                  <div className="text-xs text-gray-500">Read responses automatically</div>
                </div>
                <div className="relative w-10 h-5 bg-teal-500 rounded-full">
                  <div className="absolute right-1 top-1 bg-white w-3 h-3 rounded-full"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Privacy Card */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" /> Privacy & Security
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition">ABHA Integration</div>
                  <div className="text-xs text-gray-500">Allow linking to health records</div>
                </div>
                <div className="relative w-10 h-5 bg-teal-500 rounded-full">
                  <div className="absolute right-1 top-1 bg-white w-3 h-3 rounded-full"></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition">Local Cache (Offline)</div>
                  <div className="text-xs text-gray-500">Store emergency info locally</div>
                </div>
                <div className="relative w-10 h-5 bg-teal-500 rounded-full">
                  <div className="absolute right-1 top-1 bg-white w-3 h-3 rounded-full"></div>
                </div>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
