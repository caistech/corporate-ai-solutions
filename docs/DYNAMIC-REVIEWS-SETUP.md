# Dynamic Client Reviews System - Implementation Guide

**Status:** Ready to implement  
**Estimated time:** 2-3 hours setup, then fully automated  
**Cost:** $0 (uses existing Supabase/Vercel)

---

## Overview

Clients submit reviews via **web form** or **voice agent**, you **moderate in admin panel**, and approved reviews **automatically publish** to website.

```
Client → Form/Voice → Supabase → Admin approves → Auto-sync → Website updates
```

---

## Implementation Steps

### Step 1: Database Setup (5 minutes)

```bash
cd Corporate-AI-Solutions

# Run migration
npx supabase migration up
# or manually run: supabase/migrations/20260328_client_reviews.sql
```

**Verify:**
```sql
SELECT * FROM client_reviews; -- Should be empty table
```

---

### Step 2: Add Sync Script to package.json (1 minute)

```json
// package.json
{
  "scripts": {
    "sync-reviews": "ts-node scripts/sync-reviews.ts",
    // ... existing scripts
  }
}
```

---

### Step 3: Set Environment Variables (2 minutes)

```bash
# .env.local (add these)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase
OPENAI_API_KEY=your_openai_key_for_whisper  # Only if using voice reviews
```

---

### Step 4: Add Reviews to Homepage (5 minutes)

```typescript
// src/app/page.tsx

import { ReviewsSection } from '@/components/ReviewsSection'

export default function HomePage() {
  return (
    <>
      {/* ... existing content ... */}
      
      <ReviewsSection />  {/* Add this */}
      
      {/* ... rest of page ... */}
    </>
  )
}
```

---

### Step 5: Test Locally (10 minutes)

**5.1 Submit a test review:**
- Go to: http://localhost:3000/submit-review
- Fill in form with test data
- Submit

**5.2 Check database:**
```sql
SELECT * FROM client_reviews WHERE status = 'pending';
```

**5.3 Moderate review:**
- Go to: http://localhost:3000/admin/reviews
- Approve the test review
- Mark it as "featured"

**5.4 Sync to constants:**
```bash
npm run sync-reviews
```

**5.5 Verify file updated:**
```bash
cat src/lib/review-constants.ts
# Should contain your test review
```

**5.6 Check homepage:**
- Refresh: http://localhost:3000
- Should see "Trusted by Industry Leaders" section
- Should see your test review

---

### Step 6: Set Up GitHub Actions (10 minutes)

**6.1 Add GitHub secrets:**
Go to: https://github.com/dennissolver/corporate-ai-solutions/settings/secrets/actions

Add:
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_DEPLOY_HOOK` (from Vercel → Settings → Deploy Hooks)

**6.2 Test workflow:**
```bash
git add .
git commit -m "feat: add dynamic reviews system"
git push
```

Go to: GitHub → Actions → "Sync Reviews to Website"  
Click "Run workflow" manually to test.

---

### Step 7: Voice Agent Integration (Optional, 30 minutes)

**If using ElevenLabs voice agent:**

**7.1 Create voice agent script:**
```
Hi, thank you for calling Corporate AI Solutions! 
We'd love to hear your feedback about our services.

Can you tell me your name please?
[Wait for response]

And which of our platforms did you use?
[Options: Rehearsals AI, Checkpoint, Store MCP, DealFindrs, Other]

On a scale of 1 to 5 stars, how would you rate your experience?
[Wait for number]

Great! Can you tell me more about your experience? 
What did you like most?
[Wait for response]

Thank you so much for your feedback! 
Your review will be published on our website shortly.
```

**7.2 Configure ElevenLabs webhook:**
- Webhook URL: `https://your-domain.com/api/voice-review`
- Include: recording_url, transcript, call_metadata

**7.3 Test voice flow:**
- Call the ElevenLabs number
- Complete the review
- Check: http://localhost:3000/admin/reviews
- Should see voice review (source = "voice")

---

## Usage Workflows

### Client Submits Review (Web Form)

1. Client goes to `/submit-review`
2. Fills form (name, company, rating, review text)
3. Submits → Stored in Supabase as `status='pending'`
4. You get notification (optional email/Slack)

### Client Leaves Voice Review

1. Client calls ElevenLabs phone number
2. Voice agent collects: name, platform, rating, feedback
3. Recording + transcript sent to `/api/voice-review`
4. Stored in Supabase as `status='pending', source='voice'`

### You Moderate Reviews

1. Visit `/admin/reviews`
2. See all pending reviews
3. Click "Approve" or "Reject"
4. Optionally mark as "Featured" (shows on homepage)
5. On approval → Webhook triggers sync

### Auto-Sync to Website

**Trigger:** Review approval  
**Process:**
1. GitHub Actions runs `sync-reviews.ts`
2. Fetches all approved reviews from Supabase
3. Updates `src/lib/review-constants.ts`
4. Commits to Git
5. Triggers Vercel deployment
6. Website updates with new review (2-3 minutes)

**Also runs:**
- Daily at midnight (scheduled)
- Manual trigger (GitHub Actions UI)

---

## File Structure

