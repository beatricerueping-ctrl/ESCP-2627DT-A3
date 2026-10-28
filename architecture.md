# Architecture: Prototype

This is the architecture for the FreshCut **prototype**. Its job is to show the core loop works: a delivery is logged, rated, given a suggested discount, approved by a manager, and shown to shoppers through a feed.

The full production design is in `architecture-production.md`. Nothing in this prototype should block moving to it later.

---

## 1. What the prototype proves

1. Staff can log a delivery and rate its freshness in under 60 seconds.
2. The system computes a sensible discount from remaining life and stock.
3. A manager can accept, change, or reject a suggestion.
4. An approved discount appears in a feed that Edeka's app could read.
5. Food-safety rules block discounts for unknown or breached cold chain, and for expired stock.

## 2. Out of scope for the prototype

- Real Edeka data, real users, or real shelf prices
- Customer app, notifications, or accounts
- Store displays
- Image AI (the AI score is simulated, see section 5)
- Offline sync
- Retuning, prediction logging, and learning
- Multi-tenant security, MFA, and detailed roles
- Escalation timers
- Production hosting, monitoring, and EU data-residency setup

## 3. Stack

| Part | Choice |
|---|---|
| Backend | Python, FastAPI |
| Database | SQLite (one file, no server to run) |
| Frontend | Single HTML/JavaScript page, starting from `prototype/index.html` |
| Discount logic | Plain Python module with unit tests |
| Run | Local, one command to start the API and serve the page |

## 4. Components

```
 Browser (prototype/index.html)
   ├── Staff screens: log delivery, photo, rating
   └── Manager screen: suggestion queue, accept / change / reject
          │
          ▼
 FastAPI app
   ├── /api/...        staff and manager endpoints
   ├── /feed/...       read-only discount feed
   ├── discount.py     discount rule (smallest discount that clears stock)
   └── seed.py         creates fake stores, items, and deliveries
          │
          ▼
 SQLite file
```

## 5. The batch flow

1. **Log.** Staff enter store, item, quantity, and whether the cold chain was OK. This creates one batch.
2. **Photo.** The photo is saved. In the prototype, the AI score is simulated by a fixed value (default 4). The real image model comes later.
3. **Rate.** Staff give a 1 to 5 rating. The prototype uses the worker rating alone.
4. **Estimate.** Remaining days are calculated (section 6).
5. **Suggest.** The discount rule runs and creates a suggestion (section 7).
6. **Review.** The manager accepts, changes, or rejects the suggestion.
7. **Publish.** An accepted suggestion becomes a published discount, visible in the feed.

## 6. Remaining days

```
remaining_days = max(0, base_life_days[category] × life_factor[rating] − days_since_delivery)
```

- `base_life_days` per category comes from `evidence.md`.
- `life_factor` for the rating comes from the table in `evidence.md` (5 → 1.00, 4 → 0.85, 3 → 0.70, 2 → 0.50, 1 → 0.25).
- Cold chain is a simple flag in the prototype:
  - OK → no change.
  - Not OK → the batch is blocked from discounting until a manager confirms it.
  - Not recorded → blocked.
- Expired batches (`remaining_days = 0`) cannot be discounted.

## 7. The discount rule

```
d* = (S / (r0 × L) − 1) / k
```

| Symbol | Meaning | Prototype value |
|---|---|---|
| `S` | Units remaining | From the batch |
| `L` | Remaining days | From section 6 |
| `r0` | Units sold per day at full price | Seed data, per item |
| `k` | Uplift per unit of discount (positive) | 1.5 for every item |

Steps:

1. If `L ≤ 0` or `S ≤ 0`, stop. No suggestion.
2. If `d* ≤ 0`, no discount is needed.
3. Round up to the next 5% step.
4. Clamp to the store's min and max. If the result is above the max, mark the suggestion **at risk** and show the expected unsold units.

Store limits in the prototype are fixed per store: min 0%, max 30%.

## 8. Data model (prototype)

| Table | Fields |
|---|---|
| `store` | id, name |
| `item` | id, name, category, base_life_days, r0, k |
| `batch` | id, store_id, item_id, delivered_at, units_total, units_remaining, cold_chain_ok, status |
| `rating` | id, batch_id, score |
| `photo` | id, batch_id, path, ai_score |
| `suggestion` | id, batch_id, suggested_pct, status (pending, accepted, changed, rejected, at_risk), final_pct, reason |
| `discount` | id, batch_id, pct, starts_at, ends_at |
| `sale` | id, batch_id, sold_on, units |
| `waste` | id, batch_id, recorded_on, units |

Sales and waste are entered by hand in the prototype. Sales are assigned directly to a batch, so FIFO allocation is not needed yet.

## 9. Screens

These follow `design.md`, with the customer and display screens left out:

- **Staff:** Home, Log delivery, Photo, Rating, Submitted.
- **Manager:** Queue, Suggestion detail (accept, change, reject).

## 10. Feed (for Edeka's app to test against)

| Endpoint | Returns |
|---|---|
| `GET /feed/discounts?store_id=...` | Current published discounts for the store |

Each discount includes: `item_name`, `category`, `shelf_price`, `discount_pct`, `discounted_price`, `ends_at`.

- The prototype has no authentication. It runs locally only.
- Discounts past `ends_at` are not returned.
- No shopper data is involved.

## 11. Seed data

`seed.py` creates:

- 1 store
- 3 items per pilot category (berries, hard fruit, leafy greens, root vegetables, meat and poultry), with made-up `r0` values
- A few deliveries with mixed ratings, one batch with cold chain not OK, and one expired batch, so every rule can be tested

## 12. Acceptance checks

The prototype is working when these checks pass:

1. A new delivery creates a batch with the right units and status.
2. A rating of 5 on a 2-day-old batch gives a longer life than a rating of 2.
3. A batch with cold chain not OK cannot be discounted until a manager confirms.
4. An expired batch cannot be discounted.
5. The suggested discount is always a multiple of 5% and within the store's min and max.
6. A batch that cannot clear at the max is marked at risk, with expected unsold units shown.
7. Nothing reaches the feed until a manager accepts it.
8. An accepted discount appears in the feed and disappears after `ends_at`.
9. Unit tests for the discount rule cover the zero-stock, zero-life, and zero-sales cases.

## 13. Open questions

Each has a prototype default. Decide before the pilot, not before the prototype.

1. **Which Edeka company?** Not needed for the prototype.
2. **Chilled ranges for meat and poultry.** Prototype uses the simple OK / not OK flag.
3. **Max discount per category.** Prototype uses 30% for every store.
4. **Feed format Edeka uses.** Prototype exposes a simple JSON endpoint.
5. **Photo retention.** Prototype keeps photos until the run is reset.
