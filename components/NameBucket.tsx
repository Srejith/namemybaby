'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import SortableNameItem from './SortableNameItem';
import { NameItem } from '@/types';
import { Plus, X } from 'lucide-react';

interface NameBucketProps {
  title: string;
  bucketId: string;
  names: NameItem[];
  onAddName: (bucket: string, name: string) => void;
  onDeleteName: (bucket: string, id: string) => void;
  onClick?: (name: string) => void;
  onVoiceClick?: (name: string) => void;
  color: 'green' | 'yellow' | 'red';
}

const colorClasses = {
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
    border: 'border-emerald-200/60',
    header: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm',
    headerBadge: 'bg-white/20 text-white/90',
    addButton: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg',
    emptyState: 'text-emerald-600/60',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50',
    border: 'border-amber-200/60',
    header: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm',
    headerBadge: 'bg-white/20 text-white/90',
    addButton: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg',
    emptyState: 'text-amber-600/60',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-50 via-red-50 to-pink-50',
    border: 'border-rose-200/60',
    header: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm',
    headerBadge: 'bg-white/20 text-white/90',
    addButton: 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg',
    emptyState: 'text-rose-600/60',
  },
};

export default function NameBucket({
  title,
  bucketId,
  names,
  onAddName,
  onDeleteName,
  onClick,
  onVoiceClick,
  color,
}: NameBucketProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: bucketId,
  });

  const colors = colorClasses[color];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddName(bucketId, newName);
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border ${colors.border} ${colors.bg} ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg' : 'shadow-md'
      } flex flex-col h-full overflow-hidden backdrop-blur-sm transition-all duration-200`}
    >
      {/* Modern Header */}
      <div className={`${colors.header} px-5 py-4 flex items-center justify-between backdrop-blur-sm`}>
        <h2 className="font-semibold text-base tracking-tight">{title}</h2>
        <span className={`${colors.headerBadge} px-2.5 py-1 rounded-full text-xs font-medium`}>
          {names.length}
        </span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        <SortableContext items={names.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          {names.map((item) => (
            <SortableNameItem
              key={item.id}
              item={item}
              bucketId={bucketId}
              onDelete={() => onDeleteName(bucketId, item.id)}
              onClick={onClick}
              onVoiceClick={onVoiceClick}
            />
          ))}
        </SortableContext>

        {names.length === 0 && (
          <div className={`text-center ${colors.emptyState} py-12 text-sm font-medium`}>
            <p className="mb-1">No names yet</p>
            <p className="text-xs font-normal">Drag names here or add manually</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm transition-all"
              autoFocus
              onBlur={() => {
                if (!newName.trim()) {
                  setIsAdding(false);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className={`flex-1 ${colors.addButton} px-4 py-2.5 rounded-lg text-sm font-medium transition-all`}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewName('');
                  setIsAdding(false);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className={`w-full ${colors.addButton} px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
          >
            <Plus size={18} />
            Add Name Manually
          </button>
        )}
      </div>
    </div>
  );
}
