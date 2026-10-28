# Grocery freshness and markdown app for a multi retailer prototype

This document describes a university prototype for grocery stores. EDEKA is one illustrative retailer configuration; the platform is intended to support different grocery retailers and independent stores. All inventory, AI assessments, prices, locations, and integrations are simulated unless explicitly stated otherwise.

## Purpose

Build a working university demo for an illustrative EDEKA store.
Employees photograph fresh-produce batches and enter delivery dates,
storage conditions, and a condition check. The app estimates remaining
freshness and begins progressive discounts two days before the estimated
selling deadline. Once an employee confirms condition for the current
phase, store-set discounts publish to a simulated EDEKA-style
customer-app preview.

The intended business outcome is less unsold food while retaining
revenue. The demo demonstrates the workflow; it does not establish
real-world waste reduction or commercial results.

## Confirmed product decisions

- Serve grocery stores exclusively, using EDEKA as the retailer context.
- Deliver a working university demo with sample inventory and a
  simulated EDEKA-style offer preview.
- Focus on fresh produce such as apples, rather than requiring a printed
  expiry date.
- Employees submit a batch photo, delivery date, storage conditions, and
  a condition check.
- Use that information to estimate remaining freshness, with an employee
  confirming the proposed selling deadline.
- Begin markdowns two days before that deadline and deepen them in
  progressive phases, with a hard maximum discount of 30%.
- Employees confirm condition for each phase; discounts then publish
  within rules set by the store. Routine manager approval is not
  required.
- Cover three personas: customer, employee, and store represented by its
  manager or owner.

## Working assumptions

- Use one illustrative EDEKA store, synthetic inventory, EUR, and the
  Europe/Berlin timezone. No real store partnership is implied.
- Use an English interface and a responsive web app. Employee capture
  should work with a phone camera or image upload.
- The customer experience is a separate read-only EDEKA-style demo view,
  accessible during presentations. It is not a real EDEKA app connection
  or a standalone shopping service.
- Keep apples as the main photo-assessment scenario. Include researched
  fruit/vegetable reference profiles and a few sealed meat/dairy batches
  using label dates; the added profiles do not imply validated image
  models for every food.
- Store managers configure discount percentages, floors, and maximum
  discounts. Employees cannot bypass these rules.
- For the demo, require a new condition confirmation for every phase.
  Old confirmations never authorise a later phase.
- Use a demo role switcher rather than production authentication and
  clearly mark all views as demonstrations.

## Three personas

| **Persona**                           | **Goal**                                                   | **Experience and permissions**                                                                                                                                 |
|---------------------------------------|------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Customer                              | Find suitable discounted produce at their selected store   | Browse live mock offers, prices, eligible batches, and availability in the EDEKA-style preview; cannot access internal photos or edit offers                   |
| Employee                              | Capture batches and act on freshness alerts quickly        | Photograph batches, enter supporting information, review estimated freshness, confirm condition, and record stock movements; cannot change store pricing rules |
| Store represented by manager or owner | Reduce unsold stock while controlling revenue and workload | Set discount phases and price limits, inspect results and sync failures, suspend offers, and make logged exceptions                                            |

## Main workflow

1.  Employee selects a product and creates or opens a batch, recording
    quantity and unit of measure.
2.  Employee takes or uploads a photo, enters the delivery date and
    storage conditions, and completes a condition checklist covering
    visible damage, discolouration, mould, and firmness where
    appropriate.
3.  The freshness component returns an estimated remaining-life range, a
    proposed selling deadline, an explanation, and any missing
    information. The employee confirms or shortens the proposed
    deadline; extending it requires a logged manager review.
4.  The app schedules the first discount for two days before the
    confirmed deadline. An already-eligible batch enters the appropriate
    current phase immediately.
5.  When a phase becomes eligible, the employee inspects the batch
    again. A suitable condition confirmation triggers the configured
    price and outbound mock update without a separate manager approval.
6.  After a successful mock sync, customers see the eligible batch offer
    in the EDEKA-style preview. Failures remain visible to staff and can
    be retried.
7.  Employees record sales, remove unsuitable units, or withdraw the
    batch. Moving the demo clock forward shows later phases requiring a
    new condition check.

## Progressive discount rules

The following schedule is an illustrative demo default, not a claim
about retailer policies. Managers can configure thresholds and
percentages within the fixed 30% product-wide cap. The example phase
percentages are 10%, 20%, and 30%.

| **Phase**         | **Calendar days until selling deadline**          | **Target discount from original price** |
|-------------------|---------------------------------------------------|-----------------------------------------|
| Regular price     | More than 2 days                                  | 0%                                      |
| Phase 1           | 2 days                                            | 10%                                     |
| Phase 2           | 1 day                                             | 20%                                     |
| Phase 3           | Deadline day                                      | 30%                                     |
| Removed from sale | After the selling deadline, or flagged unsuitable | No active offer                         |

- Apply the highest eligible phase when a batch is first added or
  several days are skipped. Require condition confirmation for the
  current phase, without replaying intermediate phases.
- Calculate each phase from the original price. Discounts do not stack
  on earlier discounted prices.
- Enforce a hard 30% maximum discount across settings, price
  calculation, manual exceptions, imports, and outbound offers. Store
  managers can set a lower cap per product but cannot exceed 30%. Also
  honour each product’s minimum selling price.
