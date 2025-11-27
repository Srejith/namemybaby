'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Check, Plus, Sparkles } from 'lucide-react';
import { UserPreferences } from '@/types';

interface PreferencesProps {
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => Promise<void>;
  onClose?: () => void;
  onRequestCreativeIdeas?: () => void;
  creativeIdeas?: string[];
  isGeneratingIdeas?: boolean;
}

export default function Preferences({ preferences, onSave, onClose, onRequestCreativeIdeas, creativeIdeas = [], isGeneratingIdeas = false }: PreferencesProps) {
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [displayedIdeas, setDisplayedIdeas] = useState<string[]>(creativeIdeas);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local preferences when props change (e.g., when loaded from database)
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content, with minimum height
      const newHeight = Math.max(textarea.scrollHeight, 40); // 40px minimum (approx 2.5rem)
      textarea.style.height = `${newHeight}px`;
    }
  }, [localPreferences.otherPreferences, preferences.otherPreferences]);

  // Update displayed ideas when creativeIdeas prop changes
  useEffect(() => {
    if (creativeIdeas.length > 0) {
      setDisplayedIdeas(creativeIdeas);
    }
  }, [creativeIdeas]);

  const handleAddIdea = (idea: string) => {
    const currentValue = localPreferences.otherPreferences || '';
    const separator = currentValue.trim() ? '\n\n' : '';
    const newValue = currentValue + separator + idea.trim();
    handleChange('otherPreferences', newValue);
    // Remove the idea from displayed list after adding
    setDisplayedIdeas(displayedIdeas.filter((i) => i !== idea));
  };

  const handleChange = (field: keyof UserPreferences, value: string | number) => {
    setLocalPreferences({
      ...localPreferences,
      [field]: value,
    });
    // Clear success message when user makes changes
    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await onSave(localPreferences);
      setSaveSuccess(true);
      // Close the panel after a short delay to show success message
      setTimeout(() => {
        setSaveSuccess(false);
        onClose?.();
      }, 1000);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {/* Chosen Ideas section */}
        <div className="mb-6">
          <label htmlFor="otherPreferences" className="block text-base font-bold text-gray-900 mb-2">
            Idea Preferences
          </label>
          <textarea
            ref={textareaRef}
            id="otherPreferences"
            value={localPreferences.otherPreferences || ''}
            onChange={(e) => handleChange('otherPreferences', e.target.value)}
            placeholder="Tell me how you want to name your little star"
            rows={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none bg-white overflow-hidden min-h-[2.5rem]"
            style={{ height: 'auto' }}
          />
        </div>

        {/* Creative Ideas Section */}
        <div className="mb-6">
          <button
            onClick={onRequestCreativeIdeas}
            disabled={isGeneratingIdeas}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingIdeas ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating ideas...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Help me generate ideas</span>
              </>
            )}
          </button>

          {/* Display extracted ideas */}
          {displayedIdeas.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Creative Ideas</h3>
              <p className="text-xs text-gray-500 mb-3">
                Remember to personalize each suggestion by editing it to fit your unique details.
              </p>
              <ul className="space-y-2">
                {displayedIdeas.map((idea, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm text-gray-700 flex-1">{idea}</span>
                    <button
                      onClick={() => handleAddIdea(idea)}
                      className="ml-3 p-1.5 hover:bg-blue-100 rounded-full text-blue-600 transition-colors flex-shrink-0"
                      aria-label="Add idea to preferences"
                      title="Add this idea to preferences"
                    >
                      <Plus size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tone of the name */}
        <div className="mb-6">
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
            Tone of the name
          </label>
          <input
            type="text"
            id="tone"
            value={localPreferences.tone || ''}
            onChange={(e) => handleChange('tone', e.target.value)}
            placeholder="e.g., Easy to pronounce, Modern, Classic, Traditional, Unique"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>

        {/* Alphabet preferences */}
        <div className="mb-6">
          <label htmlFor="alphabetPreferences" className="block text-sm font-medium text-gray-700 mb-2">
            Alphabet preferences
          </label>
          <input
            type="text"
            id="alphabetPreferences"
            value={localPreferences.alphabetPreferences || ''}
            onChange={(e) => handleChange('alphabetPreferences', e.target.value)}
            placeholder="e.g., Starting with 'A', Ending with 'n', Must not contain 'x'"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
          <p className="mt-1 text-xs text-gray-500">
            Specify starting with, ending with, must not contain, etc.
          </p>
        </div>

      </div>

      <div className="px-4 py-4 border-t border-gray-200 bg-gray-100">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isSaving
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : saveSuccess
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check size={18} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
