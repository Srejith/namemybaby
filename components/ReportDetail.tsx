'use client';

import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import { NameReport } from '@/lib/reports';

interface ReportDetailProps {
  report: NameReport;
  onBack: () => void;
}

// Simple markdown to HTML converter (same as ReportPanel)
const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Headers - process from most specific (more #) to least specific (fewer #)
  // h6
  html = html.replace(/^###### (.*$)/gim, '<h6 class="text-sm font-bold mt-3 mb-1 text-gray-900">$1</h6>');
  // h5
  html = html.replace(/^##### (.*$)/gim, '<h5 class="text-base font-bold mt-3 mb-1.5 text-gray-900">$1</h5>');
  // h4
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-bold mt-3 mb-2 text-gray-900">$1</h4>');
  // h3
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-gray-900">$1</h3>');
  // h2
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-gray-900">$1</h2>');
  // h1
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
  // Split by double newlines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    
    // Check if it's already HTML (headers h1-h6, lists, blockquotes, etc.)
    if (trimmed.match(/^<h[1-6]/) || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<li') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<pre') || trimmed.startsWith('<a href')) {
      return trimmed;
    }
    
    return `<p class="mb-4 text-gray-700 leading-relaxed">${trimmed}</p>`;
  }).join('');

  return html;
};

export default function ReportDetail({ report, onBack }: ReportDetailProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full bg-gray-100 flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Back to reports list"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="text-gray-400" size={14} />
            <span className="text-sm text-gray-500">{formatDate(report.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 flex items-center gap-2 text-gray-600">
            <FileText size={18} />
            <h2 className="font-semibold">Report</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="prose prose-sm max-w-none">
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(report.report_content) }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

