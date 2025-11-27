'use client';

import { X, Lightbulb } from 'lucide-react';
import Preferences from './Preferences';
import { UserPreferences } from '@/types';

interface PreferencesPanelProps {
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => Promise<void>;
  onClose: () => void;
  onRequestCreativeIdeas?: () => void;
  creativeIdeas?: string[];
  isGeneratingIdeas?: boolean;
}

export default function PreferencesPanel({ 
  preferences, 
  onSave, 
  onClose, 
  onRequestCreativeIdeas, 
  creativeIdeas,
  isGeneratingIdeas = false
}: PreferencesPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-gray-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Idea Hub</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Close panel"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Preferences
          preferences={preferences}
          onSave={onSave}
          onClose={onClose}
          onRequestCreativeIdeas={onRequestCreativeIdeas}
          creativeIdeas={creativeIdeas}
          isGeneratingIdeas={isGeneratingIdeas}
        />
      </div>
    </div>
  );
}
