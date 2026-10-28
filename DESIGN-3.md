# Shelf Life — Design Specification

Version 1.0 · 28 October 2026 · Mobile prototype (portrait smartphone)

Shelf Life helps Berlin supermarkets sell food before it goes to waste. Store employees photograph products, confirm their condition in a short survey, and approve discounts. Customers find those discounts on a map of nearby supermarkets.

This document describes the product's visual identity, components, screens, motion and behaviour as built in the current prototype.

---

## 1. Design principles

1. **Premium and calm.** A minimal eco-tech look: soft turquoise ground, deep greens, generous space, few shadows.
2. **One identity from splash to last screen.** The green gradient ring and "S.L" monogram appear on every screen. The background never changes.
3. **Honest data.** Demo values are always labelled. The AI never claims to know expiry dates, internal freshness or food safety. Store-approved offers are visually distinct from sample data.
4. **People decide, the system suggests.** Employees approve every discount. Statuses come from transparent, configurable rules, shown on screen.
5. **Fast for busy staff.** Large tap targets, one primary action per screen, answers auto-advance through the survey.

---

## 2. Colour

### 2.1 Brand palette

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#E8F8F4` | Light pastel turquoise. Background of every screen. |
| `--forest` | `#145A32` | Deep forest green. Headings, monogram, primary text emphasis. |
| `--emerald` | `#008F65` | Emerald green. Primary buttons, selected states, links. |
| `--natural` | `#48B66A` | Vibrant natural green. Focus rings, status dots, progress fills. |
| `--sage` | `#8BC9A0` | Sage green. Borders, chip outlines, inactive stars. |
| `--mint` | `#B8E8C9` | Soft mint. Unselected chips, icon-button fills. |
| `--pastel` | `#D7F4DF` | Light pastel green. Selected list rows, stat tiles. |

### 2.2 Supporting neutrals

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#123A24` | Body text |
| `--muted` | `#4C7A60` | Secondary text (a darker sage, legible on `--bg`) |
| `--line` | `#C7E6D6` | Input borders, dividers |
| `--card` | `#FBFEFD` | Card surfaces |
| `--white` | `#FFFFFF` | Input fields, text on emerald |

The specified sage `#8BC9A0` is too light for small text on the turquoise background. Secondary text therefore uses `--muted`, a darker shade of the same hue.

### 2.3 Semantic colour

Semantic colours mark state only and never replace the brand accent.

| Meaning | Text | Background |
|---|---|---|
| Good | `#16764A` | `#D7F4DF` |
| Monitor | `#5B7A12` | `#EAF4D4` |
| Review / urgency (warm accent) | `#B9771A` | `#FBEFD9` |
| Immediate inspection | `#B4561A` | `#FBE3CF` |
| Hold / remove from sale | `#A8432E` | `#F8E1DA` |
| Manual review | `#4A5C66` | `#E9EEF0` |
| Demo label | `#7A5A12` | `#F7EBC9` |

Ordinary discounts never use red. Urgency (≤ 3 days) gets a subtle warm amber accent.

### 2.4 Discount badge scale

Badges darken as the discount grows, staying within the green family.

| Discount | Badge fill | Text |
|---|---|---|
| < 10% | `#8BC9A0` | Forest |
| 10–19% | `#48B66A` | White |
| 20–29% | `#008F65` | White |
| 30–39% | `#0B7550` | White |
| 40%+ | `#145A32` | White |

### 2.5 Theme

Shelf Life uses a single light theme by design. The turquoise background is part of the brand. Form controls use `color-scheme: light`.

---

## 3. Typography

| Role | Typeface | Usage |
|---|---|---|
| Display | **Cormorant Garamond** 500–700 (fallback Georgia, serif) | "S.L" monogram, greetings ("Hello, Alex!"), store and product names, the "Shelf Life" wordmark |
| UI / body | **Manrope** 400–800 (fallback Segoe UI, system-ui, sans-serif) | Everything else |

### Type scale

