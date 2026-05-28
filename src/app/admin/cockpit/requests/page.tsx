'use client';

/**
 * /admin/cockpit/requests page
 * 
 * Admin interface for managing access requests to the methodology cockpit.
 * - View all requests with filtering/sorting
 * - Update status (pending → contacted → approved/rejected)
 * - Add notes about each request
 * - Bulk mark as contacted
 */

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import AccessRequestsTable from '@/components/admin/AccessRequestsTable';
import AccessRequestFilters from '@/components/admin/AccessRequestFilters';

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

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'contacted'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'contacted_at' | 'name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch access requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('validation_access_requests')
          .select('*');

        // Apply status filter
        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
        }

        // Apply sort
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setRequests(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, sortBy, sortOrder]);

  // Handle status update
  const handleStatusUpdate = async (id: string, newStatus: AccessRequest['status']) => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      // If changing to 'contacted', set contacted_at
      if (newStatus === 'contacted') {
        updateData.contacted_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('validation_access_requests')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? { ...req, status: newStatus, contacted_at: newStatus === 'contacted' ? new Date().toISOString() : req.contacted_at }
            : req
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Handle notes update
  const handleNotesUpdate = async (id: string, notes: string) => {
    try {
      const { error: updateError } = await supabase
        .from('validation_access_requests')
        .update({ notes })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, notes } : req
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
    }
  };

  // Bulk mark as contacted
  const handleMarkAllContacted = async () => {
    try {
      const pendingIds = requests
        .filter((r) => r.status === 'pending')
        .map((r) => r.id);

      if (pendingIds.length === 0) {
        setError('No pending requests to mark as contacted');
        return;
      }

      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('validation_access_requests')
        .update({
          status: 'contacted',
          contacted_at: now,
        })
        .in('id', pendingIds);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          pendingIds.includes(req.id)
            ? { ...req, status: 'contacted', contacted_at: now }
            : req
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update requests');
    }
  };

  // Count pending requests
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const contactedCount = requests.filter((r) => r.status === 'contacted').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Header */}
         <div className="mb-8">
           <h1 className="text-3xl font-bold mb-2">Access Requests</h1>
           <p className="text-slate-600">Manage public requests for methodology cockpit access. Approved users gain full access to validate products and run outreach.</p>
         </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Contacted</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{contactedCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📞</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{approvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Filters & Bulk Actions */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <AccessRequestFilters
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />

            {pendingCount > 0 && (
              <button
                onClick={handleMarkAllContacted}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Mark {pendingCount} as Contacted
              </button>
            )}
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-2">No access requests yet</p>
              <p className="text-gray-400 text-sm">Check back later or promote the public tour</p>
            </div>
          ) : (
            <AccessRequestsTable
              requests={requests}
              onStatusUpdate={handleStatusUpdate}
              onNotesUpdate={handleNotesUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
