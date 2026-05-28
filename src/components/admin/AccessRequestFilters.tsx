'use client';

import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';

interface Props {
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' | 'contacted';
  onFilterStatusChange: (status: 'all' | 'pending' | 'approved' | 'rejected' | 'contacted') => void;
  sortBy: 'created_at' | 'contacted_at' | 'name';
  onSortByChange: (sortBy: 'created_at' | 'contacted_at' | 'name') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export default function AccessRequestFilters({
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Filter Status */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-500" />
        <select
          value={filterStatus}
          onChange={(e) =>
            onFilterStatusChange(
              e.target.value as 'all' | 'pending' | 'approved' | 'rejected' | 'contacted'
            )
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={16} className="text-gray-500" />
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as 'created_at' | 'contacted_at' | 'name')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="created_at">Newest First</option>
          <option value="contacted_at">Last Contacted</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Sort Order (hidden when sorted by name, always A-Z) */}
      {sortBy !== 'name' && (
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          title={sortOrder === 'asc' ? 'Ascending order' : 'Descending order'}
        >
          {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>
      )}
    </div>
  );
}
