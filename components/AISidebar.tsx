'use client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Send, Bot, User, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AISidebarProps {
  onGenerateNames: (names: string[], gender?: 'Boy' | 'Girl') => void;
  triggerReport?: (name: string) => void;
  userId?: string;
  onReportGenerated?: (name: string, reportContent: string) => void;
  onIdeasGenerated?: (ideas: string[]) => void;
}

export type AISidebarRef = {
  sendMessage: (message: string) => void;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AISidebar = forwardRef<AISidebarRef, AISidebarProps>(
  ({ onGenerateNames, triggerReport, userId, onReportGenerated, onIdeasGenerated }, ref) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you find the perfect baby name. Tell me about your preferences - style, origin, or any specific requirements you have in mind!",
      },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState<string>(`session-${Date.now()}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callLangFlow = async (message: string): Promise<string> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_LANGFLOW_API_KEY;
    const langflowUrl = process.env.NEXT_PUBLIC_LANGFLOW_URL;
    message = message + ". User ID: " + user?.id;
    const response = await fetch(langflowUrl || 'http://localhost:7860/api/v1/run/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${apiKey}`,
        'Accept': 'application/json',
      } ,
        body: JSON.stringify({
          session_id: sessionId || `session-${Date.now()}`,
          input_type: "chat",
          output_type: "chat",
          input_value: message,
          user_id: userId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const response_message = data.outputs[0].outputs[0].outputs.message.message;
      return response_message;
    } catch (error) {
      console.error('Error calling LangFlow:', error);
      throw error;
    }
  };

  // Extract gender from message
  const extractGenderFromMessage = (message: string): 'Boy' | 'Girl' | undefined => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('boy') || lowerMessage.includes('male')) {
      return 'Boy';
    }
    if (lowerMessage.includes('girl') || lowerMessage.includes('female')) {
      return 'Girl';
    }
    return undefined;
  };

  // Extract name from report request message
  const extractNameFromReportRequest = (message: string): string | null => {
    // Pattern: "What is the eytimology of this {name}?"
    const match1 = message.match(/What is the eytimology of this (.+?)\?/i);
    if (match1 && match1[1]) {
      return match1[1].trim();
    }
    
    // Pattern: "What is the meaning of the name {name}?"
    const match2 = message.match(/What is the meaning of the name (.+?)\?/i);
    if (match2 && match2[1]) {
      return match2[1].trim();
    }
    
    // General pattern: check if message is asking about etymology/meaning
    if (message.toLowerCase().includes('etymology') || message.toLowerCase().includes('meaning')) {
      // Try to extract name after "of this" or "of the name"
      const nameMatch = message.match(/(?:of this|of the name|about)\s+([^?]+)/i);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1].trim();
      }
    }
    
    return null;
  };


  const sendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Check if this is a report request
    const reportName = extractNameFromReportRequest(message);
    
    // Extract gender from message for name generation
    const gender = extractGenderFromMessage(message);

    try {
      const response = await callLangFlow(message);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If this was a report request, save the report
      if (reportName && onReportGenerated) {
        try {
          onReportGenerated(reportName, response);
        } catch (error) {
          console.error('Error saving report:', error);
        }
      }

      // Extract names from response and add to generated list
      // This will handle "Name my boy" and "Name my girl" button clicks
      const extractedNames = extractNames(response);
      if (extractedNames.length > 0) {
        onGenerateNames(extractedNames, gender);
      }

      // Extract ideas from response (for creative ideas feature)
      const extractedIdeas = extractIdeas(response);
      if (extractedIdeas.length > 0 && onIdeasGenerated) {
        // Check if message is about creative ideas
        const lowerMessage = message.toLowerCase();
        onIdeasGenerated(extractedIdeas);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unable to connect to the AI server. Please check your LangFlow server configuration.'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    sendMessage,
  }));

  const extractNames = (text: string): string[] => {
    // Look for the phrase "Here you go" (case-insensitive)
    const searchPhrase = 'Here you go';
    const lowerText = text.toLowerCase();
    const lowerPhrase = searchPhrase.toLowerCase();
    const phraseIndex = lowerText.indexOf(lowerPhrase);

    // If phrase not found, return empty array
    if (phraseIndex === -1) {
      return [];
    }

    // Get the text after "Here you go"
    const textAfterPhrase = text.substring(phraseIndex + searchPhrase.length);

    // Split into lines and extract numbered bullet points
    const lines = textAfterPhrase.split('\n');
    const names: string[] = [];

    for (const line of lines) {
      // Match numbered bullet points like "1. Name", "2. Name", etc.
      // Pattern matches: number followed by period/dot, optional whitespace, then the name
      const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
      if (numberedMatch) {
        const name = numberedMatch[1].trim();
        if (name.length > 0) {
          names.push(name);
        }
      }
    }

    return names.filter((name) => name.length > 1 && name.length < 30);
  };

  // Extract ideas from text (similar to extractNames but for ideas)
  const extractIdeas = (text: string): string[] => {
    // Look for the phrase "Here you go" (case-insensitive)
    const searchPhrase = 'Here you go on ideas for your baby';
    const lowerText = text.toLowerCase();
    const lowerPhrase = searchPhrase.toLowerCase();
    const phraseIndex = lowerText.indexOf(lowerPhrase);

    // If phrase not found, return empty array
    if (phraseIndex === -1) {
      return [];
    }

    // Get the text after "Here you go"
    const textAfterPhrase = text.substring(phraseIndex + searchPhrase.length);

    // Split into lines and extract numbered bullet points
    const lines = textAfterPhrase.split('\n');
    const ideas: string[] = [];

    for (const line of lines) {
      // Match numbered bullet points like "1. Idea", "2. Idea", etc.
      const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
      if (numberedMatch) {
        const idea = numberedMatch[1].trim();
        if (idea.length > 0) {
          ideas.push(idea);
        }
      }
    }

    return ideas.filter((idea) => idea.length > 1);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    // Extract gender from user input
    const gender = extractGenderFromMessage(userInput);

    try {
      const response = await callLangFlow(userInput);

      const extractedNames = extractNames(response);
      
      if (extractedNames.length > 0) {
        onGenerateNames(extractedNames, gender);
      }

      // Extract ideas from response (for creative ideas feature)
      const extractedIdeas = extractIdeas(response);
      if (extractedIdeas.length > 0 && onIdeasGenerated) {
        // Check if message is about creative ideas
        const lowerMessage = userInput.toLowerCase();
        console.log(lowerMessage);
        onIdeasGenerated(extractedIdeas);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {message.role === 'user' ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-200">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.email || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={18} className="text-gray-600" />
                )}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-yellow-200 to-orange-300 overflow-hidden">
                {/* Boss Baby emoji/icon */}
                <span className="text-xl">👶</span>
              </div>
            )}
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-yellow-200 to-orange-300">
              <span className="text-xl">👶</span>
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for name suggestions..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
});

AISidebar.displayName = 'AISidebar';

export default AISidebar;
