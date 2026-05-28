'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  contacted_by: string | null;
}

interface Props {
  requests: AccessRequest[];
  onStatusUpdate: (id: string, newStatus: AccessRequest['status']) => Promise<void>;
  onNotesUpdate: (id: string, notes: string) => Promise<void>;
}

export default function AccessRequestsTable({ requests, onStatusUpdate, onNotesUpdate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const statusColors: Record<AccessRequest['status'], string> = {
    pending: 'bg-yellow-50 border-yellow-200',
    contacted: 'bg-blue-50 border-blue-200',
    approved: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
  };

  const statusBadgeColors: Record<AccessRequest['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const handleStatusClick = async (id: string, currentStatus: AccessRequest['status']) => {
    const statuses: AccessRequest['status'][] = ['pending', 'contacted', 'approved', 'rejected'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    await onStatusUpdate(id, nextStatus);
  };

  const handleSaveNotes = async (id: string) => {
    setSavingId(id);
    try {
      await onNotesUpdate(id, editingNotes);
      setEditingNotesId(null);
      setEditingNotes('');
    } finally {
      setSavingId(null);
    }
  };

  const handleStartEditingNotes = (request: AccessRequest) => {
    setEditingNotesId(request.id);
    setEditingNotes(request.notes || '');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Name</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Company</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Role</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Submitted</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <React.Fragment key={request.id}>
              {/* Main Row */}
              <tr
                className={`border-b border-gray-200 transition-colors hover:bg-gray-50 cursor-pointer ${
                  statusColors[request.status]
                }`}
                onClick={() =>
                  setExpandedId(expandedId === request.id ? null : request.id)
                }
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        expandedId === request.id ? 'rotate-180' : ''
                      }`}
                    />
                    <span className="font-medium text-gray-900">{request.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{request.company}</td>
                <td className="px-6 py-4 text-gray-600">{request.role}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${
                      statusBadgeColors[request.status]
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusClick(request.id, request.status);
                    }}
                    title="Click to cycle status"
                  >
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                  {formatDistanceToNow(new Date(request.created_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditingNotes(request);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"
                  >
                    Add Notes
                  </button>
                </td>
              </tr>

              {/* Expanded Row */}
              {expandedId === request.id && (
                <tr className={statusColors[request.status]}>
                  <td colSpan={6} className="px-6 py-4">
                    <div className="space-y-4">
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                            Email
                          </label>
                          <a
                            href={`mailto:${request.email}`}
                            className="text-indigo-600 hover:text-indigo-700 break-all"
                          >
                            {request.email}
                          </a>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                            Company
                          </label>
                          <p className="text-gray-900">{request.company}</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                            Submitted
                          </label>
                          <p className="text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()} at{' '}
                            {new Date(request.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {request.contacted_at && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                              Contacted
                            </label>
                            <p className="text-gray-900">
                              {new Date(request.contacted_at).toLocaleDateString()} at{' '}
                              {new Date(request.contacted_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Notes Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          Notes
                        </label>
                        {editingNotesId === request.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingNotes}
                              onChange={(e) => setEditingNotes(e.target.value)}
                              placeholder="Add notes about this request..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveNotes(request.id);
                                }}
                                disabled={savingId === request.id}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {savingId === request.id ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingNotesId(null);
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {request.notes || (
                              <span className="text-gray-400 italic">No notes yet</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
