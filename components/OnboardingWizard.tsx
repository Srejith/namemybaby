'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, User, Globe, Lightbulb, Edit3, Check, Plus } from 'lucide-react';
import { UserPreferences, BabyGender } from '@/types';
import { COUNTRIES, RELIGIONS } from '@/data/constants';
import SearchableSelect from './SearchableSelect';

interface OnboardingWizardProps {
  initialPreferences: UserPreferences;
  onComplete: (preferences: UserPreferences, shouldGenerateNames: boolean) => Promise<void>;
  onRequestCreativeIdeas?: () => Promise<string[]>;
}

type Step = 1 | 2 | 3 | 4;

export default function OnboardingWizard({ 
  initialPreferences, 
  onComplete,
  onRequestCreativeIdeas 
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...initialPreferences,
    userName: initialPreferences.userName || '',
    partnerName: initialPreferences.partnerName || '',
  });
  const [creativeIdeas, setCreativeIdeas] = useState<string[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea for idea preferences
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(textarea.scrollHeight, 40);
      textarea.style.height = `${newHeight}px`;
    }
  }, [preferences.otherPreferences]);

  const updatePreference = (field: keyof UserPreferences, value: string | number) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleRequestCreativeIdeas = async () => {
    if (!onRequestCreativeIdeas) return;
    
    setIsGeneratingIdeas(true);
    try {
      const ideas = await onRequestCreativeIdeas();
      setCreativeIdeas(ideas);
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleAddIdea = (idea: string) => {
    const currentValue = preferences.otherPreferences || '';
    const separator = currentValue.trim() ? '\n\n' : '';
    updatePreference('otherPreferences', currentValue + separator + idea.trim());
    setCreativeIdeas(prev => prev.filter(i => i !== idea));
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(preferences, true); // Trigger name generation
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return preferences.userName?.trim() && preferences.babyGender && preferences.religion?.trim();
      case 2:
        return preferences.birthCountry?.trim() && preferences.livingCountry?.trim();
      case 3:
        return true; // Ideas are optional
      case 4:
        return true; // Final thoughts are optional
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, title: "Let's get started", icon: User },
    { number: 2, title: "Demographics", icon: Globe },
    { number: 3, title: "How would you like the name to be?", icon: Lightbulb },
    { number: 4, title: "Any final thoughts", icon: Edit3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex-1 flex flex-col items-center">
                  <div className="relative flex items-center justify-center w-full">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={20} />
                      ) : (
                        <StepIcon size={20} />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute left-1/2 top-1/2 w-full h-0.5 -translate-y-1/2 transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                        style={{ width: 'calc(100% - 3rem)', marginLeft: '1.5rem' }}
                      />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium text-center ${
                      isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.number}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep - 1].title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[500px] flex flex-col">
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div>
                <label htmlFor="userName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="userName"
                  type="text"
                  value={preferences.userName || ''}
                  onChange={(e) => updatePreference('userName', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 transition-all"
                />
              </div>
              <div>
                <label htmlFor="partnerName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Partner's Name
                </label>
                <input
                  id="partnerName"
                  type="text"
                  value={preferences.partnerName || ''}
                  onChange={(e) => updatePreference('partnerName', e.target.value)}
                  placeholder="Enter your partner's name (optional)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Baby's Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {(['Boy', 'Girl', "I don't know yet"] as BabyGender[]).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => updatePreference('babyGender', gender)}
                      className={`px-4 py-3 border-2 rounded-xl text-left transition-all ${
                        preferences.babyGender === gender
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                          : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          preferences.babyGender === gender ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {gender}
                        </span>
                        {preferences.babyGender === gender && (
                          <Check size={20} className="text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="religion" className="block text-sm font-semibold text-gray-700 mb-2">
                  Religion <span className="text-red-500">*</span>
                </label>
                <select
                  id="religion"
                  value={preferences.religion || ''}
                  onChange={(e) => updatePreference('religion', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 bg-white transition-all"
                >
                  <option value="">Select a religion</option>
                  {RELIGIONS.map((religion) => (
                    <option key={religion} value={religion}>
                      {religion}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <SearchableSelect
                id="birthCountry"
                label="Birth Country of Baby"
                value={preferences.birthCountry || ''}
                onChange={(value) => updatePreference('birthCountry', value)}
                options={COUNTRIES}
                placeholder="Select a country"
                required={true}
              />
              <SearchableSelect
                id="livingCountry"
                label="Country of Residence"
                value={preferences.livingCountry || ''}
                onChange={(value) => updatePreference('livingCountry', value)}
                options={COUNTRIES}
                placeholder="Select a country"
                required={true}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex-1 flex flex-col space-y-6">
              <div>
                <label htmlFor="ideaPreferences" className="block text-base font-bold text-gray-900 mb-3">
                  Idea Preferences
                </label>
                <textarea
                  ref={textareaRef}
                  id="ideaPreferences"
                  value={preferences.otherPreferences || ''}
                  onChange={(e) => updatePreference('otherPreferences', e.target.value)}
                  placeholder="Tell me how you want to name your little star..."
                  rows={1}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 resize-none overflow-hidden min-h-[120px] transition-all"
                  style={{ height: 'auto' }}
                />
              </div>
              
              <button
                onClick={handleRequestCreativeIdeas}
                disabled={isGeneratingIdeas}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingIdeas ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating ideas...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb size={20} />
                    <span>Help me generate ideas</span>
                  </>
                )}
              </button>

              {creativeIdeas.length > 0 && (
                <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Creative Ideas</h3>
                  <p className="text-xs text-gray-500">
                    Remember to personalize each suggestion by editing it to fit your unique details.
                  </p>
                  <ul className="space-y-2">
                    {creativeIdeas.map((idea, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-700 flex-1">{idea}</span>
                        <button
                          onClick={() => handleAddIdea(idea)}
                          className="ml-3 p-1.5 hover:bg-purple-100 rounded-full text-purple-600 transition-colors flex-shrink-0"
                          aria-label="Add idea to preferences"
                        >
                          <Plus size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div>
                <label htmlFor="tone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Tone of the Name
                </label>
                <input
                  id="tone"
                  type="text"
                  value={preferences.tone || ''}
                  onChange={(e) => updatePreference('tone', e.target.value)}
                  placeholder="e.g., Modern, Classic, Traditional, Unique"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 transition-all"
                />
              </div>
              <div>
                <label htmlFor="alphabetPreferences" className="block text-sm font-semibold text-gray-700 mb-2">
                  Alphabet Preferences
                </label>
                <input
                  id="alphabetPreferences"
                  type="text"
                  value={preferences.alphabetPreferences || ''}
                  onChange={(e) => updatePreference('alphabetPreferences', e.target.value)}
                  placeholder="e.g., Starting with 'A', Ending with 'n', Must not contain 'x'"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 transition-all"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Specify starting with, ending with, must not contain, etc.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isCompleting || !canProceedToNext()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Complete & Generate Names
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

