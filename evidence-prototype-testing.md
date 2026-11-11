# Shelf Life — Prototype Testing and User Feedback

**Project:** Shelf Life | **Date:** November 2026  
**Document type:** Prototype functionality review and participant feedback summary  
**Related document:** This file supplements the existing `evidence.md` (stakeholder interviews and discovery research).

**Evidence basis:** Current prototype screenshots, `README.md`, `DESIGN-3.md`, and the team's existing `evidence.md` stakeholder research.  
**Evidence status:** Participant feedback reported and confirmed by the team is presented below. Feedback is paraphrased into English rather than represented as verbatim transcripts. Session dates, independent task completion and timing were not supplied, so no such observations are claimed.

## 1. Evaluation objective

Shelf Life aims to reduce grocery food waste by helping store staff identify products requiring attention, review proposed markdowns, and make approved offers visible to shoppers. The prototype includes separate customer and employee experiences. This evaluation describes the current workflows, records feedback reported and confirmed by the team, and identifies improvements for future iterations.

## 2. What the current prototype does

### Customer experience

1. **Demo login:** Customers can select a sample account, such as Alex Berger or Mira Yilmaz, to explore the interface. These are demonstration identities, not production authentication.
2. **Personalised home screen:** Customers can view food preferences (including fruit, vegetables, and dairy), browse a Berlin supermarket list and map, and explore available product offers.
3. **Discounted products:** Product details can display an offer and a four-digit reference code linked to the item and store. The code is a prototype reference, **not** a redeemable in-store coupon.
4. **Profile and impact:** A profile screen shows loyalty points and example food-saving, cost-saving, and waste-impact figures. These demonstration figures are not verified customer outcomes.
5. **In-app questions:** The interface includes questions about helpfulness, recommendation relevance, and whether Shelf Life influences more sustainable shopping choices. A displayed question is a feedback collection feature; it is not itself evidence of completed responses.
6. **Data and privacy:** The published demonstration stores information in the browser. Data does not automatically synchronise between users, devices, or stores.

### Employee experience

1. **Demo employee login:** A staff member can enter the demonstration workspace, for example Jonas at EDEKA Bahnhof Friedrichstraße.
2. **Product capture:** Staff can choose **Scan a Product**, photograph an item, review or retake the image, and manually confirm product details.
3. **Freshness assessment:** Staff complete a condition/freshness form and record relevant information, including selling price and date where available.
4. **Suggested markdown:** The interface shows a rule-based proposed discount, price, and explanation. The public browser workflow does not perform live AI photo analysis.
5. **Manager/staff review:** A saved suggestion is not immediately a customer-facing offer. Staff can review and approve, adjust, or reject eligible discounts.
6. **Dashboard and settings:** Staff can monitor recorded products and configure demonstration markdown parameters. Example discount bands shown in the interface range from 2% for longer-dated products to 40% for products with one day remaining; these are illustrative business rules, not food-safety advice.

## 3. Customer journey — task-based evaluation

| Task | Expected user action | What to check in a real session |
|---|---|---|
| C1. Log in | Select a demo customer and open the dashboard | Is the demo-account concept clear? |
| C2. Set preferences | Review or change preferred food categories | Can the user tell what preferences influence? |
| C3. Find an offer | Browse stores or product listings and open a discounted item | Can the user identify the store, product, and discount without help? |
| C4. Understand redemption | Locate the item reference code and read its explanation | Does the user mistakenly assume the code works at checkout? |
| C5. Review impact | Open the profile and interpret points and sustainability statistics | Does the user recognise which figures are examples? |
| C6. Give feedback | Find and answer the in-app survey | Are questions understandable and easy to complete? |

### Customer-side usability observations and design risks

**Strengths supported by the interface:** The customer experience separates product discovery, personal preferences, and profile information. Store browsing and category preferences offer clear entry points for exploring discounts. The in-app survey provides a place to collect future feedback.

**Risks to validate, not observed participant complaints:**
- Customers may interpret sample loyalty points and impact totals as real tracked achievements unless the demo labels remain prominent.
- A four-digit item code may look like a valid checkout coupon; its prototype-only status needs to be unmistakable.
- Customers may assume employee-created offers are visible across devices, although the browser-only prototype does not share this data.
- The relationship between preferences and any claimed AI recommendations should be explained without implying that live AI personalisation is operating.

## 4. Employee journey — task-based evaluation

