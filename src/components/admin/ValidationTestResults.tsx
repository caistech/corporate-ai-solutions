'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface ValidationTestData {
  test_part_a_admin_portal?: 'passed' | 'warning' | 'failed' | 'not_run';
  test_part_b_user_portal?: 'passed' | 'warning' | 'failed' | 'not_run';
  test_part_c_auth_flows?: 'passed' | 'warning' | 'failed' | 'not_run';
  test_part_d_scaffold?: 'passed' | 'warning' | 'failed' | 'not_run';
  validation_test_status?: 'passed' | 'warning' | 'failed' | 'not_run';
  validation_test_findings?: string[];
  last_validation_test_run?: string | null;
}

interface ValidationTestResultsProps {
  validation: ValidationTestData | null;
  productName: string;
}

const partLabels: Record<string, string> = {
  test_part_a_admin_portal: 'A. Admin Portal',
  test_part_b_user_portal: 'B. User Portal',
  test_part_c_auth_flows: 'C. Auth Flows',
  test_part_d_scaffold: 'D. Scaffold & Metadata',
};

const partDescriptions: Record<string, string> = {
  test_part_a_admin_portal: 'Admin control panel: login, team management, product administration',
  test_part_b_user_portal: 'User-facing functional UI: core product experience',
  test_part_c_auth_flows: 'Sign-up, login, password reset, magic link — all four paths work',
  test_part_d_scaffold: 'Metadata, OG tags, favicon, responsive design, voice agent, settings page',
};

function PartBadge({ status, label }: { status: string | undefined; label: string }) {
  if (!status || status === 'not_run') {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
        <Clock size={18} className="text-gray-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">Not tested</p>
        </div>
      </div>
    );
  }

  const config = {
    passed: { bg: 'bg-green-50 border-green-200', icon: CheckCircle, iconColor: 'text-green-600', text: 'Passed' },
    warning: { bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-600', text: 'Warnings' },
    failed: { bg: 'bg-red-50 border-red-200', icon: XCircle, iconColor: 'text-red-600', text: 'Failed' },
  };

  const c = config[status as keyof typeof config] || config.failed;
  const Icon = c.icon;

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${c.bg}`}>
      <Icon size={18} className={`${c.iconColor} shrink-0`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-600">{c.text}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string | undefined | null }) {
  if (!status || status === 'not_run') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
        <Clock size={14} />
        Not Run
      </span>
    );
  }

  const config = {
    passed: { bg: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'All Tests Passed' },
    warning: { bg: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: 'Warnings' },
    failed: { bg: 'bg-red-100 text-red-700', icon: XCircle, label: 'Failed' },
  };

  const c = config[status as keyof typeof config] || config.failed;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${c.bg}`}>
      <Icon size={14} />
      {c.label}
    </span>
  );
}

export default function ValidationTestResults({ validation, productName }: ValidationTestResultsProps) {
  const [findingsOpen, setFindingsOpen] = useState(false);

  const findings: string[] = validation?.validation_test_findings || [];
  const testStatus = validation?.validation_test_status || 'not_run';

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Validation Test Results</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Automated audit checks against the product standards checklist. Each part tests a critical dimension of product quality.
            </p>
          </div>
          <StatusPill status={testStatus} />
        </div>

        {validation?.last_validation_test_run && (
          <p className="text-xs text-gray-400 mt-2">
            Last run: {new Date(validation.last_validation_test_run).toLocaleString()}
          </p>
        )}
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.keys(partLabels).map((key) => (
            <PartBadge
              key={key}
              status={validation?.[key as keyof ValidationTestData] as string | undefined}
              label={partLabels[key]}
            />
          ))}
        </div>

        {/* Part descriptions */}
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
            What each part checks
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-gray-500 ml-4 list-disc">
            {Object.entries(partDescriptions).map(([key, desc]) => (
              <li key={key}><span className="font-medium">{partLabels[key]}:</span> {desc}</li>
            ))}
          </ul>
        </details>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => setFindingsOpen(!findingsOpen)}
            className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {findingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {findings.length} Finding{findings.length !== 1 ? 's' : ''}
          </button>

          {findingsOpen && (
            <ul className="mt-2 space-y-1.5">
              {findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Action */}
      {(!testStatus || testStatus === 'not_run') && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-600">
            No validation tests have been run for {productName}. Run the test suite to populate results here.
          </p>
        </div>
      )}
    </div>
  );
}
