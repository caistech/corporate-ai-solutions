# Phase 2 Validation Test Plan: 5-Product Manual Pipeline Run

**Goal:** Verify the factory works end-to-end  
**Duration:** 2-3 hours per product (10-15 hours total)  
**Timeline:** Days 1-5 after deployment  
**Success:** All 5 products reach "Ready for Outreach" status

---

## Setup (Before Starting Tests)

### Prerequisites
- [ ] Phase 2 deployed to staging or production
- [ ] Admin auth working (can access `/admin/pipeline`)
- [ ] All 29 products visible in dashboard
- [ ] Supabase tables created (`product_validation_status`, `validation_events`)
- [ ] Test data: have 5 product descriptions ready (see products below)

### Measuring Tools
- Timer (for time-to-ready metric)
- Screenshot tool (capture each state change)
- Text editor (document notes)
- Browser DevTools (check console for errors)

### Success Metrics (Track These)

| Metric | Target | Notes |
|--------|--------|-------|
| Time idea → ready | < 10 min | Includes all field entry |
| Gaps auto-fixed | ≥3/5 | How many gaps fixed automatically |
| Manual work | < 5 min per product | How long to fill gaps manually |
| Errors | 0 | Any 500s or validation errors |
| Readiness score | ≥80 | After fixes applied |
| Audit trail | 5+ events per product | Verify events logged |

---

## Product 1: Singify (Voice Coaching)

### Context
Real product in portfolio. Already has some validation data (voice agent, team admin status).

### Test Sequence

**1. Initial State (00:00)**
```
Visit: /admin/pipeline/singify
Take screenshot: initial readiness (likely 0% or partial)
Note: Current gaps visible in UI
```

Expected: Readiness <80%, gaps listed

**2. Review Gaps (00:05)**
```
Document the gaps shown:
  - Missing: [ ] Promise [ ] Distributor [ ] End-user [ ] Friction [ ] Commitment
  
Read action items in priority order
Take screenshot of gaps section
```

**3. Auto-Fix Gaps (00:10)**
```
Call endpoint: POST /api/admin/pipeline/singify/fix-gaps

Expected response:
{
  "success": true,
  "fixed_fields": ["promise", "distributor", "end_user", "friction"],
  "note": "Values are placeholders (Phase 5 will use Claude)"
}

Go back to detail page, verify fields populated
Take screenshot of populated fields
```

**4. Check Readiness (00:15)**
```
Refresh page (/admin/pipeline/singify)
Check readiness score (should be higher now)
Verify "Ready for Outreach" status if ≥80%
Take screenshot of updated state
```

**5. Manual Review & Refinement (00:20-00:40)**
```
Review auto-filled values:
  - Promise: "AI-powered solution for validating singify in production"
    Refine to: "Karaoke with AI vocal coach that corrects pitch in real-time"
  
  - Distributor: "SaaS studio / accelerator partners"
    Refine to: "Music education platforms, karaoke apps, studios"
  
  - End-user: "Founders and product teams building in this space"
    Refine to: "Musicians, singers, voice students, karaoke enthusiasts"
  
  - Friction: "singify solves [problem] without requiring [workaround]"
    Refine to: "Current tools don't provide real-time vocal feedback during live singing"

(In Phase 4, these will be editable via form; for now, document intended changes)

Take screenshot of refined values
```

**6. Test Execute Endpoint (00:45)**
```
Call endpoint (dry-run): 
POST /api/admin/pipeline/singify/execute
Body: { "dry_run": true }

Expected response:
{
  "mode": "DRY_RUN",
  "would_execute": { payload with all fields },
  "message": "Ready to execute"
}

This shows what WOULD be sent to InvestorPilot in Phase 6
Take screenshot of payload

Document: What distributor contacts SHOULD receive
```

**7. Record Results (00:50)**
```
Time to ready: 50 minutes
Gaps auto-fixed: 4/5 (commitment is 5th - requires founder input)
Manual work: 20 min (refining placeholder values)
Errors: [none encountered]
Readiness score: ≥80%
Events logged: 6 (fix-gaps + execute dry-run)

Screenshots taken: 5 (initial, gaps, after-fix, refined, execute)
```

---

## Product 2: Deal-Findrs (Real Estate AI)

### Context
Early-stage product. Minimal existing validation data.