| Style | Size / weight | Example |
|---|---|---|
| Monogram (splash) | 68–104 px, Cormorant 600 | S.L |
| Greeting | 34 px, Cormorant 600, line-height 1.05 | Hello, Alex! |
| Store / product title | 30–31 px, Cormorant 600 | EDEKA Bahnhof Friedrichstraße |
| Wordmark | 23 px, Cormorant 600 | Shelf Life |
| Loyalty balance | 52 px, Manrope 800, tracking −0.03em | 1,250 Points |
| Section heading | 17 px, Manrope 800 | My Preferences |
| Body | 15 px, Manrope 400–600, line-height 1.45 | |
| Secondary | 14 px, `--muted` | Welcome back to Shelf Life. |
| Note / caption | 12.5 px, `--muted` | Source and demo explanations |
| Eyebrow | 11 px, Manrope 800, uppercase, tracking 0.14em | STAFF ACCESS |
| Tag | 10.5 px, Manrope 800, uppercase, tracking 0.08em | DEMO · STORE-APPROVED |

Under the splash monogram, "SHELF LIFE" is set in uppercase Manrope 600 with 0.22em tracking.

All prices, counts and dates use `font-variant-numeric: tabular-nums`. Headings use `text-wrap: balance`.

---

## 4. The brand ring

The logo is a thick donut ring filled with a continuous conic gradient of greens. It opens into an arch around the "S.L" monogram.

### 4.1 Gradient

A symmetric conic gradient with no visible segments:

```
#145A32 → #008F65 → #48B66A → #8BC9A0 → #B8E8C9 → #D7F4DF
→ #B8E8C9 → #8BC9A0 → #48B66A → #008F65 → #145A32
```

### 4.2 Geometry

| Property | Value |
|---|---|
| Splash ring width | 88% of screen width, max 388 px |
| Band thickness | 24% of outer radius (splash), 26% (mini logo) |
| Open arch | 200° sweep, centred on 12 o'clock, gap at the bottom |
| Gradient rotation at rest | 260° (forest green at the left end, pastel at the crown) |
| Ends | Rounded caps, each coloured to match the gradient at that point |

Construction: a `conic-gradient` background masked by two layers, intersected. A radial mask cuts out the hole; a conic mask limits the sweep. Round end-caps are separate circles placed on the band's centre line.

### 4.3 Sizes

| Context | Size |
|---|---|
| Splash | ~340–388 px |
| Login selection header | Splash ring scaled to ≤ 50% |
| Customer dashboard header | 46 px |
| Login screens | 46 px |
| Store, profile, product review headers | 38–40 px |
| Employee dashboard | 44 px |
| Loyalty card decoration | 210 px full ring, 38% opacity, cropped top-right |

The monogram inside the mini logo is Cormorant 700 at 33% of the logo size, in forest green.

---

## 5. Layout and spacing

- **Frame:** one phone-width column, max 440 px, full height. On larger screens it is centred with a soft outline and shadow.
- **Side gutter:** `max(18px, safe-area inset)` on every screen.
- **Safe areas:** top and bottom insets respected; fixed and floating elements add their edge's inset.
- **Vertical rhythm:** sections separated by 22 px above / 10 px below headings; stacks use 12 px gaps.
- **No horizontal scrolling** of the page. Only chip rows scroll sideways.
- **Touch targets:** at least 44 × 44 px. Primary buttons are 56 px tall.

### Radii

| Element | Radius |
|---|---|
| Primary buttons | 18 px |
| Small buttons, inputs | 13–14 px |
| Cards | 16 px |
| Product cards, tiles | 18 px |
| Survey question cards | 22 px |
| Hero cards (loyalty, scan button) | 24–26 px |
| Bottom sheets | 26 px top corners |
| Chips, status pills | Fully rounded |

### Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-s` | `0 2px 8px rgba(20,90,50,.08)` | Cards, list rows |
| `--shadow` | `0 6px 22px rgba(20,90,50,.10)` | Map, callouts, toasts |
| Primary button | `0 8px 20px rgba(0,143,101,.28)` | Emerald buttons only |
| Hero card | `0 14px 34px rgba(0,143,101,.32)` | Loyalty card, Scan a Product |

---

## 6. Components

### 6.1 Buttons

| Variant | Style | Use |
|---|---|---|
| Primary | Emerald fill, white text, emerald shadow | Customer Login, Log in, Save, Approve |
| Outline | Translucent pastel fill, forest text, 1.5 px emerald border | Employee Login, Adjust Discount |
| Ghost | Transparent, forest text, `--line` border | Secondary actions, demo clock |
| Warning | `--hold-bg` fill, hold-red text | Remove from sale, delete data |
| Icon button | 44 px circle, mint fill, forest icon | Profile, notifications |
| Link | Emerald, underlined | Forgot password?, Edit Preferences |

