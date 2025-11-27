'use client';

import GeneratedNames from '@/components/GeneratedNames';
import NameBucket from '@/components/NameBucket';
import { NameItem } from '@/types';

interface HomeContentProps {
  generatedNames: NameItem[];
  names: Record<string, NameItem[]>;
  isLoadingData: boolean;
  errorMessage: string | null;
  onAddName: (bucket: string, name: string) => void;
  onDeleteName: (bucket: string, id: string) => void;
  onRequestReport: (name: string) => void;
  onVoiceClick?: (name: string) => void;
  onGenerateForBoy: () => void;
  onGenerateForGirl: () => void;
  onGenerateIdeasClick?: () => void;
  isGeneratingNames?: boolean;
  isGeneratingIdeas?: boolean;
  user: any;
  onDismissError?: () => void;
  babyGender?: 'Boy' | 'Girl' | "I don't know yet";
}

export default function HomeContent({
  generatedNames,
  names,
  isLoadingData,
  errorMessage,
  onAddName,
  onDeleteName,
  onRequestReport,
  onVoiceClick,
  onGenerateForBoy,
  onGenerateForGirl,
  onGenerateIdeasClick,
  isGeneratingNames = false,
  isGeneratingIdeas = false,
  user,
  onDismissError,
  babyGender,
}: HomeContentProps) {
  return (
    <>
      {isLoadingData && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          Loading data from database...
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={onDismissError}
            className="text-red-600 hover:text-red-800 ml-4"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {user && (
        <GeneratedNames 
          names={generatedNames}
          onGenerateForBoy={onGenerateForBoy}
          onGenerateForGirl={onGenerateForGirl}
          onGenerateIdeasClick={onGenerateIdeasClick}
          isGeneratingNames={isGeneratingNames}
          isGeneratingIdeas={isGeneratingIdeas}
          babyGender={babyGender}
        />
      )}

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          <NameBucket
            title="Shortlist Names"
            bucketId="shortlist"
            names={names.shortlist}
            onAddName={onAddName}
            onDeleteName={onDeleteName}
            onClick={onRequestReport}
            onVoiceClick={onVoiceClick}
            color="green"
          />
          <NameBucket
            title="Maybe"
            bucketId="maybe"
            names={names.maybe}
            onAddName={onAddName}
            onDeleteName={onDeleteName}
            onClick={onRequestReport}
            onVoiceClick={onVoiceClick}
            color="yellow"
          />
          <NameBucket
            title="Rejected"
            bucketId="rejected"
            names={names.rejected}
            onAddName={onAddName}
            onDeleteName={onDeleteName}
            color="red"
          />
        </div>
      )}
    </>
  );
}