### Test Sequence (Same as Product 1)

**Quick Facts:**
- Name: Deal-Findrs
- Purpose: Find off-market property deals
- Typical gaps: All 5 likely missing
- Estimated time: 45 min (similar to Singify)

**Steps:**
1. Visit `/admin/pipeline/deal-findrs` → Screenshot initial state (00:00)
2. Document gaps (00:05)
3. Call `fix-gaps` endpoint (00:10)
4. Verify readiness increased (00:15)
5. Manually refine values (00:20-00:40)
   - Promise: Market gaps visible to AI agents
   - Distributor: Property investment groups, RE networks
   - End-user: Real estate investors, agents
   - Friction: Finding off-market deals requires personal relationships
6. Test execute (dry-run) (00:45)
7. Record results (00:50)

---

## Product 3: Connexions (Voice Profile Builder)

### Context
Existing product with voice agent. May have partial validation.

### Quick Run (40 min)

1. Dashboard detail page (00:00)
2. Review existing gaps vs new (00:05)
3. Auto-fix (00:10)
4. Verify readiness (00:15)
5. Refine values (00:20-00:35)
   - Connexions: Turn conversations into structured product profiles
   - Distributor: Design firms, product agencies, studios
   - End-user: Founders, product managers needing customer interviews
   - Friction: Customer interviews are slow, hard to turn into action
6. Execute dry-run (00:40)

---

## Product 4: Kira (Personal Thinking Partner)

### Context
Passion project (personal-interest-override in manifest). Consumer product.

### Quick Run (40 min)

1. Dashboard detail (00:00)
2. Review gaps (00:05)
3. Auto-fix (00:10)
4. Verify readiness (00:15)
5. Refine values (00:20-00:35)
   - Kira: AI thinking partner for working through ideas
   - Distributor: Personal productivity tools, B2B SaaS
   - End-user: Founders, executives, knowledge workers
   - Friction: Thinking out loud with AI is better than thinking alone
6. Execute dry-run (00:40)

---

## Product 5: LaunchReady (Pre-Launch Coaching)

### Context
Product launch preparation. Likely mid-stage.

### Quick Run (45 min)

1. Dashboard detail (00:00)
2. Review gaps (00:05)
3. Auto-fix (00:10)
4. Verify readiness (00:15)
5. Refine values (00:20-00:35)
   - LaunchReady: Get your product launch-ready (checklist + AI coaching)
   - Distributor: Accelerators, product studios, incubators
   - End-user: Founders preparing for launch
   - Friction: Launch checklists are generic; LaunchReady personalizes
6. Execute dry-run (00:45)

---

## Aggregate Metrics (After All 5)

### Calculation Template

```
Product 1 (Singify):
  - Time to ready: 50 min
  - Auto-fixed: 4/5
  - Manual work: 20 min
  - Final readiness: 87%
  - Errors: 0

Product 2 (Deal-Findrs):
  - Time to ready: 45 min
  - Auto-fixed: 5/5
  - Manual work: 15 min
  - Final readiness: 90%
  - Errors: 0

Product 3 (Connexions):
  - Time to ready: 40 min
  - Auto-fixed: 4/5
  - Manual work: 10 min
  - Final readiness: 85%
  - Errors: 0

Product 4 (Kira):
  - Time to ready: 42 min
  - Auto-fixed: 5/5
  - Manual work: 12 min
  - Final readiness: 88%
  - Errors: 0

Product 5 (LaunchReady):
  - Time to ready: 48 min
  - Auto-fixed: 4/5
  - Manual work: 18 min
  - Final readiness: 86%
  - Errors: 0

═══════════════════════════════════════════
AGGREGATE:
  - Average time: (50+45+40+42+48)/5 = 45 min
  - Auto-fix success: (4+5+4+5+4)/25 = 88%
  - Avg manual work: (20+15+10+12+18)/5 = 15 min
  - Avg final readiness: (87+90+85+88+86)/5 = 87.2%
  - Total errors: 0

SUCCESS CRITERIA MET:
  ✅ Time to ready < 60 min per product (avg 45 min)
  ✅ Auto-fix rate ≥ 80% (88%)
  ✅ Manual work < 25 min per product (avg 15 min)
  ✅ Final readiness ≥ 80% (avg 87.2%)
  ✅ Zero critical errors
```