On press, buttons scale to 97.5%. Disabled buttons drop to 45% opacity.

### 6.2 Inputs

- 52 px tall, white, 1.5 px `--line` border, 14 px radius, 16 px text (prevents iOS zoom).
- Focus: emerald border plus a 4 px emerald glow at 14% opacity.
- Password fields have a "Show / Hide" text toggle inside the field.
- Errors appear below in hold-red, 13.5 px, and are announced to screen readers.

### 6.3 Chips (preferences and categories)

- 38 px tall, fully rounded, 1.5 px sage border.
- **Unselected:** mint fill, forest text.
- **Selected:** emerald fill, white text, check mark, soft emerald shadow.

### 6.4 Option rows (surveys)

- Full-width, 48 px minimum, white with a radio circle on the left.
- **Selected:** pastel fill, emerald border, filled emerald radio.
- An **"AI suggests"** tag sits at the right of the option the AI recommended. The employee still has to choose.

### 6.5 Product card

```
┌─────────────────────┐
│ [30% OFF]   image   │  4:3 image or category illustration
├─────────────────────┤
│ FRUITS · FOR YOU    │  category eyebrow
│ Organic Apples      │  name, 14 px bold
│ €1.75  ~~€2.50~~    │  new price 19 px bold forest, old price struck
│ per kg              │
│ Expires in 3 days   │  warm amber when ≤ 3 days
│ [STORE-APPROVED]    │  or [DEMO]
└─────────────────────┘
```

- Two-column grid, 12 px gap.
- Urgent cards (≤ 3 days) get a warm border and a faint amber shadow.
- Without a photo, the card shows a simple illustration for its category on a soft tint.

### 6.6 Status pills (employee)

Rounded pills with a coloured dot, using the semantic colours in §2.3:

`Good Condition` · `Monitor Closely` · `Review for Discount` · `Requires Immediate Inspection` · `Hold — Not Approved for Sale` · `Manual Review Required`

Discount pills: `30% live` (emerald fill, white) and `30% pending` (pale amber).

### 6.7 Data source tags

| Tag | Meaning |
|---|---|
| **STORE-APPROVED** (emerald) | A discount an employee approved in Shelf Life |
| **DEMO** (pale gold) | Illustrative sample data, not a real offer |
| **EXAMPLE FIGURES** | Prototype values on the profile |
| **PROTOTYPE** | Demo login accounts |

### 6.8 Bottom sheets

Slide up from the bottom over a 32% forest scrim. They carry a grab handle and a 26 px top radius. Tapping the scrim closes them. Used for preferences, settings, product details, discount adjustment, rejection and re-inspection.

### 6.9 Toasts and alerts

- **Toast:** forest pill at the top, white text, about 2.6 s. Confirms actions ("Preferences saved", "+5 loyalty points added").
- **Product alert:** a white card with an emerald border titled "Shelf Life — Product Alert", the message, and a **Review Product** button. It stays for 7 s.

### 6.10 Icons

Line icons on a 24 px grid with a 1.9 px stroke and rounded caps and joins, drawn in `currentColor`. Set: back, user, settings, edit, camera, upload, flash, bell, check, leaf, coin, box, scale, alert, info, chevron, log out, lock, shield, list, clock, close, retake, star.

---

## 7. Motion

| Moment | Motion | Timing |
|---|---|---|
| Forward navigation | New screen slides in from the right; previous moves 28% left and fades | 480 ms, `cubic-bezier(.22,.8,.24,1)` |
| Back navigation | Screen slides out to the right; previous returns | 480 ms |
| After login | Dashboard fades in and rises 24 px | 480 ms |
| Section entrance | Rise 14 px + fade, staggered 40–100 ms | 600 ms |
| Bottom sheet | Slides up | 380 ms |
| Button press | Scale to 97.5% | 150 ms |
| Map focus | Fly to the store, zoom ≥ 14 | 550 ms |

All motion is reduced to near zero when the device asks for reduced motion.

### 7.1 Splash sequence (≈ 5 s)

