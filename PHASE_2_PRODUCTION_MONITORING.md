# Phase 2 Production Monitoring Checklist

**Duration:** 1 week (7 days) post-deployment  
**Goal:** Verify factory stability before Phase 3+ approval  
**Success Criteria:** Zero critical errors, <2s dashboard load, all endpoints functional

---

## Day 1: Post-Deployment Verification (Immediate)

### First 30 Minutes

- [ ] Build succeeded on Vercel (check deployment log)
- [ ] All env vars present (check Vercel dashboard)
- [ ] `/admin/pipeline` loads with auth
- [ ] No TypeScript errors in browser console
- [ ] Database tables exist and have correct schema
- [ ] Can fetch `/api/admin/pipeline/scan` (returns 200)
- [ ] Screenshot: Dashboard initial state

**If ANY fail:** Rollback immediately and investigate

### First 2 Hours

- [ ] Test with 2-3 products: navigate to detail pages
- [ ] Verify sort/filter works on dashboard table
- [ ] Call `/api/admin/pipeline/[id]/fix-gaps` successfully
- [ ] Check Supabase: validation_events has entries
- [ ] Monitor response times (DevTools Network tab)
- [ ] Check browser console for warnings

**Acceptable errors at this stage:**
- 404 on products with no data (expected)
- Missing fields showing as empty (expected)

**Not acceptable:**
- 500 errors
- TypeScript/syntax errors
- Database connection failures
- Auth failures for valid admin users

### End of Day 1

- [ ] Document any issues found
- [ ] If critical issues: rollback
- [ ] If minor issues: log for investigation
- [ ] If clean: proceed to validation test

---

## Days 2-5: 5-Product Validation Test

Follow `PHASE_2_VALIDATION_TEST_PLAN.md` exactly.

Monitor during test:
- [ ] Each endpoint responds in <1s
- [ ] No database errors in Supabase logs
- [ ] Audit events logged for each action
- [ ] Readiness scores calculated correctly
- [ ] Auto-fix values reasonable

**Daily standup (end of each validation day):**
```
Product: [name]
Status: [complete / in-progress / blocked]
Time spent: [X min]
Issues found: [none / list any]
Readiness score: [X%]
```

---

## Day 6: Performance Baseline & Metrics Review

### Load Testing (Manual)

From multiple locations if possible:

```bash
# Test dashboard load time (3 samples)
curl -w "%{time_total}\n" \
  -H "Authorization: Bearer <token>" \
  https://yourapp.com/api/admin/pipeline/scan

# Expected: <1s per request
# Record: avg time, min, max

# Test detail page load (for each product)
curl -w "%{time_total}\n" \
  -H "Authorization: Bearer <token>" \
  https://yourapp.com/api/admin/pipeline/singify

# Expected: <500ms per request
```

### Metrics Checklist

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Dashboard load | <2s | __ | ☐ |
| API scan endpoint | <1s | __ | ☐ |
| API detail endpoint | <500ms | __ | ☐ |
| Fix-gaps endpoint | <500ms | __ | ☐ |
| Execute endpoint | <300ms | __ | ☐ |
| Auth latency | <200ms | __ | ☐ |
| DB query time (avg) | <100ms | __ | ☐ |

### Error Rate Review

```sql
-- In Vercel Analytics or logging service
-- Check for errors in past 5 days:

SELECT event_type, COUNT(*) as count 
FROM validation_events 
WHERE created_at > NOW() - INTERVAL '5 days'
GROUP BY event_type;

-- Expected: Most events are fix-gaps, execute, or auto-created
-- No 500 errors should appear
```

### Cache Performance

- [ ] First dashboard load: measure time
- [ ] Reload dashboard (should be faster due to 5m cache): measure time
- [ ] Cache hit ratio >80% expected
- [ ] Document: cache effectiveness

---

## Day 7: Final Review & Decision

### Stability Checklist

- [ ] Zero critical errors in past 7 days
- [ ] All 5 products reached ≥80% readiness
- [ ] Average response time <1s
- [ ] Auth working correctly (0 false rejections)
- [ ] Database integrity verified (no orphaned rows)
- [ ] Audit trail complete and accurate
- [ ] Mobile responsiveness confirmed
- [ ] No performance degradation over time

### Review Results

**Success (All checked):**
- Approve Phase 2 for continued production use
- Mark factory as "stable"
- Begin Phase 3 planning
- Document learnings

**Issues found (Some unchecked):**
- Categorize by severity
- If critical: roll back or fix immediately
- If medium: fix in next deployment
- If low: add to Phase 3 polish list

### Data Quality Review

```sql
-- Verify data integrity
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT product_slug) as unique_products,
  COUNT(CASE WHEN weighted_score_percent >= 80 THEN 1 END) as ready_count,
  AVG(weighted_score_percent) as avg_readiness,
  COUNT(DISTINCT has_promise) as promise_variance
FROM product_validation_status
WHERE created_at > NOW() - INTERVAL '7 days';

-- All should look healthy
-- Ready_count should be 5 (from validation test)
-- Avg readiness should be ~87%
```

