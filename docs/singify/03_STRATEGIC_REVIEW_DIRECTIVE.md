# Strategic Review Directive — Claude Code Pre-Work

**Status:** MANDATORY before any code is written
**Deliverable:** 2-4 page written assessment, founder reviews and approves
**Audience:** Claude Code, agentic CLI

---

## The brief

The founder has built a working prototype (VoicePolish v3) and scoped a full product (Singify) plus its platform extension (Speakify, Teacherly, SalesPolish, PitchPolish, LingoPure integration). The PRD is in `SINGIFY_PLATFORM_PRD_v0.2.md`.

Before writing any code, Claude Code must complete a **strategic review** that does more than confirm consistency with existing strategy. It must actively identify how this new product changes or enhances what should already be in motion.

This is the founder's explicit priority. Compliance with the PRD is table stakes. Strategic insight is the real ask.

---

## What Claude Code must request first

Before producing the review, ask the founder for:

1. **Current business model documentation** — pitch deck, OKRs, revenue plan, whatever exists
2. **LingoPure AI architecture** — source code or technical overview, ideally both
3. **Existing customer / distributor relationships** — who already uses LingoPure, which professional channels are warm
4. **Revenue structure today** — consumer subscription, B2B licenses, hybrid?
5. **12-month strategic priorities** — what's already on the roadmap
6. **Existing team composition** — solo? co-founders? freelancers?
7. **Any partner or distribution agreements** already in place

Do NOT skip this step. The review cannot be done without context.

---

## What the review must contain

A markdown document, 2-4 pages, structured as follows.

### Section A: Strategic Alignment Audit

- Where Singify fits cleanly into existing strategy
- Where it stretches or contradicts existing strategy
- What strategic assumptions Singify validates
- What strategic assumptions Singify invalidates
- Net assessment: is this an extension, a pivot, or a parallel bet?

### Section B: Portfolio Enhancement Opportunities

Specific to LingoPure AI:

- Does Singify strengthen, dilute, or refocus LingoPure?
- Can LingoPure's voice agent infrastructure power Singify's coach?
- Can Singify's polish pipeline give LingoPure new features (e.g., self-tape polish for actors)?
- Cross-sell paths between the two products
- Should they remain independent brands, sub-brands of an umbrella, or merged into one?

Cross-portfolio strategic plays:

- Are there existing LingoPure distribution relationships that could carry Singify?
- Conversely, does Singify open new distribution channels that benefit LingoPure?
- What does the multi-tenant platform architecture enable that wasn't possible before?

### Section C: New Strategic Insights

Specifically: what does the **leveraged distributor** model reveal about how the rest of the portfolio should go to market?

Address each:

- Are there existing distribution relationships we're underusing?
- Is there a vertical we'd previously deprioritised that now looks more attractive under a B2B2C lens?
- Does the platform architecture enable a play we hadn't considered (e.g., licensing the engine as B2B SaaS to vertical software vendors)?
- Does the model imply a different fundraising/pricing strategy than what's currently planned?

### Section D: Risks and Tensions

Identify concrete risks. Don't hedge.

- **Brand confusion:** customers who know LingoPure may be confused by Singify
- **Engineering complexity:** multi-tenant + multi-vertical is expensive
- **Distraction risk:** Singify may pull focus from LingoPure's roadmap
- **Cannibalisation:** does Singify steal time/users from LingoPure?
- **Channel conflict:** if existing LingoPure customers are also potential Singify distributors, do we go around them or with them?
- **Founder bandwidth:** can the founder personally validate Singify while continuing to operate LingoPure?
- **Tech debt:** the v3 prototype is throwaway code; how much of it survives architectural refactor?

For each risk, give a one-line mitigation.

### Section E: Recommended Adjustments

This is the part the founder cares most about. Don't just summarise — *recommend*.

- Concrete changes to the Singify v0.1 plan
- Concrete changes to existing portfolio strategy
- Sequencing recommendations (which vertical should be second after Singify? what platform features to prioritise?)
- Naming and positioning recommendations
- Resource allocation recommendations (does this need a new hire? a co-founder? outside capital?)

Be specific. "Consider strengthening cross-sell" is useless. "Add a LingoPure → Singify funnel for drama students, expected uplift of 15-25% on Singify acquisitions in months 2-3" is useful.

### Section F: Open Questions for Founder

Things Claude Code cannot resolve without founder input. Number each. The founder will respond inline.

---

## Format requirements

- **Markdown.** 2-4 pages (~1500-3000 words).
- **Numbered observations** within each section to make discussion easy.
- **Direct and unhedged.** "I recommend X" not "it might be worth considering whether X."
- **Specific examples** wherever possible. Concrete distributor types, concrete pricing, concrete sequencing.
- **No filler.** No restating what's in the PRD. Build on it.

---

## What this review is NOT

- Not a summary of the PRD
- Not a list of every feature
- Not market research (the founder has done that)
- Not a hedge document — say what you actually think
- Not a yes-document — push back where you disagree

---

## Approval gate

After producing the review:

1. Founder reads it.
2. Founder may:
   - Approve as-is and proceed to scaffold proposal
   - Request revisions to specific sections
   - Pause the entire build pending other decisions
3. **No code is written until approved.**

If the founder approves the review, Claude Code proceeds to:
1. Scaffold tree proposal
2. LingoPure integration approach
3. Refined v0.1 acceptance criteria
4. Then, and only then, code.

---

## The founder's exact instruction

> "Don't just build what the PRD says — tell me where this changes what we should be doing. That's the most valuable thing you can do for me."

Take this seriously. The founder built a working prototype in five hours tonight. They don't need a code monkey; they need a strategic collaborator who happens to also write code. Be that.

---

**End of directive. Begin by requesting the founder's strategy materials.**