- Calculate prices using integer EUR cents. Round the minimum permitted
  price upward to the next cent so rounding never makes the effective
  discount exceed 30% or a stricter product cap. The final price must be
  at least both the configured floor and
  `ceil(original_price_cents * (100 - effective_cap_percent) / 100)`.
  Round the proposed phase price upward too; show the actual discount
  without overstating savings. Reject invalid floors above the original
  price.
- For a EUR 2.99 item, 10%, 20%, and 30% phases produce EUR 2.70, EUR
  2.40, and EUR 2.10. The actual final reduction is approximately
  29.77%, remaining within the cap.
- Never increase an already published batch price automatically as part
  of progression.
- Recheck quantity, eligibility, limits, and the current price when
  condition confirmation triggers publication so stale recommendations
  cannot overwrite newer decisions.
- A failed or missing condition check blocks a new markdown. At a phase
  boundary, pause the previous offer until the current phase is
  confirmed; show this explicitly to employees.
- Confirmation is tied to the batch, phase, and latest assessment
  version. Changed assessment inputs invalidate a pending confirmation.
- If only some items are unsuitable, remove them and update quantity
  before confirming the remaining batch. Record the quantity removed.
- Sold-out and withdrawn batches cannot receive or publish new
  discounts.

## Freshness estimates and condition

- For fresh produce, use an estimated selling deadline rather than
  claiming a manufacturer expiry date or safety guarantee.
- Keep the model estimate, employee-confirmed deadline, and any manager
  exception separate in the data and history.
- End the confirmed deadline day at 23:59:59 in the store timezone for
  the demo.
- Photos cannot reveal every condition within a batch or establish
  microbiological safety. Do not let an estimate override an unsuitable
  condition check.
- Missing, unreadable, or unsupported photos trigger a request for
  another photo or manual assessment. Do not produce a fabricated
  precise date.
- Staff can flag unsuitable goods at any time, removing the offer and
  triggering withdrawal. Do not extend deadlines automatically after
  reassessment.
- For sealed meat and dairy demo batches, require the printed
  best-before/use-by date and stated storage instructions. Use those
  fields for markdown timing, not a photo-based life extension. Missing
  or unreadable dates block publication pending manual verification.
- A use-by deadline cannot be extended by an employee, manager,
  reference table, or AI output. For this demo, best-before-labelled
  batches also stop at their printed date as a conservative product
  policy, not a claim that sale afterward is always prohibited.
- Storage outside product instructions or an uncertain cold chain blocks
  automated publication pending review; an in-date label or
  normal-looking photo alone is insufficient.

## Employee-added produce context

To improve the usefulness of the photo assessment, employees should add
structured context that a camera cannot reliably determine. Use
dropdowns, numeric inputs, and a short checklist so the information is
quick to capture on a phone. These inputs inform the estimate and
explain uncertainty; they never override an unsuitable condition, a
printed use-by date, or a cold-chain exception.

Storage environment: refrigerated, cool room, room temperature, or humid
produce area. Record the approximate temperature in °C when known and
flag temperatures outside the product profile.

Humidity or moisture: dry, normal, humid, wet/condensation present, or
unknown. For leafy produce and berries, record visible condensation or
standing water separately.

Time context: delivery date and time, time since the last condition
check, and whether the batch was already displayed, opened, cut, washed,
or repacked. Record harvest, packing, or opening dates only when known;
never infer them.

Employee freshness rating: 1–5, where 1 = clearly unsuitable or
widespread spoilage, 2 = poor and needs urgent action, 3 = acceptable
but ageing, 4 = good, and 5 = very fresh. Require a short reason for
ratings 1–2 and allow “not sure” when the batch cannot be judged.

Batch coverage: estimate whether the photo and check represent all of
the batch, most of it, or only a sample. Require a second photo or
manual review when the batch is mixed, blocked from view, or visibly
inconsistent.

Visible condition checklist: mould, leaking or split skin, bruising,
cuts, pests, unusual discolouration, shrivelling/wilting, excessive
softness, odour, and packaging damage. Each item should be Yes, No, or
Not checked, with notes and the affected quantity where possible.

## Produce-specific parameters

Show only the relevant prompts for the selected product. The following
parameters are realistic demo fields and should be stored with the
assessment version.

| Produce type                                           | Additional employee inputs                                                                                                            | Useful condition signals                                                                        |
|--------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Whole fruit such as apples, pears, bananas             | Ripeness: unripe, ready, ripe, overripe; firmness: firm, slightly soft, soft, very soft; bruised quantity estimate                    | Skin wrinkling, pressure damage, stem condition, brown spots, leaking, mould, and unusual odour |
| Berries and grapes                                     | Bunch/pack condition; dry, damp, or condensation present; percentage visibly affected; berries still attached to stems where relevant | Mould, leaking juice, crushed fruit, shrivelling, soft spots, and wet packaging                 |
| Leafy vegetables and lettuce                           | Crispness: crisp, slightly limp, limp; leaf moisture; trimmed/cut state; approximate affected leaves                                  | Wilting, yellowing, sliminess, browning at cut edges, mould, and standing water                 |
| Firm vegetables such as carrots, broccoli, cauliflower | Firmness: firm, slightly flexible, soft; crown/flower condition; cut or whole; approximate affected quantity                          | Florets opening or yellowing, rubberiness, dark spots, cracking, mould, and odour               |
| Tomatoes and other cold-sensitive produce              | Storage temperature and location; ripeness/colour stage; time held refrigerated if known                                              | Over-softness, wrinkling, chilling damage, splits, leaking, mould, and odour                    |

