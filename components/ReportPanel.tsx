'use client';

import { X, Loader2 } from 'lucide-react';

interface ReportPanelProps {
  name: string;
  reportContent: string | null;
  isLoading: boolean;
  onClose: () => void;
}

// Simple markdown to HTML converter
const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-gray-900">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-gray-900">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-gray-700">$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-3 rounded text-sm font-mono text-gray-800 mb-4 overflow-x-auto"><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li class="text-gray-700 mb-1">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="text-gray-700 mb-1">$1</li>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="text-gray-700 mb-1">$1</li>');

  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/(<li class="text-gray-700 mb-1">.*<\/li>\n?)+/gim, (match) => {
    return '<ul class="list-disc list-inside mb-4 space-y-2">' + match + '</ul>';
  });

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4">$1</blockquote>');

  // Paragraphs (convert double newlines to paragraphs)
  html = html.split('\n\n').map(para => {
    if (!para.trim()) return '';
    if (para.startsWith('<') && para.endsWith('>')) return para; // Already HTML
    return `<p class="mb-4 text-gray-700 leading-relaxed">${para.trim()}</p>`;
  }).join('');

  // Convert single newlines to <br>
  html = html.replace(/\n/g, '<br />');

  return html;
};

export default function ReportPanel({ name, reportContent, isLoading, onClose }: ReportPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Close panel"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
              <p className="text-gray-600">Generating report...</p>
            </div>
          </div>
        ) : reportContent ? (
          <div className="prose prose-sm max-w-none">
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(reportContent) }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No report content available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
