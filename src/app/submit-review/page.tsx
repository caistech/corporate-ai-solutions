// @explanatory-header-exempt — nested workflow page (client review submission form); entry-point header lives on the parent surface
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SubmitReviewPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientTitle: '',
    clientCompany: '',
    clientLinkedIn: '',
    reviewText: '',
    rating: 5,
    platformUsed: '',
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    try {
      const { error: submitError } = await supabase
        .from('client_reviews')
        .insert({
          client_name: formData.clientName,
          client_title: formData.clientTitle || null,
          client_company: formData.clientCompany || null,
          client_linkedin_url: formData.clientLinkedIn || null,
          review_text: formData.reviewText,
          rating: formData.rating,
          platform_used: formData.platformUsed || null,
          source: 'form',
          status: 'pending',
        })
      
      if (submitError) throw submitError
      
      setSubmitted(true)
    } catch (err) {
      console.error('Review submission error:', err)
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            Your review has been submitted and will appear on our website once approved.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Share Your Experience</h1>
          <p className="text-gray-600 mb-8">
            We&apos;d love to hear about your experience with Corporate AI Solutions.
            Your feedback helps us improve and helps others make informed decisions.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
              />
            </div>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Title
              </label>
              <input
                type="text"
                value={formData.clientTitle}
                onChange={(e) => setFormData({ ...formData, clientTitle: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="CEO, Founder, etc."
              />
            </div>
            
            {/* Company */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.clientCompany}
                onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Acme Corp"
              />
            </div>
            
            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium mb-1">
                LinkedIn Profile (optional)
              </label>
              <input
                type="url"
                value={formData.clientLinkedIn}
                onChange={(e) => setFormData({ ...formData, clientLinkedIn: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            
            {/* Platform Used */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Which platform did you use?
              </label>
              <select
                value={formData.platformUsed}
                onChange={(e) => setFormData({ ...formData, platformUsed: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a platform</option>
                <option value="Rehearsals AI">Rehearsals AI</option>
                <option value="Checkpoint">Checkpoint</option>
                <option value="Storefront MCP">Storefront MCP</option>
                <option value="DealFindrs">DealFindrs</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="text-3xl focus:outline-none"
                  >
                    {star <= formData.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.reviewText}
                onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about your experience..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 50 characters. Be specific about what you liked!
              </p>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={submitting || formData.reviewText.length < 50}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
