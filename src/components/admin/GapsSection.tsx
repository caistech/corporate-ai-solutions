'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface GapsSectionProps {
  gaps: string[];
  actionItems: string[];
}

export default function GapsSection({ gaps, actionItems }: GapsSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Gaps & Action Items</h2>

      {gaps.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm font-medium">✓ No gaps — ready for outreach!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-600" />
              Gaps to Fill ({gaps.length})
            </h3>
            <ul className="space-y-2">
              {gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-yellow-600 font-bold mt-0.5">•</span>
                  <span className="text-gray-700">{gap}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-700 mb-3">Next Steps</h3>
            <ol className="space-y-2">
              {actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 mt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
