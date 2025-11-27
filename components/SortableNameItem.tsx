'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Volume2 } from 'lucide-react';
import { NameItem } from '@/types';

interface SortableNameItemProps {
  item: NameItem;
  bucketId: string;
  onDelete: () => void;
  onClick?: (name: string) => void;
  onVoiceClick?: (name: string) => void;
}

export default function SortableNameItem({ item, bucketId, onDelete, onClick, onVoiceClick }: SortableNameItemProps) {
  const {
    attributes, 
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Show report and voice buttons for all buckets (including manually added names)
  const showAIButton = true;

  // Determine gender-based styling - matching Voice Analysis colors
  const getGenderStyles = () => {
    if (item.gender === 'Boy') {
      return 'bg-blue-500 border-blue-500 hover:bg-blue-600';
    } else if (item.gender === 'Girl') {
      return 'bg-pink-400 border-pink-400 hover:bg-pink-500';
    }
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`${getGenderStyles()} rounded-lg p-3 border transition-all flex items-center justify-between group shadow-sm hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div 
        {...listeners}
        className={`flex-1 cursor-grab active:cursor-grabbing ${item.gender ? 'text-white' : 'text-gray-900'}`}
      >
        <div className="font-medium">{item.name}</div>
        {item.inspiration && (
          <div className={`text-xs mt-0.5 ${item.gender ? 'text-white/80' : 'text-gray-600'}`}>
            {item.inspiration}
          </div>
        )}
      </div>
      {showAIButton && (
        <div className="flex items-center gap-1 ml-2">
          {onClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClick(item.name);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="p-1.5 hover:opacity-80 rounded flex-shrink-0 transition-opacity"
              aria-label="Request AI report"
              title="Get AI report for this name"
            >
              <FileText size={16} className="text-white" />
            </button>
          )}
          {onVoiceClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onVoiceClick(item.name);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="p-1.5 hover:opacity-80 rounded flex-shrink-0 transition-opacity"
              aria-label="Voice analysis"
              title="Listen to voice pronunciation"
            >
              <Volume2 size={16} className="text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
