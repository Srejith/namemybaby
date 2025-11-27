'use client';

import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { UserPreferences } from '@/types';
import { COUNTRIES, RELIGIONS } from '@/data/constants';
import SearchableSelect from './SearchableSelect';

interface StandardPreferencesProps {
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => Promise<void>;
}

export default function StandardPreferences({ preferences, onSave }: StandardPreferencesProps) {
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local preferences when props change (e.g., when loaded from database)
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

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
      // Clear success message after a few seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-gray-100">
      <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
        <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-6">
          {/* User Name */}
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              value={localPreferences.userName || ''}
              onChange={(e) => handleChange('userName', e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {/* Partner Name */}
          <div>
            <label htmlFor="partnerName" className="block text-sm font-medium text-gray-700 mb-2">
              Partner's Name
            </label>
            <input
              id="partnerName"
              type="text"
              value={localPreferences.partnerName || ''}
              onChange={(e) => handleChange('partnerName', e.target.value)}
              placeholder="Enter your partner's name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {/* Baby Gender */}
          <div>
            <label htmlFor="babyGender" className="block text-sm font-medium text-gray-700 mb-2">
              Baby's Gender
            </label>
            <select
              id="babyGender"
              value={localPreferences.babyGender || ''}
              onChange={(e) => handleChange('babyGender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select baby's gender</option>
              <option value="Boy">Boy</option>
              <option value="Girl">Girl</option>
              <option value="I don't know yet">I don't know yet</option>
            </select>
          </div>

          {/* Birth Country */}
          <SearchableSelect
            id="birthCountry"
            label="Birth country of the baby"
            value={localPreferences.birthCountry || ''}
            onChange={(value) => handleChange('birthCountry', value)}
            options={COUNTRIES}
            placeholder="Select a country"
          />

          {/* Living Country */}
          <SearchableSelect
            id="livingCountry"
            label="Country of residence"
            value={localPreferences.livingCountry || ''}
            onChange={(value) => handleChange('livingCountry', value)}
            options={COUNTRIES}
            placeholder="Select a country"
          />

          {/* Religion */}
          <div>
            <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-2">
              Religion
            </label>
            <select
              id="religion"
              value={localPreferences.religion}
              onChange={(e) => handleChange('religion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select a religion</option>
              {RELIGIONS.map((religion) => (
                <option key={religion} value={religion}>
                  {religion}
                </option>
              ))}
            </select>
          </div>

          {/* Number of names to generate per result */}
          <div>
            <label htmlFor="numberOfNamesToGenerate" className="block text-sm font-medium text-gray-700 mb-2">
              Number of names to generate per result
            </label>
            <input
              type="number"
              id="numberOfNamesToGenerate"
              min="1"
              max="10"
              value={localPreferences.numberOfNamesToGenerate || 5}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                const clampedValue = Math.min(Math.max(value, 1), 10);
                handleChange('numberOfNamesToGenerate', clampedValue);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum of 10 names can be generated per result
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

