'use client';

import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertTriangle, Loader2, Wrench } from 'lucide-react';

interface Test {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  findings?: string[];
}

interface ValidationTestRunnerProps {
  tests: Test[];
  onRunTest: (testId: string) => Promise<{ status: string; findings?: string[] }>;
  onFixTest?: (testId: string) => Promise<{ status: string; findings?: string[] }>;
}

export default function ValidationTestRunner({ tests, onRunTest, onFixTest }: ValidationTestRunnerProps) {
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [fixingTest, setFixingTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, Test>>(tests.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}));

  const handleRunTest = async (testId: string) => {
    setRunningTest(testId);
    try {
      const result = await onRunTest(testId);
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          ...prev[testId],
          status: result.status as Test['status'],
          findings: result.findings || []
        }
      }));
    } catch (err) {
      console.error('Test failed:', err);
      setTestResults(prev => ({
        ...prev,
        [testId]: { ...prev[testId], status: 'failed', findings: ['Test execution failed'] }
      }));
    } finally {
      setRunningTest(null);
    }
  };

  const handleFixTest = async (testId: string) => {
    if (!onFixTest) return;
    setFixingTest(testId);
    try {
      const result = await onFixTest(testId);
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          ...prev[testId],
          status: result.status as Test['status'],
          findings: result.findings || []
        }
      }));
    } catch (err) {
      console.error('Fix failed:', err);
    } finally {
      setFixingTest(null);
    }
  };

  const allPassed = Object.values(testResults).every(t => t.status === 'passed');

  return (
    <div className="space-y-4">
      {Object.values(testResults).map((test) => (
        <div key={test.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {test.status === 'passed' && <CheckCircle className="text-green-600" size={20} />}
              {test.status === 'failed' && <XCircle className="text-red-600" size={20} />}
              {test.status === 'warning' && <AlertTriangle className="text-yellow-600" size={20} />}
              {test.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
              {test.status === 'running' && <Loader2 className="text-blue-600 animate-spin" size={20} />}
              
              <div>
                <h4 className="font-medium text-gray-900">{test.name}</h4>
                <p className="text-sm text-gray-500">{test.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {test.status === 'pending' || test.status === 'failed' || test.status === 'warning' ? (
                <button
                  onClick={() => handleRunTest(test.id)}
                  disabled={runningTest === test.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {runningTest === test.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Run Test
                </button>
              ) : null}

              {test.status === 'failed' && onFixTest && (
                <button
                  onClick={() => handleFixTest(test.id)}
                  disabled={fixingTest === test.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {fixingTest === test.id ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                  Fix Now
                </button>
              )}
            </div>
          </div>

          {test.findings && test.findings.length > 0 && (
            <div className="mt-3 pl-8">
              <div className="text-sm text-red-600 font-medium">Findings:</div>
              <ul className="text-sm text-red-500 list-disc list-inside">
                {test.findings.map((finding, i) => (
                  <li key={i}>{finding}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {allPassed && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="text-green-600" size={20} />
          <span className="text-green-700 font-medium">All tests passed! Ready to proceed.</span>
        </div>
      )}
    </div>
  );
}