Use the 1–5 rating as an employee observation, not as a safety score or
a direct number of remaining days. Keep it separate from the model
estimate and show both in the history.

When employees disagree with the suggested deadline, they may shorten it
and record a reason. Extending it requires the existing logged manager
review. Changed inputs invalidate any pending confirmation.

For sealed meat and dairy, use the same storage and condition fields
where helpful, but require the printed date and storage instructions.
The employee rating must not extend a use-by date or replace manual
verification.

## AI and recommendation behaviour

The primary AI feature is freshness estimation from the image and
supporting information. Progressive phase pricing is a separate
rule-based automation.

- Accept the image, produce type, delivery date, storage condition
  history where known, and employee checklist. Never infer a complete
  storage history from a photo.
- Return a remaining-freshness range, proposed deadline, visible
  observations, limitations, and an explanation of the inputs used. Do
  not invent a confidence percentage.
- Do not equate cosmetic imperfections with unsuitability. Surface
  uncertainty and let the employee inspect the actual batch.
- For a deadline of 10 November, show the first eligible markdown on 8
  November, the next on 9 November, and the final phase on 10 November,
  each subject to a new condition confirmation.
- Define a replaceable image-assessment service. A working image model
  can provide visual observations; any mapping from observations to
  remaining days is a demonstrator assumption until validated against
  labelled produce outcomes.
- The demo must work without external API credentials using
  deterministic sample assessments. Clearly label that mode as simulated
  AI; arbitrary uploaded photos in this mode must receive a
  manual-review fallback rather than a fake image-specific result.
- External image inference, if used, must run through a server-side
  connection with credentials kept out of the browser. Label its
  freshness output as an unvalidated estimate.
- Demand forecasting is optional later work. It is no longer the primary
  AI feature or a dependency for the first demo.

## Core screens

| **Screen**                  | **Required contents**                                                                                                                               |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| Dashboard                   | Attention queue, condition checks due, near-deadline stock, failed syncs, and links to batches                                                      |
| Inventory                   | Search and filter by product, category, phase, date, and status; add or edit a sample batch                                                         |
| Batch details               | Product and batch information, quantity, photo, delivery and storage details, freshness range, confirmed deadline, prices, explanation, and history |
| Capture and condition check | Camera/upload, delivery date, storage details, checklist, assessment review, and confirm-or-withdraw actions                                        |
| Integrations                | Mock EDEKA outbound updates, payload preview, status, retry, and link to the read-only customer view                                                |
| Results and settings        | Recorded sales/disposals, discount rules, price limits, role switcher, demo clock, and reset                                                        |

Use readable cards and prominent actions on mobile. Display urgency
through text as well as colour. Provide empty states, validation
messages, and clear feedback after actions.

Multi retailer platform and store discovery

## The platform must support different grocery retailers and independent stores. EDEKA is one illustrative retailer configuration for the university demo, not a platform-wide dependency. Freshness assessment, batch logic, discount limits, and employee confirmation are shared capabilities; retailer branding, product mapping, pricing, store rules, integrations, and customer store discovery are configurable.

Separate retailer, store, product, and batch records. A retailer owns
its brand and integration settings; a store owns its address,
coordinates, timezone, opening hours, local rules, and inventory; a
product can have different retailer mappings, names, prices, and units;
each batch remains store-specific.

Replace EDEKA-specific core fields with retailer_id, store_id,
retailer_product_mapping, retailer_offer_format, store_location, and
customer_selected_store. Keep EDEKA as seeded demo data and label it as
an illustrative configuration.

Allow each retailer or store to configure discount phases, lower maximum
discounts, minimum selling prices, manager-approval rules, eligible
categories, currencies, languages, VAT display, units, batch labels, and
integration behavior. The platform-wide maximum discount remains 30%.

Keep offers scoped to a store and batch. Identical products in different
stores or batches must retain separate quantities, prices, assessments,
offer IDs, and histories.

Location based customer store suggestions

## Customers may discover nearby stores using approximate location, GPS permission, postcode, city, or a manually selected store. Location is optional. The app should explain why it requests location, provide a manual fallback, and avoid retaining precise coordinates unless the user explicitly allows it.

Support GPS permission, approximate location, postcode/city search, and
manual store selection. If permission is denied or unavailable, continue
with the manual search flow.

Let the customer choose a search radius such as 2 km, 5 km, or 10 km and
remember a preferred store only when the customer chooses to do so.

Rank stores primarily by product availability, then distance or travel
time, offer relevance, opening status, and customer preference. Do not
recommend a much farther store only because its discount is slightly
larger.

Show retailer name, store name, distance, opening status, active offer
count, product availability, and last-updated time. Show a clear
no-results state when no suitable store is nearby.

Do not expose internal condition checklists, speculative safety claims,
employee identities, or precise stock figures that could be misleading.
Use approximate availability such as limited, available, or sold out
where appropriate.

Handle location and offer freshness separately: a store can be nearby
but its offer may have expired, sold out, failed to sync, or become
unavailable while the customer is viewing it.

Additional platform records

## Add the following records or fields to support multiple retailers and location-aware discovery:

