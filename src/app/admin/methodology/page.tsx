'use client';

/**
 * /admin/methodology page
 * 
 * STUB - Phase 3+ (Not implemented in Phase 2)
 * Phase 2: Use /admin/pipeline instead for factory control
 * Phase 3: Will add public tour + request management
 */

import React from 'react';
import Link from 'next/link';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-4">Methodology</h1>
          <p className="text-slate-600 mb-6">
            Phase 3+ feature (not yet implemented in Phase 2)
          </p>
          <p className="text-slate-600 mb-6">
            For now, access the factory control center at:
          </p>
          <Link
            href="/admin/pipeline"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            → Go to Pipeline Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
