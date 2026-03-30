import { FEATURED_REVIEWS, REVIEW_STATS } from '@/lib/review-constants'
import Link from 'next/link'

export function ReviewsSection() {
  if (FEATURED_REVIEWS.length === 0) {
    return null // Don't show section if no reviews yet
  }
  
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            See what our clients are saying about Corporate AI Solutions
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {REVIEW_STATS.averageRating}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {REVIEW_STATS.fiveStarCount}
              </div>
              <div className="text-sm text-gray-600">5-Star Reviews</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {REVIEW_STATS.total}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
          </div>
        </div>
        
        {/* Featured Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {FEATURED_REVIEWS.slice(0, 6).map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>
              
              {/* Review Text */}
              <p className="text-gray-700 mb-4 italic">
                &ldquo;{review.reviewText}&rdquo;
              </p>
              
              {/* Client Info */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                {review.clientPhoto ? (
                  <img
                    src={review.clientPhoto}
                    alt={review.clientName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {review.clientName.charAt(0)}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="font-semibold">
                    {review.clientLinkedIn ? (
                      <a
                        href={review.clientLinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {review.clientName}
                      </a>
                    ) : (
                      review.clientName
                    )}
                  </div>
                  
                  {review.clientTitle && (
                    <div className="text-sm text-gray-600">
                      {review.clientTitle}
                      {review.clientCompany && ` at ${review.clientCompany}`}
                    </div>
                  )}
                  
                  {review.platformUsed && (
                    <div className="text-xs text-blue-600 mt-1">
                      {review.platformUsed}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <Link
            href="/submit-review"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Share Your Experience
          </Link>
        </div>
      </div>
    </section>
  )
}