### Logs Review

**Check Vercel logs for:**
- [ ] No repeated error patterns
- [ ] No memory leaks (response times increasing)
- [ ] No database connection pool exhaustion
- [ ] No rate limit hits
- [ ] No CORS or auth middleware issues

**Command (if using Vercel CLI):**
```bash
vercel logs --follow
# Watch for 7 days of logs
```

---

## Weekly Reporting Template

Create: `PHASE_2_WEEK_1_REPORT.md`

```markdown
# Phase 2 Production — Week 1 Report

## Executive Summary
✅ Factory deployed and validated. All systems stable. Ready for Phase 3.

## Validation Results
- Products tested: 5
- Time to ready (avg): 45 min
- Final readiness (avg): 87.2%
- Errors encountered: 0

## Performance
- Dashboard load: 1.2s avg (target <2s)
- API endpoints: <500ms avg
- Cache hit ratio: 92%

## Incidents
None

## Data Quality
- Tables: 2 (product_validation_status, validation_events)
- Records: 5 products × 6+ events = 30+ audit entries
- Integrity: Verified, no orphans

## Recommendations
1. Phase 2 approved for production
2. Proceed with Phase 3 (public tour)
3. No critical issues requiring immediate fix

## Blockers
None

## Timeline
- Day 1: Deployed ✅
- Days 2-5: Validation ✅
- Day 6: Metrics review ✅
- Day 7: Final review ✅
- Decision: PROCEED TO PHASE 3
```

---

## Alerts & Escalation

### If Any Critical Issue Found

```
ALERT CRITERIA:
- Dashboard shows 500 error
- Auth middleware blocks valid admin users
- Database connectivity lost
- Auto-fix returns incorrect values
- Readiness calculation wrong

ACTION:
1. Document issue in detail
2. Revert to last known good (if code issue)
3. Investigate root cause
4. Notify team
5. Fix and redeploy
6. Re-run validation test
7. Document lessons learned
```

### Rollback Trigger

Rollback immediately if:
- ❌ 500 errors on dashboard
- ❌ DB schema corruption
- ❌ Auth bypass vulnerability
- ❌ Data loss

Investigate before rollback if:
- ⚠️ Slow performance (could be traffic spike)
- ⚠️ Audit events not logged (could be cache delay)
- ⚠️ Readiness score fluctuates (could be race condition)

---

## Post-Monitoring Decisions

### If STABLE (Week 1 clean):

**Option A: Proceed to Phase 3**
```
Timeline: Start Phase 3 immediately
Features: Public tour, landing page, request management
Duration: 1 week
Next gate: Phase 3 UAT with 2 external users
```

**Option B: Polish Phase 2 (1 week)**
```
Timeline: Defer Phase 3 by 1 week
Work: UI polish, performance optimization, docs
Focus: 90%→95% quality bar
Next: Re-evaluate Phase 3 priority
```

### If ISSUES FOUND:

**Critical (blocking production):**
```
Fix immediately, re-test, then decide Phase 3 timeline
Likely delay: +1 week
```

**Medium (minor bugs):**
```
Fix in next deployment (Phase 3 sprint)
Can proceed to Phase 3 with known issues
Track in Phase 3 backlog
```

**Low (nice-to-have improvements):**
```
Add to future backlog
Proceed to Phase 3 without delay
```

---

## Daily Check-In Template

Use this every day for 7 days:

```
## [Date] — Phase 2 Monitoring Report

### Status
✅ All systems operational

### Performance
- Dashboard avg load: __ s
- API latency: __ ms
- Error rate: __ %

### Recent Activity
- Products tested today: [list]
- Events logged: __ 
- Issues found: [none/list]

### Next steps
[What to check tomorrow]
```

---

## Success Looks Like

By end of Week 1:

```
✅ Factory produces correct readiness scores
✅ Auto-fix fills gaps (with reasonable placeholder values)
✅ Execute endpoint validates and shows payload
✅ Audit trail complete and auditable
✅ Performance acceptable (<2s dashboard)
✅ Auth working (no false failures)
✅ All 5 products production-ready
✅ Zero data corruption
✅ Mobile responsive
✅ Ready to expand to Phase 3
```

---

## Next Phase Decision Gate

After Week 1, answer:

1. **Can Phase 2 be trusted?** (Yes if all checks passed)
2. **Are factory rules sound?** (Yes if 5 products all ≥80%)
3. **Is the UI usable?** (Yes if no UX complaints)
4. **Can we scale to 29 products?** (Yes if no performance issues)
5. **Should we start Phase 3?** (Yes if all above are yes)

**If all yes → Green light Phase 3**  
**If any no → Fix issue first, then re-evaluate**

---

**Monitoring duration:** 7 days  
**Success criteria:** All items checked  
**Failure criteria:** Any critical alert triggered  
**Decision point:** Day 7 end (Phase 3 go/no-go)