| Record                       | Essential information                                                                                                                                          |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Retailer                     | ID, name, brand settings, supported languages/currencies, discount policy, integration configuration, and demo/live status                                     |
| Store location               | Store ID, retailer ID, address, latitude/longitude or geocoded area, timezone, opening hours, temporary closure status, and accessibility notes where relevant |
| Customer location preference | Permission state, approximate area or postcode, selected radius, preferred stores, selection method, and retention choice; do not require precise coordinates  |
| Retailer product mapping     | Internal product ID, retailer SKU/barcode, retailer name, category, unit basis, packaging, tax display, and mapping status                                     |
| Store ranking result         | Customer query area, eligible stores, distance/travel estimate, availability signal, ranking factors, timestamp, and result expiry                             |
| Integration configuration    | Retailer/store destination, authentication reference, payload format, supported operations, sync status, and failure policy                                    |

Acceptance additions

A store manager can configure a retailer identity, store details,
opening hours, products, price rules, and offer visibility without
changing the shared freshness logic.

A customer can select or change a store using GPS, approximate location,
postcode/city, or manual selection. Denying location permission does not
block browsing.

Customer results show only active, successfully synced offers for the
selected store and remove sold-out, withdrawn, expired, or failed-sync
offers from the active view.

The demo can seed at least two retailers and multiple stores with
different products, prices, opening hours, and offers while keeping each
batch and offer separate.

## Retailer app connection

The intended future destination is the selected EDEKA store’s
customer-app offers. The university demo uses a mock EDEKA adapter and a
separate read-only customer preview. The preview should be familiar as a
grocery-offers interface and explicitly labelled as a university
concept, without implying official affiliation.

- Each outbound offer includes store ID, retailer product mapping,
  batch/offer ID, eligible quantity, original price, discounted price,
  currency, validity window, and update version.
- Scope offers to the eligible batch. A near-expiry batch must not
  silently change the price of all fresh stock with the same product
  code.
- Customers select the illustrative store and see product image,
  original/current price, percentage reduction, unit basis,
  availability, and offer validity.
- The mock preview identifies the offer as applying only to the marked
  batch while stock lasts. Employees assign a batch label or location so
  customers can distinguish it from newer stock. No reservation or
  checkout is included.
- Customers do not see internal condition checklists, speculative safety
  claims, or a guaranteed expiry date.
- Show the published store price separately from the last successfully
  synced app price. Failed syncs must not appear successful.
- Retry the same update safely without creating duplicate offers. A
  newer confirmed phase supersedes older pending price updates.
- When stock reaches zero, the deadline passes, or the batch is
  withdrawn, expire the local offer immediately and send a withdrawal
  update. Make pending or failed withdrawal syncs visible.
- Future real integration requires retailer authorisation, API
  specifications, product mapping, and agreement on how batch-specific
  offers are represented. These are dependencies, not assumed
  capabilities.
- Shelf-label and checkout synchronisation are outside the demo.
  Customer preview prices do not imply a real till price change.

## Main data records

| **Record**                  | **Essential information**                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Store                       | ID, name, timezone, currency, selected mock retailer, discount settings                                                                                                                                                                                                                                                                                               |
| Product                     | ID, barcode or SKU, name, category, original price, price floor, maximum discount capped at 30%, retailer mapping, freshness reference profile ID, assessment mode                                                                                                                                                                                                    |
| Batch                       | ID, product/store IDs, quantity received and remaining, delivery date, known harvest/packing/opening dates, printed date and date type, sealed/opened state, storage details and temperatures, unit, photo reference, assessment version, estimated freshness range, confirmed selling deadline, deadline basis, condition, status, current published price and phase |
| Freshness reference profile | Food, state, storage conditions, source time origin, published interval and unit, source URL, research date, household/commercial context, eligible assessment mode; unknown values remain null                                                                                                                                                                       |
| Assessment                  | Batch, image reference, input details, simulated/model/manual mode, observations, remaining-life range, proposed deadline, limitations, reviewer, timestamp                                                                                                                                                                                                           |
| Recommendation              | Batch, eligible phase, proposed price, assessment explanation, creation time, status, input version                                                                                                                                                                                                                                                                   |
| Decision                    | Recommendation, actor role, action, condition check result, deadline confirmation or exception, resulting price, reason if needed, timestamp                                                                                                                                                                                                                          |
| Stock movement              | Batch, quantity, sale/disposal/correction type, timestamp, disposal reason, revenue where applicable                                                                                                                                                                                                                                                                  |
| Sync event                  | Offer/update IDs, destination, payload version, pending/success/failed status, attempts, timestamps, failure reason                                                                                                                                                                                                                                                   |

Persist changes across page refreshes. For a single-user demo, browser
storage or a small local database is acceptable; production concurrency
and security are outside scope.

## Sample data and demo controls

- Seed apple batches with varied conditions and ages, plus example
  strawberries, grapes, pears, carrots, broccoli, and lettuce. Add
  sealed chicken, beef, milk, and yoghurt batches with explicit
  fictional label dates. Keep unsupported image assessments in manual or
  clearly simulated mode.
- Include a produce batch delivered today that was already several days
  old, an unknown-history batch, and a sealed meat batch with a printed
  deadline earlier than a generic reference interval would suggest.
- Include all phases, low stock, sold-out stock, an unsuitable batch, a
  price-floor restriction, and a batch with insufficient assessment
  information.
- Include sample photos with known demo assessments, an unreadable-photo
  case, and an unsupported-produce case. Clearly identify all assessment
  outputs and inventory as sample data.