1. **0–2.6 s — Spin.** The full ring appears centred and rotates clockwise, 2 full turns plus 260°, decelerating (ease-out cubic).
2. **2.6–4.1 s — Open.** The ring unfolds from 360° to a 200° arch, gap opening at the bottom, with ease-in-out. Rounded caps appear at both ends. The band stays thick throughout.
3. **≈ 3 s — Reveal.** "S.L" and "SHELF LIFE" fade in and scale from 90% to 100%.
4. **+0.75 s hold, then settle.** The logo scales to ≤ 50% and moves to the upper third over 1.15 s (`cubic-bezier(.65,0,.25,1)`).
5. **+0.5 s — Choices.** The tagline rises in, then **Customer Login**, then **Employee Login** 220 ms later.

A "Skip intro" link jumps to the final state. Returning signed-in users skip the splash and go straight to their dashboard. After log out, the selection screen appears without replaying the animation.

### 7.2 AI analysis animation

The photo sits in a 30 px-radius square with a faint grid. An emerald gradient beam sweeps top to bottom and back (1.9 s each way). Status messages rotate every 1.1 s:

- Identifying the product...
- Analyzing visible characteristics...
- Checking for signs of deterioration...
- Preparing your freshness assessment...

Minimum duration is 3.4 s so the moment reads clearly, even when the result arrives sooner.

---

## 8. Screens

### 8.1 Navigation map

```
Splash ─► Login selection ─┬─► Customer Login ─► Customer Dashboard ─┬─► Supermarket Details ─► Product sheet
                           │                                         └─► Profile & Loyalty ─► Settings sheet
                           └─► Employee Login ─► Employee Dashboard ─┬─► Scan ─► AI Analysis ─► Freshness Survey ─► Assessment ─► (back to Dashboard)
                                                                     ├─► Notifications ─► Product Review
                                                                     ├─► Inventory (filtered) ─► Product Review
                                                                     └─► Settings sheet ─► Log out
```

Screens form a stack. Going back restores the previous screen exactly as it was, including map position. Customer screens require a customer session; employee screens require an employee or manager session. Anyone else is returned to login selection.

### 8.2 Login selection

- Settled logo in the upper third.
- Tagline: "Fresh food, fair prices, less waste across Berlin."
- **Customer Login** (primary) and **Employee Login** (outline), same size, 16 px apart, anchored near the bottom.
- No scrolling on standard phones.

### 8.3 Customer / Employee Login

- Back arrow, mini logo, eyebrow ("Welcome back" / "Staff access"), title, one-line explanation.
- Email, password (show/hide), error line, **Log in**, **Forgot password?**
- A Demo accounts card: tap an account to fill the form.
- Role checks: a customer account can't use Employee Login and vice versa. Each gets a clear message pointing to the right door.

### 8.4 Customer Dashboard

In order:

1. Header: "Shelf Life" wordmark over the 46 px ring logo (centred). Profile button top-right (44 px mint circle).
2. "Hello, [first name]!" · "Welcome back to Shelf Life." · `Logged in as Customer` pill.
3. **My Preferences** with an edit icon. Chips: Fruits, Vegetables, Dairy, Meat, Bakery. Tapping a chip saves immediately. "Edit Preferences" opens a sheet with descriptions.
4. **Supermarkets in Berlin**: split view, list 33% left, map 67% right, height `clamp(340px, 52vh, 520px)`.

**List entries:** chain eyebrow (emerald), short location name, district. The selected entry gets a pastel fill and emerald border.

**Map:**
- Districts drawn with sage outlines and alternating pastel fills, with uppercase district labels.
- Postcode areas drawn as fine white lines on a pale mint base.
- Custom emerald teardrop pins with a pastel centre. The selected pin grows 132% and lifts.
- A callout at the bottom shows the store name, address and hours.
- A note at the top states that no street layer is connected.

**Selecting a store** (list or pin) highlights both sides, flies the map to it, shows the callout, then slides to the store page after 0.7 s.

### 8.5 Supermarket Details & Discounts

1. Back arrow left; mini logo and customer first name right.
2. Chain · district eyebrow, store name (Cormorant 31 px), address, hours.
3. **Based on Your Preferences** heading with a sort menu: Recommended for You · Highest Discount · Expiring Soon · Lowest Price.
4. Category pills: All · Fruits · Vegetables · Dairy · Meat.
5. A legend explaining Store-approved vs Demo.
6. Two-column product grid.

**Default order:** matching preferences → store-approved → larger discount → sooner expiry.

Tapping a card opens a product sheet with a large image, name, store, price block, date, availability and description.