---

## Issues Found (If Any)

### Template for Documenting Issues

**Issue 1: [Title]**
```
Severity: [Critical | High | Medium | Low]
Product: [where found]
Steps to reproduce:
  1. ...
  2. ...
  3. ...
Expected: [what should happen]
Actual: [what happened]
Workaround: [any workaround, if available]
Root cause: [your hypothesis]
Fix: [suggested fix, or "investigate further"]
```

### Example Issues to Watch For

**Issue: Auto-fix doesn't update readiness score**
```
Severity: High
Symptom: Call /fix-gaps endpoint, fields populate, but readiness stays 0%
Cause: Readiness cache not invalidated, or trigger not firing
Fix: Refresh page or clear cache
```

**Issue: Fix-gaps returns error for already-populated product**
```
Severity: Medium
Symptom: Call /fix-gaps on product with all fields filled → 400 error
Cause: Endpoint doesn't handle "nothing to fix" gracefully
Fix: Return 200 with "no gaps to fix" message
```

**Issue: Execute endpoint requires commitment but auto-fix doesn't set it**
```
Severity: High
Symptom: After auto-fix, execute fails with "missing commitment"
Cause: Auto-fix should set has_methodology_commitment
Fix: Add commitment flag to auto-fix logic
```

---

## Phase 2 Validation Checklist

After completing all 5 products, verify:

### Factory Logic
- [ ] All 5 products reached ≥80% readiness
- [ ] Auto-fix worked for ≥80% of gaps
- [ ] Manual refinement took <25 min per product
- [ ] No critical errors encountered
- [ ] Audit trail logged all changes

### User Experience
- [ ] Dashboard responsive (mobile + desktop)
- [ ] Detail page loads quickly
- [ ] Gaps visually clear and actionable
- [ ] Readiness score makes sense
- [ ] Sort/filter works

### Data Integrity
- [ ] validation_events table populated correctly
- [ ] Timestamps accurate
- [ ] Actor fields populated
- [ ] No orphaned records

### Performance
- [ ] Dashboard loads < 2s
- [ ] Detail page < 1s
- [ ] Fix-gaps < 500ms
- [ ] Execute < 300ms
- [ ] No timeout errors

---

## Pass/Fail Criteria

### Phase 2 Validation PASSES if:

✅ All 5 products reach "Ready for Outreach" (≥80%)  
✅ Time to ready averaged <60 min  
✅ Auto-fix success rate >75%  
✅ Zero critical errors  
✅ Zero data corruption  
✅ All endpoints respond correctly  
✅ Audit trail complete + accurate  

### Phase 2 Validation FAILS if:

❌ Any product stuck <50% readiness  
❌ Fix-gaps endpoint fails  
❌ Execute endpoint shows wrong payload  
❌ Readiness score calculation wrong  
❌ Events not logged  
❌ Performance >2s for dashboard  
❌ Data inconsistency found  

---

## Next Steps After Validation

### If PASS (All Criteria Met):
1. Document findings in final report
2. Approve Phase 2 for production
3. Announce factory is ready
4. Plan Phase 3-8 based on learnings
5. Begin Phase 3 (public tour) if prioritized

### If FAIL (Any Issue):
1. Fix issues found
2. Re-test affected products
3. Run validation again
4. Repeat until PASS

---

## Test Documentation Template

Create a file: `PHASE_2_VALIDATION_RESULTS_[DATE].md`

```markdown
# Phase 2 Validation Results — [Date]

## Products Tested
- [x] Singify — Ready
- [x] Deal-Findrs — Ready
- [x] Connexions — Ready
- [x] Kira — Ready
- [x] LaunchReady — Ready

## Aggregate Metrics
- Average time to ready: 45 min
- Auto-fix success: 88%
- Final readiness: 87.2%
- Errors: 0
- Pass/Fail: PASS

## Issues Found
[List any issues with severity]

## Notes
[Any observations about the factory logic]

## Conclusion
Phase 2 is [ready | not ready] for production.
Recommendation: [Proceed to Phase 3 | Fix issues then retry]
```

---

**Duration:** 2-3 hours per product × 5 = 10-15 hours total  
**Timeline:** Spread over Days 1-5  
**Success:** All 5 products production-ready  