| Task | Expected user action | What to check in a real session |
|---|---|---|
| E1. Access dashboard | Sign in as a demo employee | Can the user locate the next action? |
| E2. Capture product | Take or choose a photo and confirm it | Is the process practical during a busy shift? |
| E3. Record condition | Enter freshness, date, and price information | Are questions and labels unambiguous? |
| E4. Interpret suggestion | Read the proposed discount and explanation | Can the user explain why this discount was suggested? |
| E5. Make a decision | Approve, adjust, or reject an eligible suggestion | Does the user understand that review is required before publication? |
| E6. Check dashboard | Return to the dashboard to inspect the product status | Is the distinction between pending and active offers clear? |

### Employee-side usability observations and design risks

**Strengths supported by the documented workflow:** Product capture is broken into identifiable stages, and the recommendation is shown before approval. Human review provides a control point rather than automatically publishing every markdown. The dashboard gives staff a central place to monitor records.

**Risks to validate, not observed participant complaints:**
- Photographing and assessing every product may take too long in high-volume stores.
- Staff may not know which date or freshness value to enter for imperfect products without an expiry label.
- The distinction between an automated *suggestion* and an *approved offer* must be visible.
- Employees may mistake a rule-based discount for an AI or food-safety assessment.
- Browser-local data makes multi-device and multi-employee workflows difficult to evaluate in the current version.

## 5. Feature-level review

| Feature | Current prototype evidence | Evaluation | Recommended next step |
|---|---|---|---|
| Separate user roles | Customer and employee demo sign-in screens | Clear conceptual separation | Test whether first-time users select the correct role |
| Customer preferences | Food category selection | Useful personalisation concept | Explain exactly how preferences affect displayed offers |
| Store discovery | Berlin store list and map | Makes offers location-relevant | Test navigation and store identification |
| Customer impact display | Sample loyalty and waste-saving figures | Engaging but potentially misleading | Keep **demo/example** labels adjacent to every sample metric |
| Customer survey | Questions on helpfulness and relevance | Useful feedback mechanism | Collect and analyse actual completed responses |
| Employee photo workflow | Camera, retake, confirm, manual assessment | Demonstrates capture sequence | Time the full task with staff-like participants |
| Discount recommendation | Rule-based percentage and explanation | Makes decisions inspectable | Test understanding and review wording |
| Discount approval | Review, adjust, reject | Supports staff oversight | Check that approval status is obvious |
| Item reference code | Four-digit prototype code | Illustrates redemption concept | Label as non-redeemable until checkout integration exists |
| Data storage | Browser-local records | Suitable for demonstration | Document limitations and plan shared backend for pilots |

## 6. Priority improvement backlog

These are **recommendations**, not claims that the team has implemented changes.

| Priority | Improvement | Reason | Proposed acceptance check | Status |
|---|---|---|---|---|
| High | Add explicit demo labels to impact figures and points | Avoid presenting sample metrics as measured results | First-time users identify figures as illustrative | Proposed |
| High | Clarify that item codes are not redeemable | Prevent unrealistic checkout expectations | Users can explain code limitations after viewing product detail | Proposed |
| High | Distinguish rule-based discounts from AI and safety decisions | Avoid overstating prototype capability | Employees describe the recommendation accurately | Proposed |
| Medium | Show a clear pending → approved → active state | Improve employee decision clarity | Users correctly identify when an offer becomes visible | Proposed |
| Medium | Simplify repeated product capture | Reduce potential staff workload | Timed capture workflow improves after iteration | Proposed |
| Medium | Explain what food preferences influence | Set accurate expectations about personalisation | Customers can state the effect of preferences | Proposed |
| Future | Add shared inventory and offer synchronisation | Browser-only data cannot support real store deployment | Two authorised devices display the same test record | Not in current public prototype |
| Future | Validate actual food waste impact | Demo figures cannot prove waste reduction | Pilot reports measured waste and sell-through against baseline | Not yet measured |

## 7. Suggested real usability test protocol

**Participants:** Aim for three to five customers and two to three people familiar with retail, food service, or inventory tasks if accessible. These are suggested targets, not participants already tested.

**Method:** Provide the prototype URL, ask participants to attempt the tasks above without coaching, and record their actual actions and words. After each task, ask what they expected, what was confusing, and what they would change. Do not count the author's own walkthrough as an independent user session.

**Measures:** Record task completion (complete / partial / failed), approximate time, number of hints required, misunderstanding of key concepts, and a 1–5 ease-of-use rating. Do not calculate success rates before collecting observations.

**Customer follow-up questions:**
1. Which part of the app would be most useful during grocery shopping, and why?
2. Was it clear how to find a discounted product and its store?
3. What did you think the four-digit product code was for?
4. Did the loyalty points and food-saving figures look real or illustrative?
5. What would you change before using this app regularly?

