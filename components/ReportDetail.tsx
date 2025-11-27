'use client';

import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import { NameReport } from '@/lib/reports';

interface ReportDetailProps {
  report: NameReport;
  onBack: () => void;
}

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
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {report.report_content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

