'use client';

import { useEffect, useState } from 'react';
import { FileText, X, Calendar, Search } from 'lucide-react';
import { NameReport, loadReports, deleteReport } from '@/lib/reports';

interface ReportsListProps {
  userId: string;
  onViewReport: (report: NameReport) => void;
  onClose: () => void;
}

export default function ReportsList({ userId, onViewReport, onClose }: ReportsListProps) {
  const [reports, setReports] = useState<NameReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportsList();
  }, [userId]);

  const loadReportsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadReports(userId);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteReport(reportId, userId);
      setReports(reports.filter((r) => r.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Failed to delete report. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-gray-100 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="text-gray-600" size={20} />
          <h2 className="font-semibold text-gray-900">Name Reports</h2>
          <span className="text-sm text-gray-500">({reports.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Close reports"
        >
          <X size={18} className="text-gray-600" />
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading reports...</p>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <FileText className="text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium mb-1">
              {searchQuery ? 'No reports found' : 'No reports yet'}
            </p>
            <p className="text-sm text-gray-400">
              {searchQuery
                ? 'Try a different search term'
                : 'Generate reports for names to see them here'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onViewReport(report)}
                className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{report.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="text-gray-400" size={12} />
                      <span className="text-xs text-gray-500">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {report.report_content.substring(0, 100)}
                      {report.report_content.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    aria-label="Delete report"
                  >
                    <X size={14} className="text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

