'use client';

import StandardPreferences from './StandardPreferences';
import { UserPreferences } from '@/types';

interface PreferencesTabProps {
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => Promise<void>;
}

export default function PreferencesTab({ preferences, onSave }: PreferencesTabProps) {
  return (
    <div className="h-full overflow-y-auto">
      <StandardPreferences preferences={preferences} onSave={onSave} />
    </div>
  );
}