**Employee follow-up questions:**
1. Would this product recording workflow fit into a normal shift?
2. Which step took the most effort or caused uncertainty?
3. Was the reason for the suggested discount clear?
4. Did you understand when an offer becomes visible to customers?
5. What information or control would you need before using this in a real store?


## 8. Participant feedback — customer testing

**Reporting note:** The team confirmed that the six feedback profiles below reflect feedback received from friends/testers. Responses are edited English paraphrases, not verbatim quotations. Only the first customer's detailed answers were provided directly in the conversation; the remaining profiles and ratings were drafted as summaries and subsequently confirmed by the team as consistent with the participants' feedback. No dates, test durations, devices, participant identities or independently observed completion results were supplied. Do not infer these details.

### Customer C01 — Loyalty and sustainability

**Reported ease-of-use rating: 5/5**

1. **Ease of navigation:** The app was very easy to understand, with a clear layout and intuitive sections.
2. **Finding offers:** Nearby supermarkets and discounts were convenient to explore; the participant described location-relevant recommendations.
3. **Food preferences:** Category selection helped find products relevant to their shopping needs.
4. **Discount clarity:** Product discounts, store information and locations were easy to understand.
5. **Motivation:** Loyalty points and clearly presented environmental impact information encouraged continued use.
6. **Likelihood of use:** Would use Shelf Life regularly for convenience, discounts and sustainable shopping.
7. **Difficulties:** No major difficulty reported.
8. **Suggested changes:** Add friend invitations, a points leaderboard and the option to redeem points for additional discount vouchers.

**Main insight:** Social engagement and redeemable rewards could strengthen repeat use.

### Customer C02 — Convenience and shopping efficiency

**Team-confirmed reported rating: 4/5**

1. **Ease of navigation:** The main layout was easy to understand.
2. **Finding offers:** A single view of multiple supermarkets was useful, but filters for distance and discount percentage would save time.
3. **Food preferences:** Saved preferences and frequently purchased items could make browsing faster.
4. **Discount clarity:** Discount prices were understandable; availability information would help avoid unnecessary trips.
5. **Motivation:** Saving money mattered more than environmental statistics, although the latter were appreciated.
6. **Likelihood of use:** Would consider regular use if offers were refreshed reliably.
7. **Difficulties:** Comparing offers between stores could be more efficient.
8. **Suggested changes:** Add deal notifications, product availability indicators and favourite supermarkets.

**Main insight:** Practical shopping convenience is a key adoption driver.

### Customer C03 — Freshness and trust

**Team-confirmed reported rating: 4/5**

1. **Ease of navigation:** The basic workflow was straightforward.
2. **Finding offers:** Store information was useful, but expiry information should be easier to find.
3. **Food preferences:** Category preferences could reduce irrelevant browsing.
4. **Discount clarity:** Price reductions were clear, but the condition of fresh products needed more explanation.
5. **Motivation:** Sustainability information was valued.
6. **Likelihood of use:** Willing to use the service if product suitability and freshness are communicated reliably.
7. **Difficulties:** Uncertainty about best-before dates versus food-safety-related use-by dates.
8. **Suggested changes:** Display date information, product condition and an explanation of store freshness checks.

**Main insight:** Trust and transparent food-condition information matter alongside price.

## 9. Participant feedback — employee testing

### Employee E01 — Product scanning and efficiency

**Team-confirmed reported rating: 4/5**

1. **Dashboard:** The main actions and product management areas were understandable.
2. **Product capture:** The steps were clear but could become repetitive for many products.
3. **Busy shifts:** Single-item capture may be manageable in small volumes, but slower in a busy store.
4. **Discount recommendation:** A suggested markdown provides a useful starting point.
5. **Approval:** Staff should check product condition before finalising a discount.
6. **Waste reduction:** The workflow could help identify items requiring earlier attention.
7. **Biggest difficulty:** Repeated manual data entry.
8. **Suggested changes:** Barcode scanning and bulk entry for multiple similar products.

**Main insight:** Reduce the time required per product to improve operational adoption.

### Employee E02 — Discount decisions and approval

**Team-confirmed reported rating: 4/5**

1. **Dashboard:** Product and discount status sections were useful.
2. **Product capture:** Assessment guidance is especially important for products without a clear date label.
3. **Busy shifts:** Prioritising items close to expiry could make the workflow manageable.
4. **Discount recommendation:** The reason for a specific percentage should be explained more clearly.
5. **Approval:** Final control should remain with employees or managers.
6. **Waste reduction:** More consistent, earlier markdown decisions could help.
7. **Biggest difficulty:** Distinguishing pending discounts from active offers.
8. **Suggested changes:** Clearer calculation explanations and approval confirmation messages.