```
Corporate-AI-Solutions/
├── supabase/migrations/
│   └── 20260328_client_reviews.sql       # Database schema
│
├── src/
│   ├── lib/
│   │   └── review-constants.ts            # AUTO-GENERATED reviews
│   │
│   ├── components/
│   │   └── ReviewsSection.tsx             # Homepage display
│   │
│   ├── app/
│   │   ├── submit-review/
│   │   │   └── page.tsx                   # Public form
│   │   │
│   │   ├── admin/reviews/
│   │   │   └── page.tsx                   # Moderation panel
│   │   │
│   │   └── api/
│   │       └── voice-review/
│   │           └── route.ts               # Voice webhook
│   │
│   └── scripts/
│       └── sync-reviews.ts                # Sync script
│
└── .github/workflows/
    └── sync-reviews.yml                   # Auto-deployment
```

---

## Advanced Features

### Feature 1: Email Notifications

```typescript
// scripts/sync-reviews.ts (add to notifyAdminOfNewReview)

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'reviews@corporateaisolutions.com',
  to: 'hello@corporateaisolutions.com',
  subject: 'New Review Submitted',
  html: `
    <h2>New ${source} review from ${clientName}</h2>
    <p>Rating: ${'⭐'.repeat(rating)}</p>
    <p>${reviewText}</p>
    <a href="https://corporateaisolutions.com/admin/reviews">
      Moderate Review
    </a>
  `
})
```

### Feature 2: Slack Notifications

```typescript
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({
    text: `🌟 New review from ${clientName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New ${source} review*\nRating: ${'⭐'.repeat(rating)}\n\n"${reviewText}"\n\n— ${clientName}${clientCompany ? `, ${clientCompany}` : ''}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Moderate' },
            url: 'https://corporateaisolutions.com/admin/reviews'
          }
        ]
      }
    ]
  })
})
```

### Feature 3: Review Analytics Dashboard

```typescript
// src/app/admin/reviews/analytics/page.tsx

export default function ReviewAnalyticsPage() {
  const stats = {
    totalReviews: ALL_REVIEWS.length,
    avgRating: REVIEW_STATS.averageRating,
    byPlatform: Object.entries(REVIEWS_BY_PLATFORM).map(([platform, reviews]) => ({
      platform,
      count: reviews.length,
      avgRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    })),
    byMonth: // ... group by month
  }
  
  return (
    // Charts showing review trends over time
  )
}
```

### Feature 4: Review Widgets for Individual Products

```typescript
// src/components/ProductReviews.tsx

export function ProductReviews({ platformId }: { platformId: string }) {
  const reviews = getReviewsByPlatform(platformId)
  
  return (
    <div>
      <h3>What Users Say About {platformId}</h3>
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}

// Usage:
// <ProductReviews platformId="Rehearsals AI" />
```

---

## Maintenance

### Daily:
- Check `/admin/reviews` for new submissions (~2 min)
- Approve/reject reviews

### Weekly:
- Review featured reviews (rotate if needed)
- Check review statistics

### Monthly:
- Backup reviews from Supabase
- Archive old/outdated reviews

### When Needed:
- Manually trigger sync: `npm run sync-reviews`
- Fix any sync errors (check GitHub Actions)

---

## Troubleshooting

### Issue: Reviews not showing on website

**Check:**
1. Is review approved? `SELECT * FROM client_reviews WHERE id='xxx'`
2. Did sync run? Check `src/lib/review-constants.ts` last modified time
3. Did Vercel deploy? Check: https://vercel.com/deployments
4. Clear browser cache

**Fix:**
```bash
npm run sync-reviews
git add src/lib/review-constants.ts
git commit -m "fix: manual review sync"
git push
```

### Issue: Voice reviews not coming through

**Check:**
1. ElevenLabs webhook configured correctly?
2. API endpoint accessible? `curl https://your-domain.com/api/voice-review`
3. Check Supabase logs for errors
4. Test webhook manually with Postman

### Issue: Sync script fails

**Check:**
```bash
# Test locally
npm run sync-reviews

# Check env vars
echo $SUPABASE_SERVICE_ROLE_KEY

# Verify Supabase connection
npx supabase status
```

---

## Security

**Public endpoints:**
- `/submit-review` - Rate limited to 5/hour per IP
- `/api/voice-review` - Webhook signature verified

**Admin endpoints:**
- `/admin/reviews` - Requires authentication (add auth check)

**Database:**
- RLS enabled - public can only read approved reviews
- Service role used for sync script

**Recommendations:**
1. Add CAPTCHA to submission form (prevent spam)
2. Add webhook signature verification (voice endpoint)
3. Add admin authentication (Supabase Auth)
4. Monitor for abuse (rate limiting)

---

## Future Enhancements

1. **AI Moderation:** Auto-detect spam/inappropriate content before human review
2. **Review Requests:** Email past clients asking for reviews
3. **Review Responses:** Reply to reviews (like Google/Yelp)
4. **Video Reviews:** Allow clients to upload video testimonials
5. **Review Badges:** Generate embeddable widgets for partners
6. **Multilingual:** Support reviews in multiple languages

---

## Success Metrics

Track in analytics:
- Reviews submitted per week
- Approval rate
- Average rating over time
- Reviews by platform
- Conversion impact (before/after reviews on site)

---

**Ready to implement? Run through Steps 1-6 and you'll have dynamic reviews live in ~30 minutes!** 🚀
