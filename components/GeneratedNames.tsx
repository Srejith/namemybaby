'use client';

import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Sparkles, ChevronDown, Lightbulb, Baby } from 'lucide-react';
import { NameItem } from '@/types';

interface DraggableNameItemProps {
  item: NameItem;
}

function DraggableNameItem({ item }: DraggableNameItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Determine gender-based styling
  const getGenderStyles = () => {
    if (item.gender === 'Boy') {
      return 'bg-blue-500 border-blue-500 hover:bg-blue-600';
    } else if (item.gender === 'Girl') {
      return 'bg-pink-400 border-pink-400 hover:bg-pink-500';
    }
    return 'bg-gray-100 border-gray-200 hover:bg-gray-200';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${getGenderStyles()} rounded-lg p-3 border transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span className={`font-medium text-white`}>{item.name}</span>
    </div>
  );
}

interface GeneratedNamesProps {
  names: NameItem[];
  onGenerateForBoy?: () => void;
  onGenerateForGirl?: () => void;
  onGenerateIdeasClick?: () => void;
  isGeneratingNames?: boolean;
  isGeneratingIdeas?: boolean;
  babyGender?: 'Boy' | 'Girl' | "I don't know yet";
}

export default function GeneratedNames({ names, onGenerateForBoy, onGenerateForGirl, onGenerateIdeasClick, isGeneratingNames = false, isGeneratingIdeas = false, babyGender }: GeneratedNamesProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-purple-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-900">Baby Names for your Little One</h2>
        <span className="text-sm text-gray-500">({names.length})</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Drag names below into one of the buckets to organize them
      </p>
      <div className="flex flex-wrap gap-2">
        {names.length > 0 ? (
          names.map((item) => (
            <DraggableNameItem key={item.id} item={item} />
          ))
        ) : (
          <div className="text-gray-400 text-sm py-4">
            No generated names yet. Use the AI chat to generate names.
          </div>
        )}
      </div>
      
      {/* Action buttons at bottom left */}
      <div className="flex items-center justify-start gap-2 mt-4 pt-3 border-t border-gray-200">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              // If gender is set to Boy or Girl, directly invoke the corresponding function
              if (babyGender === 'Boy' && onGenerateForBoy) {
                onGenerateForBoy();
              } else if (babyGender === 'Girl' && onGenerateForGirl) {
                onGenerateForGirl();
              } else {
                // If gender is "I don't know yet" or not set, show dropdown
                setDropdownOpen(!dropdownOpen);
              }
            }}
            disabled={isGeneratingNames}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-lg hover:from-blue-600 hover:to-pink-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingNames ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <Baby size={16} />
                <span>Generate names</span>
                {(babyGender === "I don't know yet" || !babyGender) && (
                  <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </>
            )}
          </button>
          
          {(babyGender === "I don't know yet" || !babyGender) && dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => {
                  onGenerateForBoy?.();
                  setDropdownOpen(false);
                }}
                disabled={isGeneratingNames}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium">For my prince</span>
              </button>
              <button
                onClick={() => {
                  onGenerateForGirl?.();
                  setDropdownOpen(false);
                }}
                disabled={isGeneratingNames}
                className="w-full text-left px-4 py-2 hover:bg-pink-50 text-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium">For my princess</span>
              </button>
            </div>
          )}
        </div>
        {onGenerateIdeasClick && (
          <button
            onClick={onGenerateIdeasClick}
            disabled={isGeneratingIdeas}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingIdeas ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <Lightbulb size={16} />
                Generate Ideas
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