- Provide actions to advance the clock by one day, record sales, record
  disposal, simulate sync failure, retry sync, and restore the original
  dataset.
- Seed dates relative to a fixed scenario start date so the
  demonstration remains repeatable.
- Never use the fictional restaurant interview as validated customer
  research or genuine training data.

## Sample storage-life research

Research checked on 28 October 2026. This is a starter reference
catalogue for the university demo, not EDEKA policy, validated
commercial shelf-life data, or training labels for the image model. Most
sources describe household storage after purchase, while some
horticultural sources begin at harvest. Neither can be applied as a
fresh countdown from store delivery without knowing prior age and
handling.

Intervals below are paraphrased from the linked sources. “Up to” values
are upper guidance bounds, not guaranteed minimums. A single value is an
approximate guide, not an exact expiry date. Ripeness, cultivar,
packaging, temperature, humidity, and previous handling can change
results.

Starter shelf life defaults for recommendations

Add a small, replaceable reference catalogue so the demo can suggest
when an employee should review a batch and consider a markdown. The
values below are conservative planning defaults for a correctly stored,
unopened or whole product, measured from the recorded delivery date only
when no earlier age is known. They are not safety limits, expiry dates,
or guarantees. If harvest/packing age, cold-chain history, or condition
is unknown, lower confidence and require the employee assessment rather
than silently restarting the clock.

| Product group                      | Demo default | Storage assumption                                 | Recommendation use                                                                |
|------------------------------------|--------------|----------------------------------------------------|-----------------------------------------------------------------------------------|
| Apples, whole                      | 10 days      | Refrigerated / cool produce storage                | Start review on day 8; inspect firmness, bruising, mould, and prior age.          |
| Pears, ripe                        | 5 days       | Refrigerated after ripening                        | Start review on day 3; ask for ripeness and softness.                             |
| Bananas, whole                     | 7 days       | Room temperature, away from excess heat            | Start review on day 5; brown skin alone is not rejection.                         |
| Strawberries and raspberries       | 2 days       | Refrigerated, dry, unwashed                        | Review on day 1; any mould or leaking affected units are removed.                 |
| Grapes                             | 5 days       | Refrigerated, dry and ventilated                   | Start review on day 3; check stems, soft berries, and mould.                      |
| Oranges, lemons, and other citrus  | 14 days      | Cool, dry storage; refrigerate if appropriate      | Start review on day 10; inspect softness, mould, and damaged peel.                |
| Tomatoes, whole                    | 5 days       | Room temperature / cool, not cold-chilled          | Start review on day 3; check ripeness, splits, and leaking.                       |
| Broccoli and cauliflower           | 5 days       | Refrigerated, humid but not wet                    | Start review on day 3; check yellowing, open florets, and odour.                  |
| Leaf lettuce and leafy greens      | 5 days       | Refrigerated, humid, protected from standing water | Start review on day 3; check wilting, slime, browning, and mould.                 |
| Carrots, whole                     | 10 days      | Refrigerated, dry and ventilated                   | Start review on day 7; check flexibility, shrivelling, and mould.                 |
| Cucumbers, peppers, and courgettes | 5 days       | Cool produce storage; avoid chilling damage        | Start review on day 3; check soft ends, splits, and pitting.                      |
| Mushrooms                          | 5 days       | Refrigerated, breathable packaging                 | Start review on day 3; check slime, darkening, and odour.                         |
| Potatoes and onions, whole         | 14 days      | Cool, dark, dry storage                            | Start review on day 10; check sprouting, soft spots, and mould.                   |
| Fresh chicken or turkey            | 1–2 days     | Sealed and continuously chilled                    | Use printed use-by date and storage instructions; never extend from this default. |
| Ground meat                        | 1–2 days     | Sealed and continuously chilled, often at 2–4°C    | Use printed use-by date; missing date or cold-chain concern blocks automation.    |
| Beef, pork, or lamb steaks         | 3–5 days     | Sealed and continuously chilled                    | Context only; printed date and employee check control publication.                |
| Fresh fish                         | 1–2 days     | Sealed and continuously chilled                    | Use printed use-by date and product instructions; manual review for uncertainty.  |
| Milk, yoghurt, and fresh dairy     | Printed date | Unopened and stored according to label             | Do not calculate from delivery; use MHD/use-by and storage instructions.          |
| Bread and baked goods              | 3 days       | Room temperature, dry and sealed                   | Start review on day 2; check mould and staleness; discard mouldy items.           |

Recommendation rule: when the demo clock reaches the review day, create
a freshness task rather than automatically applying a discount. The
employee must complete the condition check and confirm the proposed
deadline before any offer is published.

Adjust the planning horizon for the employee freshness rating, storage
deviation, known prior age, and affected quantity. Do not convert the
1–5 rating directly into days. A rating of 1–2, visible mould, leaking,
slime, unsafe temperature history, or an expired use-by date blocks the
offer.

Store each default with product, state, storage temperature/range, time
origin, source URL, checked date, and limitations. Make the catalogue
editable by a manager and show the source and “demo reference” label in
the employee view.

