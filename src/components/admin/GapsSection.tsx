'use client';

import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle, Settings, Users, Target, FileText, Play, Shield, Sparkles } from 'lucide-react';

interface GapsSectionProps {
  gaps: string[];
  actionItems: string[];
  productSlug?: string;
  onAction?: (action: string, gap: string) => void;
}

const gapToAction: Record<string, { label: string; action: string; icon: React.ReactNode }> = {
  'Missing product promise': { 
    label: 'Generate', 
    action: 'generate-promise',
    icon: <Sparkles size={14} />
  },
  'Missing distributor hypothesis': { 
    label: 'Generate', 
    action: 'generate-distributor',
    icon: <Sparkles size={14} />
  },
  'Missing end-user definition': { 
    label: 'Generate', 
    action: 'generate-end_user',
    icon: <Sparkles size={14} />
  },
  'Missing friction/pain point': { 
    label: 'Generate', 
    action: 'generate-friction',
    icon: <Sparkles size={14} />
  },
  'No founder commitment to validate': { 
    label: 'Add', 
    action: 'add-commitment',
    icon: <Shield size={14} />
  },
  'hard gates': { 
    label: 'Run', 
    action: 'run-compliance',
    icon: <CheckCircle size={14} />
  },
  'Validation tests not yet run': { 
    label: 'Run', 
    action: 'run-tests',
    icon: <Play size={14} />
  },
  'Validation tests failed': { 
    label: 'Review', 
    action: 'review-failures',
    icon: <AlertCircle size={14} />
  },
  'Validation tests passed with warnings': { 
    label: 'Review', 
    action: 'review-warnings',
    icon: <AlertCircle size={14} />
  },
  'Not yet added to validation pipeline': { 
    label: 'Init', 
    action: 'initialize',
    icon: <Settings size={14} />
  },
};

export default function GapsSection({ gaps, actionItems, productSlug, onAction }: GapsSectionProps) {
  const getActionForGap = (gap: string) => {
    for (const [key, action] of Object.entries(gapToAction)) {
      if (gap.includes(key)) {
        return action;
      }
    }
    return null;
  };

  const handleClick = (action: string | undefined, gap: string) => {
    if (action && onAction) {
      onAction(action, gap);
    }
  };

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
              {gaps.map((gap, i) => {
                const action = getActionForGap(gap);
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-yellow-600 font-bold mt-0.5">•</span>
                    <span className="text-gray-700 flex-1">{gap}</span>
                    {action && (
                      <button
                        onClick={() => handleClick(action.action, gap)}
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium"
                      >
                        {action.icon}
                        {action.label}
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-700 mb-3">Next Steps</h3>
            <ol className="space-y-2">
              {actionItems.map((item, i) => {
                const action = getActionForGap(item);
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 mt-0.5 flex-1">{item}</span>
                    {action && (
                      <button
                        onClick={() => handleClick(action.action, item)}
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium"
                      >
                        {action.icon}
                        Do it
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
