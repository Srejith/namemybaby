'use client';

import { X } from 'lucide-react';
import { NameItem } from '@/types';

interface MoveNameModalProps {
  isOpen: boolean;
  item: NameItem | null;
  currentBucket: string;
  onClose: () => void;
  onMoveToBucket: (bucketId: string) => void;
}

const BUCKETS = [
  { id: 'shortlist', name: 'Shortlist', color: 'from-emerald-500 to-teal-500' },
  { id: 'maybe', name: 'Maybe', color: 'from-amber-500 to-orange-500' },
  { id: 'rejected', name: 'Rejected', color: 'from-rose-500 to-pink-500' },
] as const;

// Display name for buckets including generated
const getBucketDisplayName = (bucketId: string): string => {
  if (bucketId === 'shortlist') return 'Shortlist';
  if (bucketId === 'maybe') return 'Maybe';
  if (bucketId === 'rejected') return 'Rejected';
  if (bucketId === 'generated') return 'Generated Names';
  return bucketId;
};

export default function MoveNameModal({ isOpen, item, currentBucket, onClose, onMoveToBucket }: MoveNameModalProps) {
  if (!isOpen || !item) return null;

  // If moving from generated names, show all buckets. Otherwise, exclude current bucket
  const availableBuckets = currentBucket === 'generated' 
    ? BUCKETS 
    : BUCKETS.filter((bucket) => bucket.id !== currentBucket);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl transform transition-all max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Move "{item.name}"</h2>
            {currentBucket && currentBucket !== 'generated' && (
              <p className="text-xs text-gray-500 mt-0.5">From {getBucketDisplayName(currentBucket)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-4">Move to:</p>
          <div className="space-y-2">
            {availableBuckets.map((bucket) => (
              <button
                key={bucket.id}
                onClick={() => {
                  onMoveToBucket(bucket.id);
                  onClose();
                }}
                className={`w-full p-4 rounded-xl bg-gradient-to-r ${bucket.color} text-white font-medium shadow-md hover:shadow-lg transition-all active:scale-95`}
              >
                {bucket.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

