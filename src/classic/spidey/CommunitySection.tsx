import React from 'react';
import { AlertCircle, MapPin, Clock, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import WebPattern from './WebPattern';
import useNYC311, { NYC311Report } from '../../hooks/useNYC311';

const BOROUGH_EMOJI: Record<string, string> = {
  MANHATTAN: '\uD83C\uDFD9\uFE0F',
  BROOKLYN: '\uD83C\uDF09',
  QUEENS: '\uD83D\uDE95',
  BRONX: '\uD83C\uDFDF\uFE0F',
  'STATEN ISLAND': '\u26F4\uFE0F',
};

const STATUS_STYLE: Record<string, string> = {
  Open: 'bg-red-600/20 text-red-400 border-red-600/40',
  Assigned: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
  Pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
  Closed: 'bg-green-600/20 text-green-400 border-green-600/40',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const CommunitySection: React.FC = () => {
  const { reports, isLoading, error, refetch } = useNYC311(5);

  return (
    <div className="bg-black border-2 border-red-600 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.3)] p-6 relative overflow-hidden">
      <WebPattern />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-2xl font-black flex items-center gap-2 text-white tracking-wider">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <span className="text-red-600">&gt;&gt;</span> NYC 311 REPORTS
        </h2>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-2 hover:bg-red-600/20 rounded-lg transition border border-transparent hover:border-red-600 cursor-pointer disabled:opacity-50"
          aria-label="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 text-red-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading */}
      {isLoading && reports.length === 0 && (
        <div className="flex items-center justify-center py-8 gap-3 relative z-10">
          <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          <span className="text-red-400 font-mono text-xs">SCANNING NYC FEEDS...</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 py-4 justify-center relative z-10">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-400 font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Reports */}
      {reports.length > 0 && (
        <div className="space-y-3 relative z-10">
          {reports.map((report) => (
            <ReportCard key={report.unique_key} report={report} />
          ))}
        </div>
      )}

      <div className="mt-4 text-center relative z-10">
        <span className="text-gray-600 font-mono text-[10px]">
          LIVE DATA FROM NYC OPEN DATA 311
        </span>
      </div>
    </div>
  );
};

const ReportCard: React.FC<{ report: NYC311Report }> = ({ report }) => {
  const emoji = BOROUGH_EMOJI[report.borough] || '\uD83D\uDCCD';
  const statusClass = STATUS_STYLE[report.status] || STATUS_STYLE.Open;

  return (
    <div className="border border-red-600/30 rounded-lg p-4 hover:border-red-600 hover:bg-white/5 transition backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-white rounded-full flex items-center justify-center text-lg border-2 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex-shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-sm text-white font-mono truncate">
              {report.complaint_type}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusClass}`}>
              {report.status.toUpperCase()}
            </span>
          </div>
          {report.descriptor && (
            <p className="text-gray-300 text-sm mb-2 line-clamp-2">{report.descriptor}</p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono flex-wrap">
            {report.incident_address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" />
                <span className="truncate max-w-[150px]">{report.incident_address}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" />
              {timeAgo(report.created_date)}
            </span>
            <span className="text-red-400">{report.borough}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunitySection;