Starter sources: BZfE storage guidance
(https://www.bzfe.de/kueche-und-alltag/kochen/lebensmittel-richtig-lagern),
FoodSafety.gov Cold Food Storage Chart
(https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts),
Verbraucherzentrale meat guidance
(https://www.verbraucherzentrale.de/wissen/lebensmittel/auswaehlen-zubereiten-aufbewahren/fleisch-das-muessen-sie-bei-haltbarkeit-und-lagerung-beachten-58928),
and BZfE date guidance
(https://www.bzfe.de/kueche-und-alltag/kochen/haltbarkeit-von-lebensmitteln).

Detailed recommendation logic

The shelf-life catalogue provides a starting review horizon, but it must
not produce a discount recommendation by itself. The app first checks
whether the batch has enough reliable history and then combines the
employee condition check with the calendar phase.

| Situation                                                                                  | System response                                                                                | Employee action                                                                            | Discount suggestion                                                       |
|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Prior age, storage, and condition are sufficiently known; no red flags                     | Create a recommendation using the current calendar phase and the product profile               | Review the photo, inspect the batch, and confirm the result                                | 10% at two days before deadline; 20% one day before; 30% on deadline day  |
| Prior age or storage history is unknown or contradictory                                   | Do not calculate a discount recommendation; mark the batch “manual review required”            | Enter best-known history, complete the full condition check, and set or shorten a deadline | No suggestion until manual review is completed                            |
| Rating 4–5 and no critical condition flags                                                 | Treat the batch as apparently suitable for the current phase, subject to employee confirmation | Confirm the current phase and verify that quantity and price limits are current            | Suggest the phase percentage: 10%, 20%, or 30%                            |
| Rating 3 or mixed condition across the batch                                               | Keep the batch reviewable but lower confidence and identify affected units                     | Separate or remove unsuitable units, record quantity, and reassess the remaining batch     | Suggest 10% only if the employee confirms suitability; otherwise no offer |
| Rating 1–2, mould, slime, leakage, abnormal odour, unsafe temperature, or failed checklist | Block publication and queue withdrawal or manager review where appropriate                     | Remove unsuitable goods and record the reason; do not extend the deadline                  | No discount suggestion                                                    |
| Printed use-by date or required storage instruction is missing, unreadable, or exceeded    | Block automated publication                                                                    | Verify the label and storage manually                                                      | No discount suggestion; use the printed date when verified                |

Use the same required input structure for every product group: product
state, storage environment, approximate temperature, humidity or
moisture, known prior age, packaging/opening state, employee freshness
rating, batch coverage, and visible-condition checklist.
Product-specific prompts add detail but do not remove the common fields.

The employee freshness rating is an observation, not a mathematical
conversion to remaining days. The app may use it to select a review path
and suggest a discount phase, but the employee must confirm the batch
before publication.

When the employee confirms a suggestion, save the selected percentage,
condition evidence, assessment version, actor, timestamp, and any
quantity removed. If the inputs change, invalidate the suggestion and
require a new review.

### Fruit reference profiles

| **Food and state**               | **Published storage guidance**                                         | **Storage conditions and time origin**                                                                                         | **Application interpretation**                                                                            | **Source**                                                                                                                        |
|----------------------------------|------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Apples, whole                    | Up to about 1 month                                                    | Household refrigerator, in a plastic bag; not a period measured from harvest or store delivery                                 | Quality reference only; record variety and prior condition. Do not assign every delivery another month.   | [Purdue FoodLink apple](https://extension.purdue.edu/foodlink/food.php?food=apple)                                                |
| Strawberries, whole and unwashed | Up to 2 days                                                           | Cool place or refrigerator vegetable compartment; household post-purchase guidance, stems retained and damaged berries removed | Already very short-lived batches may enter the first or a later discount phase immediately.               | [BZfE strawberries](https://www.bzfe.de/kueche-und-alltag/vom-acker-bis-zum-teller/erdbeeren/erdbeeren-vom-einkauf-in-die-kueche) |
| Grapes, whole and unwashed       | Up to 5 days                                                           | Household refrigerator, loosely held in a bag or paper towel                                                                   | Inspect individual fruit and stems; do not treat one visible surface as representative of the full batch. | [Purdue FoodLink grape](https://www.extension.purdue.edu/foodlink/food.php?food=grape)                                            |
| Pears, ripe                      | Up to 5 days refrigerated; 1–4 days at room temperature after ripening | Ripeness is the starting condition; unripe fruit first ripens at room temperature                                              | Record ripeness explicitly; the ripe interval is not an interval for newly harvested or unripe pears.     | [Purdue FoodLink pear](https://www.extension.purdue.edu/foodlink/food.php?food=pear)                                              |
| Bananas, whole                   | About 1 week                                                           | Household pantry around 16°C; ripeness and ethylene exposure matter                                                            | Brown skin spots are not alone proof of unsafe fruit. No universal seven-day delivery timer.              | [Verbraucherzentrale NRW banana](https://www.verbraucherzentrale.nrw/richtiglagern/banane)                                        |

### Vegetable reference profiles

| **Food and state**       | **Published storage guidance** | **Storage conditions and time origin**                                                                            | **Application interpretation**                                                                        | **Source**                                                                                                                                                                  |
|--------------------------|--------------------------------|-------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Carrots, whole           | Usually at least 7–10 days     | Household refrigerator vegetable compartment; packaging and condensation affect storage                           | This is a guide, not a ten-day upper safety limit or retail deadline.                                 | [Federal Agriculture Information Centre carrots](https://www.landwirtschaft.de/einkauf/lebensmittel/pflanzliche-lebensmittel/moehren)                                       |
| Broccoli                 | 5–6 days                       | Household refrigerator, bag with a damp cloth; post-market storage guidance                                       | Use this reference profile consistently; do not mix it with longer ideal post-harvest intervals.      | [Purdue FoodLink broccoli](https://extension.purdue.edu/foodlink/food.php?food=broccoli)                                                                                    |
| Head lettuce, unwashed   | 5–7 days                       | Household refrigerator at approximately 0–4°C, moisture-resistant wrap or container                               | Whole-head profile only, not ready-cut bagged salad.                                                  | [NDSU Food Storage Guide, printed p. 8, hosted by Purdue](https://www.extension.purdue.edu/extmedia/HHS/HHS-785-W.pdf)                                                      |
| Cauliflower              | About 1 week                   | Household refrigerator at approximately 0–4°C                                                                     | Post-purchase household guide, not commercial controlled-atmosphere storage.                          | [NDSU Food Storage Guide, printed p. 8](https://www.extension.purdue.edu/extmedia/HHS/HHS-785-W.pdf)                                                                        |
| Ripe red tomatoes, whole | About 5 days                   | Horticultural post-harvest guidance: cool, around 13°C, in perforated bags; source discourages cold refrigeration | Keep separate from household refrigerator profiles. Do not imply the period starts again at delivery. | [University of Minnesota vegetable storage](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/harvesting-and-storing-home-garden-vegetables) |

German BZfE guidance also distinguishes cold-sensitive produce from
refrigerator-suitable produce. Do not use one refrigeration rule for all
vegetables. Apples should be kept away from ethylene-sensitive produce.
[BZfE storage
guidance](https://www.bzfe.de/kueche-und-alltag/kochen/lebensmittel-richtig-lagern),
[BZfE
apples](https://www.bzfe.de/kueche-und-alltag/vom-acker-bis-zum-teller/aepfel/aepfel-vom-einkauf-in-die-kueche).

### Meat reference profiles

All four intervals in this table are US household refrigerated-storage
guidance at 4°C or below, not permitted German supermarket display
periods. Actual package instructions can require colder storage, and
packaging can change shelf life. Do not use these intervals to replace
printed use-by dates or approved store procedures. Source for all four:
[FoodSafety.gov Cold Food Storage
Chart](https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts),
reviewed 19 September 2023.

| **Food and state**                   | **Published household refrigerated interval** | **Use in the demo**                                                                                                |
|--------------------------------------|-----------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Raw chicken, whole or pieces         | 1–2 days                                      | Reference context only; sealed demo pack uses its explicit fictional use-by date and storage instructions.         |
| Raw ground beef or other ground meat | 1–2 days                                      | Do not apply this as a blanket allowance for freshly minced meat in Germany; retail handling and packaging differ. |
| Raw beef steak or roast              | 3–5 days                                      | No inference about safety or extra days from a photo.                                                              |
| Raw pork chops or roast              | 3–5 days                                      | Keep raw and cooked profiles distinct; printed pack date controls the offer.                                       |

### Dairy reference profiles

| **Food and state**         | **Published guidance**                  | **Context and use in the demo**                                                                                                                                   | **Source**                                                                                                  |
|----------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Milk, opened               | About 3 days refrigerated after opening | Household consumption reference only. Opened retail packs are not eligible for offers in this demo; unopened packs use their printed date.                        | [BZfE milk](https://www.bzfe.de/kueche-und-alltag/vom-acker-bis-zum-teller/milch/vom-einkauf-in-die-kueche) |
| Yoghurt                    | 7–14 days refrigerated                  | NSF household guidance from purchase at about 4.4°C; source does not distinguish opened/unopened, so do not invent that field. Sealed retail packs use their MHD. | [NSF cold storage](https://www.nsf.org/consumer-resources/articles/cold-frozen-food-storage)                |
| Hard cheese, such as Swiss | 3–4 weeks refrigerated                  | NSF purchase-based household guidance, not time from manufacture; opening state unspecified. Retail pack date controls.                                           | [NSF cold storage](https://www.nsf.org/consumer-resources/articles/cold-frozen-food-storage)                |
| Soft cheese, such as Brie  | About 1 week refrigerated               | NSF purchase-based household guidance; distinguish this profile from hard cheese and follow the retail pack date.                                                 | [NSF cold storage](https://www.nsf.org/consumer-resources/articles/cold-frozen-food-storage)                |
| Cottage cheese             | About 1 week refrigerated               | NSF purchase-based household guidance; storage at about 4.4°C. This is not a generic shelf life for every fresh cheese.                                           | [NSF cold storage](https://www.nsf.org/consumer-resources/articles/cold-frozen-food-storage)                |

### How research affects application logic

1.  Save each profile’s source URL, checked date, food state, storage
    conditions, time origin, interval unit, and limitations. Preserve
    approximate and upper-bound qualifiers; do not force every entry
    into an exact number of days.
2.  For produce, use reference profiles as explanatory context. A photo,
    delivery date, and generic table cannot validate remaining life. In
    the university demo, use labelled sample assessments or manual
    review; known packing/harvest dates can add context but do not
    establish guaranteed shelf life.
3.  Never compute
    `selling_deadline = delivery_date + published_household_storage_days`.
    If pre-delivery age or conditions are unknown, record that
    uncertainty rather than restarting the clock.
4.  For sealed meat and dairy, collect the printed date, its type,
    packaging state, and required storage conditions. Photo input may
    assist label reading, subject to employee verification; it cannot
    establish or extend the safe life of these foods.
5.  Follow German date distinctions: MHD is a quality date, whereas
    goods cannot be sold after the use-by date. The demo conservatively
    removes both types at their printed deadline; this is stricter than
    the general treatment of MHD, not an assertion that MHD and use-by
    mean the same thing. [LAVES date
    guidance](https://www.laves.niedersachsen.de/startseite/lebensmittel/lebensmittelhygiene/verbrauchertipps_zum_umgang_mit_lebensmitteln/das-mindesthaltbarkeitsdatum-und-das-verbrauchsdatum-108368.html).
6.  Start phase 1 two days before the applicable confirmed deadline.
    Short-lived batches arriving with less time jump directly to the
    eligible phase after condition confirmation; never extend their
    deadline to fit a three-phase sequence.
7.  All categories use the same 30% absolute maximum. For example, a
    fictional sealed milk batch with an MHD of 10 November is eligible
    for 10% on 8 November, 20% on 9 November, and 30% on 10 November,
    subject to condition and storage checks. This date is invented demo
    data, not calculated from the opened-milk interval.

## Results and measurement

Show units sold after markdown, revenue from those sales, units
discarded, stock remaining near its deadline, and sync success/failure
counts. Calculate metrics from recorded transactions rather than
decorative counters.

Call sales “units sold after markdown,” not automatically “food saved.”
Real waste avoided requires a credible comparison with what would have
happened without the intervention. If a baseline simulation is added
later, identify its assumptions and distinguish estimated results from
observed demo transactions.

## Acceptance criteria

1.  An employee can capture/upload a photo, provide the required
    delivery/storage/checklist inputs, and save a batch across page
    refreshes.
2.  The app presents a labelled freshness estimate and requires review
    of the proposed deadline. Missing or unsupported image inputs
    receive a fallback.
3.  The first markdown becomes eligible exactly two calendar days before
    the confirmed deadline; the next phases occur one day before and on
    that day.
4.  Each phase requires a fresh employee condition confirmation, then
    publishes the store-set price without routine manager approval.
5.  Unsuitable or unconfirmed condition blocks publication. Only the
    manager can change rules or authorise logged exceptions.
6.  Percentages use the original price and do not compound. No effective
    discount exceeds 30%, including after rounding, manual changes, and
    sync. Verify EUR 2.99 becomes no less than EUR 2.10 at the final
    phase; reject attempts to configure 31% or bypass a stricter product
    floor/cap. Input changes invalidate stale confirmations.
7.  Successful mock sync updates the matching customer offer. Failures
    show a clear error, can be retried without duplication, and never
    appear successful.
8.  Separate batches of the same product retain distinct quantities,
    assessments, prices, and offers.
9.  Sold-out, withdrawn, past-deadline, or condition-paused offers
    become inactive locally and queue a customer-preview withdrawal.
    Failed syncs are visible; the preview independently honours validity
    end times.
10. Sales and disposal update stock and metrics consistently. Unit
    measures remain consistent for weighed and countable products.
11. Customer, employee, and store-manager views expose only their
    relevant actions. The main workflow works on a phone-sized screen.
12. Demo reset restores the original scenario. Sample AI responses and
    simulated integration are clearly labelled throughout.
13. Every reference profile preserves its source, conditions, and time
    origin. The application never resets a household storage interval at
    a retail delivery date.
14. Meat/dairy dates govern those offers; missing dates and cold-chain
    exceptions block automated publication. No image output extends a
    printed use-by date.
15. Batches entering the app with fewer than two days left jump to the
    eligible phase after condition confirmation. No earlier phase or
    discount above 30% is invented to compensate.

## Out of scope for the first version

- Restaurants, fast-food operations, and preparation planning.
- Live retailer APIs, live point-of-sale data, shelf-label hardware, and
  real payment processing.
- Customer sign-in, checkout, reservations, or a standalone consumer
  app.
- Publication without employee condition confirmation or outside
  store-set pricing limits.
- Food-safety certification, guaranteed expiry prediction, automatic
  deadline extension, or diagnosis of invisible contamination.
- Production authentication, billing, complex multi-store
  administration, and deployment at real stores.
- Proven optimal pricing, verified carbon savings, or measured
  real-world waste reduction.

## Implementation order

1.  Seed apple batches, sample photos, persistence, the three persona
    views, and demo clock.
2.  Capture workflow, supporting inputs, mock assessment service, and
    employee deadline review.
3.  Two-day discount trigger, progressive phase engine, store rules, and
    employee confirmation gates.
4.  Mock EDEKA adapter, customer preview, sync failures/retries, and
    offer withdrawals.
5.  Transaction-based results, mobile usability, optional real
    image-model connection, and acceptance checks.

## Decisions to revisit

- Product name, visual identity, and final interface language.
- Whether to adjust the provisional 10%, 20%, and 30% phases; the 30%
  maximum is fixed.
- How many researched produce profiles to demonstrate beyond apples and
  which sealed meat/dairy examples to include.
- Whether the assignment requires a live image model or permits
  explicitly simulated assessments.
- Image model/provider, labelled evaluation data, and how to validate
  freshness estimates before any real deployment.
- Technical stack, hosting, and any future authorised EDEKA connection.
