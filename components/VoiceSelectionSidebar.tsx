'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, CheckCircle2, Play, Pause } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveAudioFile } from '@/lib/voice-audio';

interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
}

interface VoiceSelectionSidebarProps {
  name: string;
  onClose: () => void;
}

const DEFAULT_TEXT = `Hi there, {name}. It's so nice to meet you! I've always loved the name {name} because it sounds strong and elegant. Don't you think {name} has a wonderful ring to it? I love it so much that I want to name my baby {name} too!`;

export default function VoiceSelectionSidebar({ name, onClose }: VoiceSelectionSidebarProps) {
  const { user } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationText, setConversationText] = useState<string>(DEFAULT_TEXT);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize conversation text with name when component mounts
  useEffect(() => {
    setConversationText(DEFAULT_TEXT.replace(/{name}/g, name));
  }, [name]);

  // Fetch voices from Eleven Labs API
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/elevenlabs/voices');
        if (response.ok) {
          const data = await response.json();
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

  const handlePlay = async () => {
    if (!selectedVoice || !user?.id) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setIsPlaying(true);

    try {
      // Use the editable conversation text, replacing {name} placeholder if still present
      const text = conversationText.replace(/{name}/g, name);
      let audioBlob: Blob | null = null;
      let audioUrl: string | null = null;

      // Always generate via Eleven Labs
      const response = await fetch('/api/elevenlabs/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: selectedVoice.voice_id, text: text }),
      });

      if (!response.ok) throw new Error('Failed to generate audio');

      audioBlob = await response.blob();
      audioUrl = URL.createObjectURL(audioBlob);
      console.log('Generated audio via Eleven Labs');

      // Save audio to database (silently in background)
      saveAudioFile(name, selectedVoice.voice_id, audioBlob, user.id)
        .catch((error) => {
          console.error('Failed to save audio to database:', error);
        });

      if (audioUrl && audioRef.current) {
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl!);
        };
        audioRef.current.play();
      } else {
        throw new Error('Audio URL not available');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      alert('Failed to play audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Voice Analysis</h2>
          <p className="text-sm text-gray-500 mt-0.5">Name: {name}</p>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Conversation Preview - Editable */}
        <div>
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

        {/* Voice Search */}
        <div className="relative">
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
        <div className="space-y-2 max-h-96 overflow-y-auto">
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

        {/* Play Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handlePlay}
            disabled={!selectedVoice || isLoading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-colors ${
              !selectedVoice || isLoading
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
          {!selectedVoice && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Please select a voice
            </p>
          )}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
}
