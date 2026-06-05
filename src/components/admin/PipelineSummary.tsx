'use client';

/**
 * Pipeline Summary Stats
 * 
 * Shows high-level overview:
 * - Total products in portfolio
 * - Ready for outreach (GREEN)
 * - In progress (YELLOW)
 * - Draft/not started (GRAY)
 * - Average readiness score
 */

interface PipelineSummaryProps {
  summary: {
    total: number;
    ready_for_outreach: number;
    in_progress: number;
    draft: number;
    paused: number;
    not_started: number;
    average_readiness: number;
  };
}

export default function PipelineSummary({ summary }: PipelineSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Ready for Outreach */}
      <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Ready for Outreach</p>
            <p className="text-4xl font-bold text-green-400 mt-2">{summary.ready_for_outreach}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.total} total</p>
          </div>
          <div className="text-4xl">🟢</div>
        </div>
      </div>

      {/* In Progress */}
      <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-yellow-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">In Progress</p>
            <p className="text-4xl font-bold text-yellow-400 mt-2">{summary.in_progress}</p>
            <p className="text-xs text-gray-500 mt-1">Filling gaps</p>
          </div>
          <div className="text-4xl">🟡</div>
        </div>
      </div>

      {/* Draft / Not Started */}
      <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Draft / Not Started</p>
            <p className="text-4xl font-bold text-gray-500 mt-2">{summary.draft + summary.not_started}</p>
            <p className="text-xs text-gray-500 mt-1">Paused: {summary.paused}</p>
          </div>
          <div className="text-4xl">⚪</div>
        </div>
      </div>

      {/* Average Readiness */}
      <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Average Readiness</p>
            <p className="text-4xl font-bold text-blue-400 mt-2">{summary.average_readiness}%</p>
            <p className="text-xs text-gray-500 mt-1">Portfolio-wide</p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>
    </div>
  );
}