### 8.6 Customer Profile & Loyalty

1. Back arrow; settings icon and mini logo at right.
2. "Hello, [name]!" · "Your Shelf Life Profile".
3. **Loyalty card** — the most prominent element: diagonal gradient forest → emerald → natural, decorative ring top-right, "Your Loyalty Points", the balance at 52 px, and the line *"Every sustainable choice makes a difference."* in italic Cormorant.
4. "How you earn points" (expandable).
5. **Your Impact:** three pastel tiles: Products saved, Money saved, Est. food waste avoided (labelled as example figures).
6. **Help Us Improve Shelf Life:** three survey cards. Survey 2 uses five 40 px stars. After submitting, a card collapses to a short "Sent" summary.

**Settings sheet:** Personal Information · Food Preferences · Notification Settings · Privacy & Data · Log Out (hold-red).

### 8.7 Employee Dashboard

1. Mini logo left; bell (with amber unread count) and profile button right.
2. "Hello, [name]!" · "Employee Dashboard · [store]" · role pill with approval limit.
3. **Scan a Product**: full-width hero button, emerald-to-forest gradient, camera icon in a translucent square.
4. Four tiles (2 × 2), each with a coloured top edge, opening the inventory filtered:
   - Products Monitored (sage)
   - Expiring Soon (amber)
   - Pending Discounts (natural green)
   - Active Discounts (emerald)
5. **Demo clock** panel: diagonal gold stripes and dashed border so it reads clearly as test tooling. Buttons: +1 day, +3 days, Reset, Run review check now.
6. Push-alert permission row.
7. **Recently scanned:** rows with thumbnail, name, status and discount pills, added date, next review and recorded date.

### 8.8 Camera

The only dark screen (`#0E2A1B`), so the photo is the focus.

- Title "Take a photo of the product" and helper text.
- 3:4 viewfinder with 28 px corners and a rounded guide frame. Its corner brackets are drawn in natural green; outside the frame is dimmed.
- Controls row: Upload · 78 px emerald shutter with a white ring · Flash.
- After capture: Retake · confirm (check) · Upload.
- If live preview isn't available, the viewfinder explains that the shutter opens the phone camera.

### 8.9 AI Analysis

- Scanning animation (§7.2), then a results card.
- Results include product, category, visible appearance, bruising, discoloration, surface damage, possible mold, image quality, a one-line observation and a confidence pill.
- A fixed disclaimer states that the photo can't show expiry, internal freshness or food safety.
- Flags: hold-red for possible mold; amber for low confidence or poor image quality.
- If no AI result is available, a plain card says so. Nothing is guessed.
- Actions: **Continue to Freshness Survey** · Retake photo.

### 8.10 Product Freshness Check (survey)

- Header with photo thumbnail, AI name and subtitle.
- Sticky progress bar: "Question N of 6" plus "x/6 answered", with a green gradient fill.
- Six vertical question cards. A card's border turns sage when answered. Choosing an option scrolls to the next card.
  1. Product identification: confirm AI name, search list, manual entry, category, batch reference
  2. Visible condition: AI-suggested option tagged
  3. Texture & firmness: note that firmness depends on the product
  4. Smell & spoilage: inline hold warning for strong or serious signs
  5. Date information: date picker, disabled for "No reliable date"
  6. Storage: optional temperature and a temperature-excursion toggle
- **Generate Product Assessment**: if something is missing, it scrolls to the first unanswered question and explains what's needed.

### 8.11 Product Assessment

- Status panel tinted in the status colour, with review priority and next inspection date.
- Summary list: AI observation vs employee answers.
- **Why this status:** the rules that fired, in plain language.
- **Confirm product record** form: photo, name, quantity and unit, batch, original price, date, storage, next inspection.
- **Save & Monitor Product**, then return to the dashboard.

### 8.12 Product Review

- Large photo, name, store and status pill.
- Detail list: quantity/batch, price, recorded date with countdown, storage, last inspection, next review, AI observation.
- **Live for customers** card when a discount is active, with a Withdraw option.
- **AI Suggested Discount — Pending Employee Approval** card: large percentage, new and old price, reason, and the three actions **Approve Discount** · **Adjust Discount** · **Reject / Inspect Again**.
- Over-limit and blocked states are shown inline. Approve is disabled when not allowed.
- Inspection actions: Update condition · Remove from sale.
- History: a timeline of inspections and decisions.

