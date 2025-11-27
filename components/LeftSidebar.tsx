'use client';

import { FileText, LogOut, Home, Volume2, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LeftSidebarProps {
  activeTab: 'home' | 'reports' | 'voiceAnalysis' | 'preferences';
  onTabChange: (tab: 'home' | 'reports' | 'voiceAnalysis' | 'preferences') => void;
  expanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function LeftSidebar({ 
  activeTab,
  onTabChange,
  expanded,
  onExpandedChange
}: LeftSidebarProps) {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  if (!expanded) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white transition-all duration-300 flex-shrink-0 h-full w-64">
      {/* Menu Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-700">
        <h2 className="font-semibold text-lg">Menu</h2>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col p-2 gap-2">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'home'
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-800 text-gray-300'
          }`}
          title="Home"
        >
          <Home size={20} className="flex-shrink-0" />
          <span className="font-medium">Home</span>
        </button>

        {/* Reports */}
        <button
          onClick={() => onTabChange('reports')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'reports'
              ? 'bg-purple-700 text-white'
              : 'hover:bg-gray-800 text-gray-300'
          }`}
          title="Reports"
        >
          <FileText size={20} className="flex-shrink-0" />
          <span className="font-medium">Reports</span>
        </button>

        {/* Preferences */}
        <button
          onClick={() => onTabChange('preferences')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'preferences'
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-800 text-gray-300'
          }`}
          title="Preferences"
        >
          <Settings size={20} className="flex-shrink-0" />
          <span className="font-medium">Preferences</span>
        </button>

        {/* Voice Analysis */}
        <button
          onClick={() => onTabChange('voiceAnalysis')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'voiceAnalysis'
              ? 'bg-blue-700 text-white'
              : 'hover:bg-gray-800 text-gray-300'
          }`}
          title="Voice Analysis"
        >
          <Volume2 size={20} className="flex-shrink-0" />
          <span className="font-medium">Voice Analysis</span>
        </button>

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-red-900 text-gray-300 hover:text-white"
          title="Sign Out"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

