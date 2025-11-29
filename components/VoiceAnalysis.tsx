'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Search, CheckCircle2, Mic, Square } from 'lucide-react';
import { NameItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveAudioFile, checkAudioFileExists } from '@/lib/voice-audio';
import { saveUserRecording, checkUserRecordingExists, getUserRecording } from '@/lib/user-voice-recordings';

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
  // default: `Hi there, {name}. It's so nice to meet you! I've always loved the name {name} because it sounds strong and elegant. Don't you think {name} has a wonderful ring to it? I love it so much that I want to name my baby {name} too!`,
  default: `{name}`,
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
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserRecording, setHasUserRecording] = useState(false);
  
  // Add state for replay
  const [isPlayingUserRecording, setIsPlayingUserRecording] = useState(false);
  const userRecordingAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // State to track if ElevenLabs audio exists
  const [hasElevenLabsAudio, setHasElevenLabsAudio] = useState(false);
  
  // Store pending recording blob (recorded before voice is selected)
  const pendingRecordingRef = useRef<Blob | null>(null);
  const [hasPendingRecording, setHasPendingRecording] = useState(false);

  // Update conversation text when selected name changes
  useEffect(() => {
    if (selectedName) {
      setConversationText(PREDEFINED_TEXTS.default.replace(/{name}/g, selectedName));
    } else {
      // Clear pending recording when no name is selected
      pendingRecordingRef.current = null;
      setHasPendingRecording(false);
    }
  }, [selectedName]);

  // Check for user recording and ElevenLabs audio when name or voice changes
  useEffect(() => {
    if (selectedName && selectedVoice && user) {
      checkForUserRecording();
      checkForElevenLabsAudio();
      
      // If there's a pending recording and a voice is now selected, save it
      if (pendingRecordingRef.current) {
        savePendingRecording();
      }
    } else {
      setHasUserRecording(false);
      if (!selectedVoice) {
        setHasElevenLabsAudio(false);
      }
    }
  }, [selectedName, selectedVoice, user]);

  // Save pending recording when voice is selected
  const savePendingRecording = async () => {
    if (!pendingRecordingRef.current || !selectedName || !selectedVoice || !user) {
      return;
    }

    const blob = pendingRecordingRef.current;
    try {
      const saved = await saveUserRecording(selectedName, selectedVoice.voice_id, blob, user.id);
      if (saved) {
        setHasUserRecording(true);
        pendingRecordingRef.current = null; // Clear pending recording
        setHasPendingRecording(false);
        console.log('Pending recording saved successfully');
      } else {
        console.error('Failed to save pending recording');
      }
    } catch (error) {
      console.error('Error saving pending recording:', error);
    }
  };

  // Check if user has a recording for the current name and voice
  const checkForUserRecording = async () => {
    if (!selectedName || !selectedVoice || !user) {
      setHasUserRecording(false);
      return;
    }

    try {
      const exists = await checkUserRecordingExists(selectedName, selectedVoice.voice_id, user.id);
      setHasUserRecording(exists);
      console.log(`User recording check for ${selectedName} with voice ${selectedVoice.voice_id}: ${exists ? 'exists' : 'not found'}`);
    } catch (error) {
      console.error('Error checking for user recording:', error);
      setHasUserRecording(false);
    }
  };

  // Check if ElevenLabs audio exists for the current name and voice
  const checkForElevenLabsAudio = async () => {
    if (!selectedName || !selectedVoice || !user) {
      setHasElevenLabsAudio(false);
      return;
    }

    const exists = await checkAudioFileExists(selectedName, selectedVoice.voice_id, user.id);
    setHasElevenLabsAudio(exists);
  };

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

      // Always generate new audio using Eleven Labs API
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
        .then(() => {
          // Re-check both audio files after saving ElevenLabs audio
          if (selectedName && selectedVoice && user) {
            checkForElevenLabsAudio();
            // Also re-check user recording to ensure it's still available
            checkForUserRecording();
          }
        })
        .catch((error) => {
          console.error('Failed to save audio to database:', error);
          // Don't show error to user - save is optional
        });

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
          // Re-check user recording after ElevenLabs audio finishes
          if (selectedName && selectedVoice && user) {
            checkForUserRecording();
          }
        };
        await audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          // Re-check user recording after ElevenLabs audio finishes
          if (selectedName && selectedVoice && user) {
            checkForUserRecording();
          }
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

  // Recording handlers
  const startRecording = async () => {
    if (!selectedName || !user) {
      alert('Please select a name first');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // Check for supported mime types
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        // Fallback to default
        console.warn('Opus codec not supported, using default');
        delete (options as any).mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`Received chunk: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped. Chunks:', chunksRef.current.length);
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log(`Created blob: ${blob.size} bytes, type: ${blob.type}`);
        
        // Validate blob has data
        if (blob.size === 0) {
          console.error('Recording produced empty blob');
          alert('Recording failed: No audio data captured. Please try again.');
          setHasUserRecording(false);
          pendingRecordingRef.current = null;
          setHasPendingRecording(false);
          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        
        // Save recording to database if voice is selected, otherwise store as pending
        if (selectedVoice && selectedName && user) {
          try {
            const saved = await saveUserRecording(selectedName, selectedVoice.voice_id, blob, user.id);
            if (saved) {
              console.log('Recording saved successfully, verifying in database...');
              // Verify the recording was saved by checking database
              // Add a small delay to ensure database consistency
              await new Promise(resolve => setTimeout(resolve, 500));
              const verified = await checkUserRecordingExists(selectedName, selectedVoice.voice_id, user.id);
              if (verified) {
                setHasUserRecording(true);
                pendingRecordingRef.current = null; // Clear pending recording
                setHasPendingRecording(false);
                console.log('Recording verified in database');
              } else {
                console.error('Recording save verification failed - recording not found in database');
                setHasUserRecording(false);
                alert('Recording may not have been saved properly. Please try again.');
              }
            } else {
              console.error('Failed to save recording');
              alert('Failed to save recording. Please try again.');
              setHasUserRecording(false);
              pendingRecordingRef.current = null;
              setHasPendingRecording(false);
            }
          } catch (error) {
            console.error('Error saving recording:', error);
            alert('Failed to save recording. Please try again.');
            setHasUserRecording(false);
            pendingRecordingRef.current = null;
            setHasPendingRecording(false);
          }
        } else {
          // Voice not selected yet - store recording as pending
          pendingRecordingRef.current = blob;
          setHasPendingRecording(true);
          console.log('Recording saved as pending (waiting for voice selection)');
          alert('Recording completed! Please select a voice to save it.');
        }
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        chunksRef.current = []; // Clear chunks after saving
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording and request data every second to ensure chunks are collected
      mediaRecorder.start(1000); // Request data every 1 second
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}. Please check microphone permissions.`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Request final data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        // Small delay to ensure data is collected
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
          }
        }, 100);
      } else {
        mediaRecorderRef.current.stop();
      }
      
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      console.log('Stopping recording...');
    }
  };

  // Add function to replay user recording
  const handlePlayUserRecording = async () => {
    if (!selectedName || !user) {
      alert('Please select a name first');
      return;
    }

    // Check if there's a pending recording (no voice selected yet)
    if (pendingRecordingRef.current && hasPendingRecording && !selectedVoice) {
      // Play the pending recording directly from memory
      const audioUrl = URL.createObjectURL(pendingRecordingRef.current);
      setIsPlayingUserRecording(true);

      if (userRecordingAudioRef.current) {
        if (userRecordingAudioRef.current.src && userRecordingAudioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(userRecordingAudioRef.current.src);
        }
        userRecordingAudioRef.current.src = audioUrl;
        userRecordingAudioRef.current.onended = () => {
          setIsPlayingUserRecording(false);
          URL.revokeObjectURL(audioUrl);
        };
        userRecordingAudioRef.current.onerror = () => {
          setIsPlayingUserRecording(false);
          alert('Failed to play recording');
          URL.revokeObjectURL(audioUrl);
        };
        await userRecordingAudioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        userRecordingAudioRef.current = audio;
        audio.onended = () => {
          setIsPlayingUserRecording(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsPlayingUserRecording(false);
          alert('Failed to play recording');
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
      return;
    }

    if (!selectedVoice) {
      alert('Please select a voice first');
      return;
    }

    if (isPlayingUserRecording && userRecordingAudioRef.current) {
      userRecordingAudioRef.current.pause();
      setIsPlayingUserRecording(false);
      return;
    }

    try {
      console.log(`Fetching user recording for ${selectedName} with voice ${selectedVoice.voice_id}`);
      const audioBlob = await getUserRecording(selectedName, selectedVoice.voice_id, user.id);
      
      if (!audioBlob || audioBlob.size === 0) {
        console.error('User recording not found or empty:', {
          name: selectedName,
          voiceId: selectedVoice.voice_id,
          userId: user.id,
          blobSize: audioBlob?.size || 0,
        });
        // Re-check if recording exists in database
        await checkForUserRecording();
        alert('No recording found or recording is empty');
        return;
      }

      console.log(`User recording loaded successfully, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      // Validate and fix blob type if needed
      let finalBlob = audioBlob;
      if (!audioBlob.type || !audioBlob.type.startsWith('audio/')) {
        console.warn('Invalid or missing blob type:', audioBlob.type, '- fixing to audio/webm');
        // Try to fix by creating new blob with correct type
        finalBlob = new Blob([audioBlob], { type: 'audio/webm' });
      }
      
      const audioUrl = URL.createObjectURL(finalBlob);
      setIsPlayingUserRecording(true);

      if (userRecordingAudioRef.current) {
        // Clean up any existing audio
        if (userRecordingAudioRef.current.src) {
          if (userRecordingAudioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(userRecordingAudioRef.current.src);
          }
          // Reset audio element
          userRecordingAudioRef.current.pause();
          userRecordingAudioRef.current.src = '';
        }
        
        // Set new source and load
        userRecordingAudioRef.current.src = audioUrl;
        userRecordingAudioRef.current.load(); // Explicitly load the audio
        
        // Set up event handlers before playing
        userRecordingAudioRef.current.onended = () => {
          setIsPlayingUserRecording(false);
          URL.revokeObjectURL(audioUrl);
        };
        userRecordingAudioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlayingUserRecording(false);
          alert(`Failed to play recording. Error: ${userRecordingAudioRef.current?.error?.message || 'Unknown error'}`);
          URL.revokeObjectURL(audioUrl);
        };
        
        // Wait for canplay event before playing
        await new Promise<void>((resolve, reject) => {
          if (!userRecordingAudioRef.current) {
            reject(new Error('Audio element not available'));
            return;
          }
          
          const handleCanPlay = () => {
            userRecordingAudioRef.current?.removeEventListener('canplay', handleCanPlay);
            userRecordingAudioRef.current?.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = () => {
            userRecordingAudioRef.current?.removeEventListener('canplay', handleCanPlay);
            userRecordingAudioRef.current?.removeEventListener('error', handleError);
            reject(new Error('Failed to load audio'));
          };
          
          userRecordingAudioRef.current.addEventListener('canplay', handleCanPlay);
          userRecordingAudioRef.current.addEventListener('error', handleError);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            userRecordingAudioRef.current?.removeEventListener('canplay', handleCanPlay);
            userRecordingAudioRef.current?.removeEventListener('error', handleError);
            reject(new Error('Audio load timeout'));
          }, 5000);
        });
        
        await userRecordingAudioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        userRecordingAudioRef.current = audio;
        
        // Wait for audio to be ready before playing
        await new Promise<void>((resolve, reject) => {
          const handleCanPlay = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            reject(new Error(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`));
          };
          
          audio.addEventListener('canplay', handleCanPlay);
          audio.addEventListener('error', handleError);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            reject(new Error('Audio load timeout'));
          }, 5000);
        });
        
        audio.onended = () => {
          setIsPlayingUserRecording(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlayingUserRecording(false);
          alert(`Failed to play recording. Error: ${audio.error?.message || 'Unknown error'}`);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing user recording:', error);
      alert(`Failed to play recording: ${error instanceof Error ? error.message : 'Please try again.'}`);
      setIsPlayingUserRecording(false);
    }
  };

  // Cleanup audio and recording on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

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
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
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

            {/* Recording Section - Always Visible */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Record Your Voice</h4>
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!selectedName || isPlaying || isPlayingUserRecording}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      !selectedName || isPlaying || isPlayingUserRecording
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <Mic size={20} />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <Square size={20} />
                    <span>Stop Recording ({recordingDuration}s)</span>
                  </button>
                )}
              </div>
              {!selectedName ? (
                <p className="text-xs text-gray-500 text-center">
                  Please select a name to record
                </p>
              ) : (hasPendingRecording || hasUserRecording) && !isRecording ? (
                <div className="space-y-2">
                  {hasPendingRecording && !selectedVoice ? (
                    <p className="text-xs text-yellow-600 text-center">
                      ⚠ Recording completed. Please select a voice to save it.
                    </p>
                  ) : hasUserRecording ? (
                    <p className="text-xs text-green-600 text-center">
                      ✓ Recording saved
                    </p>
                  ) : null}
                  {/* Replay button - show if there's a pending recording or saved recording */}
                  {(hasPendingRecording || hasUserRecording) && (
                    <button
                      onClick={handlePlayUserRecording}
                      disabled={isPlaying || isRecording}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isPlaying || isRecording
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isPlayingUserRecording ? (
                        <>
                          <Pause size={16} />
                          <span>Pause Recording</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          <span>Replay My Recording</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </div>

      {/* Hidden audio elements */}
      <audio ref={audioRef} />
      <audio ref={userRecordingAudioRef} />
    </div>
  );
}