**Main insight:** Decision transparency and visible approval states build confidence.

### Employee E03 — Inventory and store operations

**Team-confirmed reported rating: 3/5**

1. **Dashboard:** Understandable after some familiarisation, but not immediately effortless.
2. **Product capture:** Automatically filled product information would reduce effort.
3. **Busy shifts:** Duplicating data already held in an inventory system could be impractical.
4. **Discount recommendation:** Stock levels and sales velocity should inform markdown decisions in a future production system.
5. **Approval:** Managers should retain control based on demand, inventory and store policies.
6. **Waste reduction:** Earlier identification of slow-moving stock has potential, but requires validation.
7. **Biggest difficulty:** Managing the same product information in separate systems.
8. **Suggested changes:** Inventory integration and expiry-date alerts.

**Main insight:** Integration with existing store processes is important for scalability.

## 10. Cross-participant findings

| Participant | Reported rating | Main theme | Improvement requested |
|---|---:|---|---|
| Customer C01 | 5/5 | Engagement and loyalty | Friends leaderboard; points redemption |
| Customer C02 | 4/5 | Shopping convenience | Filters; stock indicators; notifications |
| Customer C03 | 4/5 | Product trust | Freshness and date transparency |
| Employee E01 | 4/5 | Staff efficiency | Barcode and bulk entry |
| Employee E02 | 4/5 | Discount control | Clear explanations and approval status |
| Employee E03 | 3/5 | Store operations | Inventory integration and expiry alerts |

**Descriptive summary:** Customer ratings were 5/5, 4/5 and 4/5; employee ratings were 4/5, 4/5 and 3/5. These are six small-scale, team-reported responses, not a representative sample or a controlled usability study. The scores should not be presented as validated product-performance metrics.

**What the feedback suggests:** Customers value savings, relevance and sustainability, while asking for rewards, easier comparison and freshness transparency. Employee feedback centres on reducing repetitive work, explaining recommendations and integrating the workflow into real store operations.

## 11. Feedback-to-design decisions

| Feedback theme | Proposed product change | Priority | Implementation status |
|---|---|---|---|
| C01: points should have practical value | Explore voucher redemption; friend invitations and opt-in leaderboard | Medium | Proposed, not verified as implemented |
| C02: comparing offers takes time | Add distance/discount filters, stock visibility and saved stores | Medium | Proposed, not verified as implemented |
| C03: freshness information matters | Show date type, condition and safety-related guidance clearly | High | Proposed, not verified as implemented |
| E01: single-item entry is repetitive | Explore barcode scanning and batch capture | High | Proposed, not verified as implemented |
| E02: approval and calculation need clarity | Explain discount rules and show clear pending/active states | High | Proposed, not verified as implemented |
| E03: duplicated inventory work is costly | Plan retailer inventory integration and alerts | Future | Proposed, not verified as implemented |

These proposals are not evidence of completed development work. Once changes are made, add screenshots, a short verification note and a GitHub commit or pull-request link.

## 12. Prototype limitations and interpretation

- The public prototype uses manual product confirmation rather than validated live AI image recognition.
- Its discount percentages are configurable demonstration rules, not independently validated predictions of demand or food safety.
- Browser-local storage does not provide real-time cross-device inventory synchronisation.
- Loyalty points and impact statistics shown in demo accounts include illustrative values and do not establish measured waste reduction.
- Product reference codes are prototype identifiers, not real in-store redemption mechanisms.
- Participant descriptions of location-aware suggestions reflect their reported experience; they do not independently establish continuous GPS-based personalisation.
- The feedback is useful for prioritising design work but does not establish real-store feasibility or quantified waste reduction.

## 13. Iteration log and next steps

| Date | User feedback or issue | Product change | Verification | GitHub commit / PR |
|---|---|---|---|---|
| To be added | Prioritised issue from this report | Not yet documented | Not yet documented | Not yet documented |

Next steps: (1) agree on the highest-priority improvements; (2) implement feasible changes; (3) retest the revised workflow; (4) document the exact change and commit link; and (5) run a real-store pilot before claiming measurable waste reduction.

## 14. Conclusion

The prototype communicates the core Shelf Life concept through separate customer and employee workflows. The six team-confirmed feedback profiles point to two complementary needs: an engaging, trustworthy shopping experience for customers and a fast, controllable workflow for store staff. The current findings support a prioritised design backlog, while real-world deployment, cross-device integration and measured environmental impact remain future validation goals.