### 8.13 Notifications

Cards with thumbnail, title, message and time. Unread cards are white with an emerald left border. A "Mark all read" link sits at the top. Tapping a card marks it read and opens the product. The empty state explains how alerts work and points to the demo clock.

---

## 9. Behaviour rules

### 9.1 Discount schedule (configurable per supermarket; demo values)

| Days before recorded date | Suggested discount |
|---|---|
| 14+ | 2% |
| 10–13 | 5% |
| 7–9 | 10% |
| 4–6 | 20% |
| 2–3 | 30% |
| 1 | 40% |

Other store settings:

- **Review window:** 7 days. Discount alerts fire inside it.
- **No-date default:** 20%, suggested only after an employee inspection finds visible imperfections.
- **Approval limits:** employees 40%, managers 60%.
- **Inspection intervals:** Good 3 days · Monitor 2 · Review 1 · Manual 1.

Dates are calculated in the Europe/Berlin time zone.

### 9.2 Freshness status rules

| Trigger | Status |
|---|---|
| Possible mold/spoilage reported, serious spoilage signs, or use-by date passed | Hold — Not Approved for Sale |
| Strong smell, AI-flagged possible mold, poor condition, very soft texture, or best-before passed | Requires Immediate Inspection |
| Inside the review window, fair condition, or noticeably soft | Review for Discount |
| No expiry date and neither texture nor smell assessed | Manual Review Required |
| Slight smell, slightly soft, or uncertain storage history | Monitor Closely |
| None of the above | Good Condition |

When several rules apply, the most serious status wins. Products on hold or awaiting immediate inspection are never offered for discounted sale. Use-by and best-before dates are handled differently.

### 9.3 Monitoring and notifications

A review check runs on load, every minute while staff use the app, and on demand. It creates:

- **Freshness review due:** on the scheduled inspection date
- **Discount review:** when a higher discount becomes appropriate inside the review window
- **Remove from sale:** when a use-by date passes. The product goes on hold and its offer is hidden.
- **Inspection needed:** when a best-before date passes. The discount is paused.
- **Reminder:** when a proposal is still pending a day later

Each alert is created once (de-duplicated by product, type and date). After a rejection, alerts pause until the chosen re-inspection date.

### 9.4 Employee → customer connection

When an employee approves a discount, Shelf Life writes a separate customer-facing offer. It contains only the name, category, photo, unit, prices, percentage and date. It never includes survey answers, batch codes or inspection notes. The offer shows only on that store's page. It disappears when withdrawn, when the product is put on hold, or when its date passes.

### 9.5 Loyalty

- +5 points per survey, awarded once per survey
- +10 per eligible discounted purchase (needs till integration; not yet connected)
- +20 per sustainability milestone

---

## 10. Content and voice

- Plain, warm, direct. Name things the way shoppers and store staff do.
- Buttons say exactly what happens: "Save & Monitor Product", "Approve Discount".
- Confirmations echo the result: "30% discount approved and live for customers."
- Errors say what's wrong and how to fix it, e.g. "This is a customer account. Use Customer Login instead."
- Always label sample data. Never present demo prices or discounts as real promotions.

---

## 11. Accessibility

- Visible focus ring (3 px natural green, 2 px offset) on every control.
- Text contrast: forest and ink on turquoise or white; white on emerald for buttons.
- All icon-only buttons have labels. Selection state uses `aria-pressed` and `aria-current`.
- Errors and status messages are announced.
- Inputs are 16 px to avoid zoom on iOS.
- Reduced-motion preference is respected throughout.
- Colour is never the only signal: status pills carry text, urgent cards also say "Expires in N days".

---

## 12. Data sources and known gaps

| Item | Source / status |
|---|---|
| Supermarket addresses and coordinates | berlin.de "Supermarkets open on Sundays" list |
| District and postcode boundaries | Berliner Morgenpost Berlin-Geodaten (CC BY / public domain) |
| Street map layer | Not connected in the prototype |
| Customer product catalogue | Demo data until store inventory feeds are integrated |
| Authentication | Demo accounts; production needs a real auth backend with server-side role checks |
| Monitoring | Runs while staff use the app; production needs a scheduled server job and push service |
| Shared data | Readable by everyone with prototype access; production must keep customer data private |
