'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Preferences from '@/components/Preferences';
import LoginButton from '@/components/LoginButton';
import LoginPage from '@/components/LoginPage';
import ReportsList from '@/components/ReportsList';
import ReportDetail from '@/components/ReportDetail';
import LeftSidebar from '@/components/LeftSidebar';
import TopHeader from '@/components/TopHeader';
import HomeContent from '@/components/HomeContent';
import VoiceAnalysis from '@/components/VoiceAnalysis';
import ReportPanel from '@/components/ReportPanel';
import VoiceSelectionSidebar from '@/components/VoiceSelectionSidebar';
import PreferencesPanel from '@/components/PreferencesPanel';
import PreferencesTab from '@/components/PreferencesTab';
import OnboardingWizard from '@/components/OnboardingWizard';
import MoveNameModal from '@/components/MoveNameModal';
import { NameItem, UserPreferences } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadNamesFromTable,
  insertNameToTable,
  insertNamesToTable,
  deleteNameFromTable,
  moveNameBetweenTables,
  TableName,
} from '@/lib/database';
import { loadUserPreferences, saveUserPreferences } from '@/lib/preferences';
import { upsertReport, NameReport, loadReportByName } from '@/lib/reports';

const BUCKET_TYPES = ['shortlist', 'maybe', 'rejected'] as const;

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [generatedNames, setGeneratedNames] = useState<NameItem[]>([]);

  const [names, setNames] = useState<Record<string, NameItem[]>>({
    shortlist: [],
    maybe: [],
    rejected: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'voiceAnalysis' | 'preferences'>('home');
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false);
  const [creativeIdeas, setCreativeIdeas] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<NameReport | null>(null);
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [reportPanelName, setReportPanelName] = useState<string>('');
  const [reportPanelContent, setReportPanelContent] = useState<string | null>(null);
  const [reportPanelLoading, setReportPanelLoading] = useState(false);
  const [voiceSidebarOpen, setVoiceSidebarOpen] = useState(false);
  const [voiceSidebarName, setVoiceSidebarName] = useState<string>('');
  const [preferencesPanelOpen, setPreferencesPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveModalItem, setMoveModalItem] = useState<NameItem | null>(null);
  const [moveModalCurrentBucket, setMoveModalCurrentBucket] = useState<string>('');
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  // Utility function to extract names and inspirations from LangFlow response
  const extractNames = (text: string): Array<{ name: string; inspiration?: string }> => {
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
    const nameItems: Array<{ name: string; inspiration?: string }> = [];

    for (const line of lines) {
      // Match numbered bullet points like "1. Name: name Inspiration: inspiration", etc.
      const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
      if (numberedMatch) {
        const content = numberedMatch[1].trim();
        
        // Parse format: "Name: name Inspiration: inspiration"
        // Case-insensitive matching for "Name:" and "Inspiration:"
        // Name is the first word after "Name:"
        // Inspiration is all remaining words after "Inspiration:"
        
        // Try to find the pattern "Name: <name> Inspiration: <inspiration>"
        const nameInspirationMatch = content.match(/Name:\s+(\S+)\s+Inspiration:\s+(.+)$/i);
        
        if (nameInspirationMatch) {
          const name = nameInspirationMatch[1].trim();
          const inspiration = nameInspirationMatch[2].trim();
          
          if (name.length > 1 && name.length < 30) {
            nameItems.push({
              name,
              inspiration: inspiration || undefined,
            });
          }
        } else {
          // Fallback: try to extract just the name if format doesn't match exactly
          const nameOnlyMatch = content.match(/Name:\s+(\S+)/i);
          if (nameOnlyMatch) {
            const name = nameOnlyMatch[1].trim();
            if (name.length > 1 && name.length < 30) {
              nameItems.push({
                name,
                inspiration: undefined,
              });
            }
          }
        }
      }
    }

    return nameItems;
  };

  // Utility function to extract ideas from LangFlow response
  const extractIdeas = (text: string): string[] => {
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

  // Extract gender from message
  const extractGenderFromMessage = (message: string): 'Boy' | 'Girl' | undefined => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('boy') || lowerMessage.includes('male') || lowerMessage.includes('prince')) {
      return 'Boy';
    }
    if (lowerMessage.includes('girl') || lowerMessage.includes('female') || lowerMessage.includes('princess')) {
      return 'Girl';
    }
    return undefined;
  };

  // Generate report via LangFlow API
  const generateReport = async (name: string): Promise<string> => {
    const reportMessage = `What is the etymology and meaning of the name ${name}?`;
    const data = await callLangFlow(reportMessage);
    return data;
  };

  const handleVoiceClick = (name: string) => {
    setVoiceSidebarName(name);
    setVoiceSidebarOpen(true);
  };

  // Handle move name click (for mobile)
  const handleMoveClick = (item: NameItem, currentBucket: string) => {
    setMoveModalItem(item);
    setMoveModalCurrentBucket(currentBucket);
    setMoveModalOpen(true);
  };

  // Handle move to bucket from modal
  const handleMoveToBucket = async (item: NameItem, fromBucket: string, toBucket: string) => {
    // Self-check: Check if name already exists in the target bucket
    if (isNameInBucket(item.name, toBucket)) {
      const bucketDisplayName = getBucketDisplayName(toBucket);
      setErrorMessage(`"${item.name}" already exists in ${bucketDisplayName}. Duplicate names are not allowed.`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      // If moving from generated names
      if (fromBucket === 'generated') {
        const newItem = await moveNameBetweenTables(
          'generated_list',
          toBucket as TableName,
          item.id,
          item.name,
          user?.id,
          item.gender,
          item.inspiration
        );

        if (newItem) {
          // Update UI - remove from generated, add to target bucket
          setGeneratedNames((prev) => prev.filter((i) => i.id !== item.id));
          setNames((prev) => ({
            ...prev,
            [toBucket]: [...prev[toBucket], newItem],
          }));
        }
      } else {
        // Move between buckets in database
        const newItem = await moveNameBetweenTables(
          fromBucket as TableName,
          toBucket as TableName,
          item.id,
          item.name,
          user?.id,
          item.gender,
          item.inspiration
        );

        if (newItem) {
          // Update UI
          setNames((prev) => ({
            ...prev,
            [fromBucket]: prev[fromBucket].filter((i) => i.id !== item.id),
            [toBucket]: [...prev[toBucket], newItem],
          }));
        }
      }
    } catch (error) {
      const bucketDisplayName = getBucketDisplayName(toBucket);
      setErrorMessage(error instanceof Error ? error.message : `Failed to move name to ${bucketDisplayName}.`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    userName: '',
    partnerName: '',
    birthCountry: '',
    livingCountry: '',
    religion: '',
    tone: '',
    alphabetPreferences: '',
    otherPreferences: '',
    numberOfNamesToGenerate: 5,
  });

  // Helper function to check if onboarding is needed
  const needsOnboarding = (prefs: UserPreferences): boolean => {
    return !prefs.userName?.trim() || !prefs.babyGender || !prefs.religion?.trim() || !prefs.birthCountry?.trim() || !prefs.livingCountry?.trim();
  };

  // Check for auth errors in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'auth_callback_error') {
      setErrorMessage('Authentication failed. Please try signing in again.');
      setTimeout(() => setErrorMessage(null), 5000);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Load data from Supabase when user changes
  useEffect(() => {
    if (authLoading) {
      setIsLoadingData(true);
      return;
    }

    const loadAllData = async () => {
      try {
        setIsLoadingData(true);

        if (!user) {
          // User not authenticated - clear all data
          setGeneratedNames([]);
          setNames({
            shortlist: [],
            maybe: [],
            rejected: [],
          });
          setIsLoadingData(false);
          return;
        }

        const [generated, shortlist, maybe, rejected, userPrefs] = await Promise.all([
          loadNamesFromTable('generated_list', user.id),
          loadNamesFromTable('shortlist', user.id),
          loadNamesFromTable('maybe', user.id),
          loadNamesFromTable('rejected', user.id),
          loadUserPreferences(user.id),
        ]);

        setGeneratedNames(generated);
        setNames({
          shortlist,
          maybe,
          rejected,
        });

        // Set preferences if loaded
        if (userPrefs) {
          setPreferences(userPrefs);
          // Check if onboarding is needed
          setShowOnboarding(needsOnboarding(userPrefs));
        } else {
          // No preferences found - show onboarding
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error loading data from database:', error);
        // Don't show error if Supabase is not configured - just continue without data
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          setErrorMessage('Failed to load data from database. App will continue without persistence.');
          setTimeout(() => setErrorMessage(null), 5000);
        }
        // Initialize with empty arrays
        setGeneratedNames([]);
        setNames({
          shortlist: [],
          maybe: [],
          rejected: [],
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAllData();
  }, [user, authLoading]);

  const findBucket = (id: string): string | null => {
    // Check if it's a bucket ID itself
    if (BUCKET_TYPES.includes(id as any)) {
      return id;
    }
    
    // Check if it's in generated names
    if (generatedNames.some((item) => item.id === id)) {
      return 'generated';
    }
    
    // Check buckets for the item
    for (const bucket of BUCKET_TYPES) {
      if (names[bucket].some((item) => item.id === id)) {
        return bucket;
      }
    }
    return null;
  };

  // Check if a name (case-insensitive) exists in a specific bucket (self-check)
  const isNameInBucket = (name: string, bucketId: string): boolean => {
    const normalizedName = name.trim().toLowerCase();
    if (!BUCKET_TYPES.includes(bucketId as any)) return false;
    return names[bucketId].some((item) => item.name.toLowerCase() === normalizedName);
  };

  // Check if a name (case-insensitive) exists in generated names
  const isNameInGenerated = (name: string): boolean => {
    const normalizedName = name.trim().toLowerCase();
    return generatedNames.some((item) => item.name.toLowerCase() === normalizedName);
  };

  // Get bucket display name
  const getBucketDisplayName = (bucketId: string): string => {
    if (bucketId === 'shortlist') return 'Shortlist';
    if (bucketId === 'maybe') return 'Maybe';
    if (bucketId === 'rejected') return 'Rejected';
    return bucketId;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setErrorMessage(null);

    if (!over) return;

    const activeBucket = findBucket(active.id as string);
    // Use findBucket to determine the target bucket - this handles both bucket IDs and item IDs
    const overBucket = findBucket(over.id as string);

    if (!activeBucket || !overBucket || activeBucket === overBucket) return;

    // If dragging from generated names
    if (activeBucket === 'generated') {
      const activeItem = generatedNames.find((item) => item.id === active.id);
      if (!activeItem || !BUCKET_TYPES.includes(overBucket as any)) return;

      // Self-check: Check if name already exists in the target bucket itself
      if (isNameInBucket(activeItem.name, overBucket)) {
        const bucketDisplayName = getBucketDisplayName(overBucket);
        setErrorMessage(`"${activeItem.name}" already exists in ${bucketDisplayName}. Duplicate names are not allowed.`);
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      // Move from generated_list to target bucket in database
      moveNameBetweenTables('generated_list', overBucket as TableName, activeItem.id, activeItem.name, user?.id, activeItem.gender, activeItem.inspiration)
        .then((newItem) => {
          if (newItem) {
            // Update UI
            setGeneratedNames((prev) => prev.filter((item) => item.id !== active.id));
            setNames((prev) => ({
              ...prev,
              [overBucket]: [...prev[overBucket], newItem],
            }));
          }
        })
        .catch((error) => {
          const bucketDisplayName = getBucketDisplayName(overBucket);
          setErrorMessage(error.message || `Failed to move name to ${bucketDisplayName}.`);
          setTimeout(() => setErrorMessage(null), 5000);
        });
      return;
    }

    // Move name from one bucket to another
    if (BUCKET_TYPES.includes(activeBucket as any) && BUCKET_TYPES.includes(overBucket as any)) {
      const activeItem = names[activeBucket]?.find((item) => item.id === active.id);
      if (!activeItem) return;

      // Self-check: Check if name already exists in the target bucket itself
      if (isNameInBucket(activeItem.name, overBucket)) {
        const bucketDisplayName = getBucketDisplayName(overBucket);
        setErrorMessage(`"${activeItem.name}" already exists in ${bucketDisplayName}. Duplicate names are not allowed.`);
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      // Move between buckets in database
      moveNameBetweenTables(activeBucket as TableName, overBucket as TableName, activeItem.id, activeItem.name, user?.id, activeItem.gender, activeItem.inspiration)
        .then((newItem) => {
          if (newItem) {
            // Update UI
            setNames((prev) => {
              return {
                ...prev,
                [activeBucket]: prev[activeBucket].filter((item) => item.id !== active.id),
                [overBucket]: [...prev[overBucket], newItem],
              };
            });
          }
        })
        .catch((error) => {
          const bucketDisplayName = getBucketDisplayName(overBucket);
          setErrorMessage(error.message || `Failed to move name to ${bucketDisplayName}.`);
          setTimeout(() => setErrorMessage(null), 5000);
        });
    }
  };

  const handleAddName = async (bucket: string, name: string) => {
    if (!name.trim()) return;

    // Self-check: Check if name already exists in this bucket itself
    if (isNameInBucket(name.trim(), bucket)) {
      const bucketDisplayName = getBucketDisplayName(bucket);
      setErrorMessage(`"${name.trim()}" already exists in ${bucketDisplayName}. Duplicate names are not allowed.`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      const newItem = await insertNameToTable(bucket as TableName, name.trim(), user?.id);
      if (newItem) {
        setNames((prev) => ({
          ...prev,
          [bucket]: [...prev[bucket], newItem],
        }));
      }
    } catch (error) {
      const bucketDisplayName = getBucketDisplayName(bucket);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `"${name.trim()}" already exists in ${bucketDisplayName}. Duplicate names are not allowed.`
      );
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleDeleteName = async (bucket: string, id: string) => {
    try {
      await deleteNameFromTable(bucket as TableName, id, user?.id);
      setNames((prev) => ({
        ...prev,
        [bucket]: prev[bucket].filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting name:', error);
      setErrorMessage('Failed to delete name. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  /*Creating a generic function to call LangFlow API*/
  const callLangFlow = async (message: string) => {
    const apiKey = process.env.NEXT_PUBLIC_LANGFLOW_API_KEY;
    const langflowUrl = process.env.NEXT_PUBLIC_LANGFLOW_URL;
    message = message + ". User ID: " + user?.id;
    const response = await fetch(langflowUrl || 'http://localhost:7860/api/v1/run/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionIdRef.current || `session-${Date.now()}`,
        input_type: "chat",
        output_type: "chat",
        input_value: message,
        user_id: user?.id || null
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to call LangFlow API');
    }

    const data = await response.json();
    const responseText = data.outputs[0].outputs[0].outputs.message.message;
    return responseText;
  };
  
 



  // Call LangFlow API to generate names
  const callLangFlowForNames = async (message: string, gender?: 'Boy' | 'Girl') => {
    if (!user) {
      setErrorMessage('Please sign in to generate names.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setIsGeneratingNames(true);
    setErrorMessage(null);

    try {      
      const responseText = await callLangFlow(message);
      // Extract names from response
      const extractedNames = extractNames(responseText);
      
      if (extractedNames.length === 0) {
        setErrorMessage('No names were found in the response. Please try again.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      // Use the extracted gender if not provided
      const finalGender = gender || extractGenderFromMessage(message);

      // Call existing handler to save names
      await handleGenerateNames(extractedNames, finalGender);
    } catch (error) {
      console.error('Error generating names:', error);
      setErrorMessage('Failed to generate names. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsGeneratingNames(false);
    }
  };

  // Open the Idea Hub panel (for "Generate Ideas" button)
  const handleOpenIdeasPanel = () => {
    setPreferencesPanelOpen(true);
  };

  // Call LangFlow API to generate ideas (for "Help me generate Ideas" button inside panel)
  const callLangFlowForIdeas = async () => {
    if (!user) {
      setErrorMessage('Please sign in to generate ideas.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setIsGeneratingIdeas(true);
    setErrorMessage(null);

    try {
      const message = 'Provide me with creative ideas to name my child';
      const responseText = await callLangFlow(message);

      // Extract ideas from response
      const extractedIdeas = extractIdeas(responseText);
      
      if (extractedIdeas.length === 0) {
        setErrorMessage('No ideas were found in the response. Please try again.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      // Update creative ideas state
      setCreativeIdeas(extractedIdeas);
    } catch (error) {
      console.error('Error generating ideas:', error);
      setErrorMessage('Failed to generate ideas. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleGenerateNames = async (newGeneratedNames: Array<{ name: string; inspiration?: string }>, gender?: 'Boy' | 'Girl') => {

    // Filter out duplicates: only check against existing generated names (independent of buckets)
    const uniqueNameItems = newGeneratedNames.filter((nameItem) => {
      const trimmedName = nameItem.name.trim();
      return !isNameInGenerated(trimmedName);
    });

    if (uniqueNameItems.length === 0) {
      setErrorMessage('All generated names already exist in the generated names list. No new names were added.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      // Insert unique names to database with gender and inspiration (database will also prevent duplicates)
      const insertedItems = await insertNamesToTable('generated_list', uniqueNameItems, user?.id, gender);

      if (insertedItems.length === 0) {
        setErrorMessage('All generated names already exist in the generated names list. No new names were added.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      if (insertedItems.length < uniqueNameItems.length) {
        const skippedCount = uniqueNameItems.length - insertedItems.length;
        setErrorMessage(`${skippedCount} duplicate name(s) were skipped. Only unique names were added to the generated names list.`);
        setTimeout(() => setErrorMessage(null), 5000);
      }

      // Update UI
      setGeneratedNames((prev) => [...prev, ...insertedItems]);
    } catch (error) {
      console.error('Error generating names:', error);
      setErrorMessage('Failed to add generated names. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };


  const handleRequestReport = async (name: string) => {
    // Check if user is authenticated
    if (!user) {
      setErrorMessage('Please sign in to use AI features.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    // Check if a report already exists for this name
    try {
      const existingReport = await loadReportByName(name, user.id);
      
      if (existingReport) {
        // Report exists - open report panel with existing content
        setReportPanelName(name);
        setReportPanelContent(existingReport.report_content);
        setReportPanelLoading(false);
        setReportPanelOpen(true);
        return;
      }
    } catch (error) {
      console.error('Error checking for existing report:', error);
      // Continue with generating new report if check fails
    }

    // No existing report found - generate a new one
    setReportPanelName(name);
    setReportPanelContent(null);
    setReportPanelLoading(true);
    setReportPanelOpen(true);

    try {
      const reportContent = await generateReport(name);
      setReportPanelContent(reportContent);
      
      // Save report to database
      try {
        await upsertReport(name, reportContent, user.id);
      } catch (error) {
        console.error('Error saving report:', error);
        // Don't show error - report is displayed even if save fails
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setErrorMessage('Failed to generate report. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
      setReportPanelOpen(false);
    } finally {
      setReportPanelLoading(false);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async (completedPreferences: UserPreferences, shouldGenerateNames: boolean) => {
    if (!user) return;

    try {
      // Save preferences to database
      await saveUserPreferences(completedPreferences, user.id);
      setPreferences(completedPreferences);
      setShowOnboarding(false);

      // Trigger name generation if requested
      if (shouldGenerateNames) {
        const gender = completedPreferences.babyGender;
        
        if (gender === "I don't know yet") {
          // Generate names for both boy and girl sequentially
          // Note: callLangFlowForNames handles its own loading state
          await callLangFlowForNames('Provide me with name suggestions for my baby boy', 'Boy');
          // Wait a bit before generating girl names
          await new Promise(resolve => setTimeout(resolve, 1500));
          await callLangFlowForNames('Provide me with name suggestions for my baby girl', 'Girl');
        } else if (gender === 'Boy') {
          // Generate only boy names
          await callLangFlowForNames('Provide me with name suggestions for my baby boy', 'Boy');
        } else if (gender === 'Girl') {
          // Generate only girl names
          await callLangFlowForNames('Provide me with name suggestions for my baby girl', 'Girl');
        }
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setErrorMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Handle creative ideas request in onboarding
  const handleOnboardingRequestIdeas = async (): Promise<string[]> => {
    if (!user) return [];

    setIsGeneratingIdeas(true);
    try {
      const message = 'Provide me with creative ideas to name my child';
      const responseText = await callLangFlow(message);
      const extractedIdeas = extractIdeas(responseText);
      return extractedIdeas;
    } catch (error) {
      console.error('Error generating ideas:', error);
      return [];
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const activeItem = activeId
    ? [...generatedNames, ...Object.values(names).flat()].find((item) => item.id === activeId)
    : null;

  // Show login page if user is not authenticated
  if (!user && !authLoading) {
    return <LoginPage />;
  }

  // Show onboarding wizard if needed
  if (user && showOnboarding && !isLoadingData) {
    return (
      <OnboardingWizard
        initialPreferences={preferences}
        onComplete={handleOnboardingComplete}
        onRequestCreativeIdeas={handleOnboardingRequestIdeas}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header */}
      {user && (
        <TopHeader 
          onMenuToggle={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
          leftSidebarExpanded={leftSidebarExpanded}
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
        {/* Left Sidebar */}
        {user && (
          <LeftSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            expanded={leftSidebarExpanded}
            onExpandedChange={setLeftSidebarExpanded}
          />
        )}

        <main className="flex-1 overflow-y-auto transition-all duration-300">
          <div className="p-6">
            {activeTab === 'home' && (
              <HomeContent
                generatedNames={generatedNames}
                names={names}
                isLoadingData={isLoadingData && (authLoading || !!user)}
                errorMessage={errorMessage}
                onAddName={handleAddName}
                onDeleteName={handleDeleteName}
                onRequestReport={handleRequestReport}
                onVoiceClick={handleVoiceClick}
                onMoveClick={handleMoveClick}
                onGenerateForBoy={() => callLangFlowForNames('Provide me with name suggestions for my baby boy', 'Boy')}
                onGenerateForGirl={() => callLangFlowForNames('Provide me with name suggestions for my baby girl', 'Girl')}
                onGenerateIdeasClick={handleOpenIdeasPanel}
                isGeneratingNames={isGeneratingNames}
                isGeneratingIdeas={isGeneratingIdeas}
                user={user}
                onDismissError={() => setErrorMessage(null)}
                babyGender={preferences.babyGender}
              />
            )}


            {activeTab === 'reports' && user && (
              <>
                {selectedReport ? (
                  <ReportDetail
                    report={selectedReport}
                    onBack={() => setSelectedReport(null)}
                  />
                ) : (
                  <ReportsList
                    userId={user.id}
                    onViewReport={(report) => setSelectedReport(report)}
                    onClose={() => setActiveTab('home')}
                  />
                )}
              </>
            )}

            {activeTab === 'voiceAnalysis' && user && (
              <VoiceAnalysis
                shortlistNames={names.shortlist}
                maybeNames={names.maybe}
              />
            )}

            {activeTab === 'preferences' && user && (
              <PreferencesTab
                preferences={preferences}
                onSave={async (newPreferences) => {
                  // Save preferences to database if user is authenticated
                  if (!user) {
                    throw new Error('User must be authenticated to save preferences');
                  }

                  try {
                    await saveUserPreferences(newPreferences, user.id);
                    // Update local state only after successful save
                    setPreferences(newPreferences);
                    setErrorMessage(null);
                  } catch (error) {
                    console.error('Error saving preferences:', error);
                    setErrorMessage('Failed to save preferences. Please try again.');
                    setTimeout(() => setErrorMessage(null), 5000);
                    throw error; // Re-throw to let PreferencesTab component handle UI state
                  }
                }}
              />
            )}
          </div>
        </main>

        {/* Report Panel */}
        {reportPanelOpen && (
          <ReportPanel
            name={reportPanelName}
            reportContent={reportPanelContent}
            isLoading={reportPanelLoading}
            onClose={() => {
              setReportPanelOpen(false);
              setReportPanelContent(null);
            }}
          />
        )}

        {/* Voice Selection Sidebar */}
        {voiceSidebarOpen && (
          <VoiceSelectionSidebar
            name={voiceSidebarName}
            onClose={() => {
              setVoiceSidebarOpen(false);
              setVoiceSidebarName('');
            }}
          />
        )}

        {/* Move Name Modal */}
        <MoveNameModal
          isOpen={moveModalOpen}
          item={moveModalItem}
          currentBucket={moveModalCurrentBucket}
          onClose={() => {
            setMoveModalOpen(false);
            setMoveModalItem(null);
            setMoveModalCurrentBucket('');
          }}
          onMoveToBucket={(bucketId) => {
            if (moveModalItem) {
              handleMoveToBucket(moveModalItem, moveModalCurrentBucket, bucketId);
            }
          }}
        />

        {/* Preferences Panel */}
        {preferencesPanelOpen && (
          <PreferencesPanel
            preferences={preferences}
            onSave={async (newPreferences) => {
              // Save preferences to database if user is authenticated
              if (!user) {
                throw new Error('User must be authenticated to save preferences');
              }

              try {
                await saveUserPreferences(newPreferences, user.id);
                // Update local state only after successful save
                setPreferences(newPreferences);
              } catch (error) {
                console.error('Error saving preferences:', error);
                setErrorMessage('Failed to save preferences. Please try again.');
                setTimeout(() => setErrorMessage(null), 5000);
                throw error; // Re-throw to let Preferences component handle UI state
              }
            }}
            onClose={() => setPreferencesPanelOpen(false)}
            onRequestCreativeIdeas={callLangFlowForIdeas}
            creativeIdeas={creativeIdeas}
            isGeneratingIdeas={isGeneratingIdeas}
          />
        )}

        <DragOverlay>
          {activeTab === 'home' && activeItem ? (
            <div className={`rounded-lg p-3 shadow-lg border-2 ${
              activeItem.gender === 'Boy' 
                ? 'bg-blue-500 border-blue-500' 
                : activeItem.gender === 'Girl'
                ? 'bg-pink-400 border-pink-400'
                : 'bg-white border-gray-300'
            }`}>
              <div className={`font-medium ${activeItem.gender ? 'text-white' : 'text-gray-900'}`}>{activeItem.name}</div>
              {activeItem.inspiration && (
                <div className={`text-xs mt-0.5 ${activeItem.gender ? 'text-white/80' : 'text-gray-600'}`}>
                  {activeItem.inspiration}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

