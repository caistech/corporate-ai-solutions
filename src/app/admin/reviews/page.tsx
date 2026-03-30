'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Review {
  id: string
  client_name: string
  client_company: string | null
  review_text: string
  rating: number
  platform_used: string | null
  status: string
  source: string
  created_at: string
  featured: boolean
}

export default function AdminReviewsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadReviews()
  }, [filter])
  
  async function loadReviews() {
    setLoading(true)
    
    let query = supabase
      .from('client_reviews')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }
    
    const { data, error } = await query
    
    if (!error && data) {
      setReviews(data)
    }
    
    setLoading(false)
  }
  
  async function updateReview(id: string, updates: Partial<Review>) {
    const { error } = await supabase
      .from('client_reviews')
      .update(updates)
      .eq('id', id)
    
    if (!error) {
      loadReviews()
      
      // If approving, trigger sync
      if (updates.status === 'approved') {
        await fetch('/api/sync-reviews', { method: 'POST' })
      }
    }
  }
  
  async function toggleFeatured(id: string, currentState: boolean) {
    await updateReview(id, { featured: !currentState })
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Review Moderation</h1>
          <button
            onClick={() => fetch('/api/sync-reviews', { method: 'POST' })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sync to Website
          </button>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Reviews list */}
        {loading ? (
          <div className="text-center py-12">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {filter !== 'all' && filter} reviews found
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{review.client_name}</h3>
                    {review.client_company && (
                      <p className="text-gray-600">{review.client_company}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {'⭐'.repeat(review.rating)}
                      </div>
                      {review.platform_used && (
                        <span className="text-sm text-gray-500">
                          · {review.platform_used}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        · {review.source}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        review.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : review.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {review.status}
                    </span>
                    
                    {review.featured && (
                      <span className="px-3 py-1 rounded text-sm bg-purple-100 text-purple-800">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {review.review_text}
                </p>
                
                <div className="text-xs text-gray-500 mb-4">
                  Submitted: {new Date(review.created_at).toLocaleString()}
                </div>
                
                {/* Actions */}
                {review.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateReview(review.id, { status: 'approved' })}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => updateReview(review.id, { status: 'rejected' })}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
                
                {review.status === 'approved' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFeatured(review.id, review.featured)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      {review.featured ? 'Unfeature' : '⭐ Feature on Homepage'}
                    </button>
                    <button
                      onClick={() => updateReview(review.id, { status: 'archived' })}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Archive
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
