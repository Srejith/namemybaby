'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Menu, X } from 'lucide-react';

interface TopHeaderProps {
  onMenuToggle?: () => void;
  leftSidebarExpanded?: boolean;
}

export default function TopHeader({ onMenuToggle, leftSidebarExpanded = false }: TopHeaderProps) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left side: Hamburger icon, Product icon, and Product name */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Icon */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={leftSidebarExpanded ? 'Collapse menu' : 'Expand menu'}
          >
            {leftSidebarExpanded ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
          </button>
        )}
        
        {/* Product Icon */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-6 h-6">
              <path d="M9 12h.01"></path>
              <path d="M15 12h.01"></path>
              <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"></path>
              <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"></path>
            </svg>
          </div>
          {/* Product Name */}
          <h1 className="text-xl font-bold text-gray-900">Name My Baby</h1>
        </div>
      </div>

      {/* Right side: User info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.email || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User size={20} className="text-gray-600" />
          )}
          <span className="text-sm text-gray-700 font-medium">
            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>
    </div>
  );
}

