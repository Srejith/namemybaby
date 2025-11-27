'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Search, CheckCircle2 } from 'lucide-react';
import { NameItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { checkAudioFileExists, getAudioFile, saveAudioFile } from '@/lib/voice-audio';

interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
}

interface VoiceAnalysisProps {
  shortlistNames: NameItem[];
  maybeNames: NameItem[];
}

const PREDEFINED_TEXTS: Record<string, string> = {
  default: `Hi there, {name}. It's so nice to meet you! I've always loved the name {name} because it sounds strong and elegant. Don't you think {name} has a wonderful ring to it? I love it so much that I want to name my baby {name} too!`,
};

export default function VoiceAnalysis({ shortlistNames, maybeNames }: VoiceAnalysisProps) {
  const { user } = useAuth();
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'shortlist' | 'maybe'>('shortlist');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationText, setConversationText] = useState<string>(PREDEFINED_TEXTS.default);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Update conversation text when selected name changes
  useEffect(() => {
    if (selectedName) {
      setConversationText(PREDEFINED_TEXTS.default.replace(/{name}/g, selectedName));
    }
  }, [selectedName]);

  // Fetch voices from Eleven Labs API
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/elevenlabs/voices');
        if (response.ok) {
          const data = await response.json();
          // Eleven Labs API returns { voices: [...] }
          const voicesList = data.voices || [];
          setVoices(voicesList);
          setFilteredVoices(voicesList);
        } else {
          console.error('Failed to fetch voices');
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };

    fetchVoices();
  }, []);

  // Filter voices based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVoices(voices);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = voices.filter(
      (voice) =>
        voice.name.toLowerCase().includes(query) ||
        voice.description?.toLowerCase().includes(query) ||
        voice.category?.toLowerCase().includes(query)
    );
    setFilteredVoices(filtered);
  }, [searchQuery, voices]);

  // Combine names from both categories
  const allNames = [
    ...shortlistNames.map((n) => ({ ...n, category: 'shortlist' as const })),
    ...maybeNames.map((n) => ({ ...n, category: 'maybe' as const })),
  ];

  const getTextForName = (name: string): string => {
    // Use the editable conversation text, replacing {name} placeholder if still present
    return conversationText.replace(/{name}/g, name);
  };

  const handlePlay = async () => {
    if (!selectedName || !selectedVoice || !user) return;

    if (isPlaying && audioRef.current) {
      // Pause current playback
      audioRef.current.pause();
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      let audioBlob: Blob | null = null;
      let audioUrl: string;

      // First, check if audio file exists in database
      const exists = await checkAudioFileExists(selectedName, selectedVoice.voice_id, user.id);
      
      if (exists) {
        // Get audio from database
        audioBlob = await getAudioFile(selectedName, selectedVoice.voice_id, user.id);
        if (audioBlob) {
          audioUrl = URL.createObjectURL(audioBlob);
        } else {
          throw new Error('Failed to retrieve audio from database');
        }
      } else {
        // Generate new audio using Eleven Labs API
        const text = getTextForName(selectedName);
        
        const response = await fetch('/api/elevenlabs/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            voice_id: selectedVoice.voice_id,
            text: text,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate audio');
        }

        // Get audio blob
        audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);

        // Save audio to database (silently in background)
        saveAudioFile(selectedName, selectedVoice.voice_id, audioBlob, user.id)
          .catch((error) => {
            console.error('Failed to save audio to database:', error);
            // Don't show error to user - save is optional
          });
      }

      // Play the audio
      setIsPlaying(true);
      
      if (audioRef.current) {
        // Clean up old URL if exists
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      alert('Failed to play audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col h-full bg-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Analysis</h2>
        <p className="text-sm text-gray-600">Listen to how your names sound in different accents</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Name Selection */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Name</h3>
            
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setSelectedCategory('shortlist');
                  setSelectedName('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'shortlist'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Shortlist ({shortlistNames.length})
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('maybe');
                  setSelectedName('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'maybe'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Maybe ({maybeNames.length})
              </button>
            </div>

            {/* Name List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(selectedCategory === 'shortlist' ? shortlistNames : maybeNames).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedName(item.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedName === item.name
                      ? item.gender === 'Boy'
                        ? 'bg-blue-600 border-blue-700 text-white'
                        : item.gender === 'Girl'
                        ? 'bg-pink-600 border-pink-700 text-white'
                        : 'bg-gray-600 border-gray-700 text-white'
                      : item.gender === 'Boy'
                      ? 'bg-blue-50 border-blue-200 text-gray-900 hover:bg-blue-100'
                      : item.gender === 'Girl'
                      ? 'bg-pink-50 border-pink-200 text-gray-900 hover:bg-pink-100'
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium">{item.name}</span>
                  {selectedName === item.name && (
                    <CheckCircle2 size={20} className="flex-shrink-0" />
                  )}
                </button>
              ))}
              {(selectedCategory === 'shortlist' ? shortlistNames : maybeNames).length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">
                  No names in {selectedCategory === 'shortlist' ? 'shortlist' : 'maybe'} yet.
                </p>
              )}
            </div>
          </div>

          {/* Conversation Preview - Editable */}
          {selectedName && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label htmlFor="conversation-text" className="block text-sm font-medium text-gray-700 mb-2">
                Conversation Preview
              </label>
              <textarea
                id="conversation-text"
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                placeholder="Enter conversation text... Use {name} as placeholder for the name"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This text will be read aloud. Use {"{name}"} as a placeholder for the name.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Voice Selection and Player */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Voice</h3>
            
            {/* Voice Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voices..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Voice List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredVoices.map((voice) => (
                <button
                  key={voice.voice_id}
                  onClick={() => setSelectedVoice(voice)}
                  className={`w-full flex items-start justify-between p-3 rounded-lg border transition-colors text-left ${
                    selectedVoice?.voice_id === voice.voice_id
                      ? 'bg-blue-600 border-blue-700 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{voice.name}</p>
                    {voice.description && (
                      <p className={`text-xs mt-1 ${
                        selectedVoice?.voice_id === voice.voice_id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {voice.description}
                      </p>
                    )}
                    {voice.category && (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                        selectedVoice?.voice_id === voice.voice_id 
                          ? 'bg-blue-700 text-blue-100' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {voice.category}
                      </span>
                    )}
                  </div>
                  {selectedVoice?.voice_id === voice.voice_id && (
                    <CheckCircle2 size={20} className="flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
              {filteredVoices.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">
                  {searchQuery ? 'No voices found' : 'Loading voices...'}
                </p>
              )}
            </div>
          </div>

          {/* Play Button */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <button
              onClick={handlePlay}
              disabled={!selectedName || !selectedVoice || isLoading}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-colors ${
                !selectedName || !selectedVoice || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isPlaying
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating audio...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause size={24} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={24} />
                  <span>Play Audio</span>
                </>
              )}
            </button>
            {(!selectedName || !selectedVoice) && (
              <p className="text-xs text-gray-500 text-center mt-2">
                {!selectedName ? 'Please select a name' : 'Please select a voice'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
}

