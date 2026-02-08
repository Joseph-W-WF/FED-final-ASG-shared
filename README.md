FED final assignment
Store web/app data into db.js

## Aydan Yeo Yu Jing (S10273117G) — Individual Features (Operational Enhancements + Regulatory & Compliance)

---

# 1) Feature Summary

### A) Regulatory & Compliance (NEA Portal)
1. **Inspection scheduling (NEA)**  
   NEA officers can schedule stall inspections (date + stall). Schedules are stored and later selectable when logging inspections.

2. **Inspection logging (score, remarks, hygiene grade)**  
   NEA officers can log an inspection, enter score + remarks, and issue a hygiene grade (A/B/C/D). Logged inspections are stored for historical tracking.

3. **Violation categorisation / severity levels**  
   During inspection logging, officers can add violations with severity (MINOR/MAJOR) and link them to that specific inspection record.

4. **Historical hygiene grades (transparency)**  
   NEA can view a stall’s inspection history (date, score, grade, expiry, violations) for transparency and tracking over time.

5. **Hygiene grade trends (graphs)**  
   A stall analytics page displays **monthly trends** for hygiene grade and inspection score using charts (latest inspection per month).

6. **Inspection priority queue + repeated offender identification**  
   Dashboard logic highlights priority stalls (e.g., low grades / expiring grades) and flags repeated offenders based on inspection outcomes.

7. **Hygiene grade expiry & renewal alert**  
   Dashboard includes alerts when a grade is near expiry, prompting renewal / reinspection.

8. **Automated warning / penalty system (basic)**  
   A basic penalty record is generated based on grade rules (e.g., worse grades produce stronger enforcement), for tracking actions issued.

9. **Navigation bar + access guard for NEA accounts**  
   NEA pages include a sidebar nav and an NEA-only guard (redirects non-NEA sessions back to the account page).

---

### B) Operational Enhancements (Vendor/Queue)
1. **In-app live notifications for vendors (new order)**  
   Vendor pages can show notifications when a new order appears for that vendor’s stall.

2. **Digital queue ticket system (module)**  
   A queue system module provides functions to create/advance/complete queue tickets per stall (ready to be hooked into UI).

---

# 2) Folder Structure (My Files Only)

### `regulatoryCompliance-(Aydan)/`
- `html/nea.html` — NEA landing page
- `html/schedule.html` — schedule inspections
- `html/inspection.html` — log inspections + add violations
- `html/dashboard.html` — monitoring dashboard (alerts / offenders / queue)
- `html/stall.html` — hygiene grade trends (charts) + history table

- `js/nea.js` — dashboard logic (alerts, repeated offenders, penalties, etc.)
- `js/schedule.js` — create/list scheduled inspections
- `js/inspection.js` — log inspection + attach violations
- `js/stall.js` — charts + historical grades table
- `js/sidebar-toggle.js` — NEA guard + sidebar toggle + logout link
- `css/styles.css` — NEA portal styling

### `vendorNotifications-(Aydan)/`
- `vendorNofications.js` — toast notifications when new orders come in (Firestore listener)
- `vendorNofications.css` — toast styling
- `vendorSessionBridge.js` — updates vendor UI header/sidebar based on the logged-in vendor session

### `queueTicketSystem-(Aydan)/`
- `queueTicketSystem.js` — queue ticket module (create/advance/complete tickets for a stall)

---

# 3) Data + Dependencies (How it works)

### Firebase / Firestore
My features use Firestore as the “live data” source (e.g., inspections, schedules, orders), which is aligned with the assignment’s suggestion to use Firebase-like databases.

Typical collections used:
- `scheduledInspections`
- `inspections`
- `inspectionViolations`
- `penalties`
- `orders`

### db.js (seed/static lists)
Some dropdown lists are intentionally loaded from `db.js` seed data:
- Stall list for dropdowns (NEA pages)
- Violation Catalog (for “Pick from catalog”)

This avoids “empty dropdown” issues and keeps the catalog usable even before Firestore is populated.

### Charts (Grade Trends)
`regulatoryCompliance-(Aydan)/html/stall.html` loads **Chart.js via CDN** for grade/score trend graphs.

---

# 4) How to Run + Test My Features

## Recommended: Run using VS Code Live Server
Because the project uses module scripts (Firebase), run through a local server (Live Server / http://localhost).

### Entry point
Open the account/login page first:
- `user-account-management-Joseph/HTML/account.html`

---

## A) Test NEA Portal (Regulatory Compliance)

1) **Login as an NEA account**  
- After login, an NEA session is stored in `localStorage` (used by my NEA guard).

2) Open:
- `regulatoryCompliance-(Aydan)/html/nea.html`

3) **Schedule inspection**
- Go to `Schedule Inspection`
- Pick a stall + date → submit
- Verify it appears in the scheduled list

4) **Log inspection**
- Go to `Log Inspection`
- Pick from scheduled list (or stall dropdown)
- Enter score + remarks
- Add violations using “Pick from catalog”
- Submit/save

5) **Dashboard checks**
- Go to `Dashboard`
- Verify:
  - priority stalls appear
  - repeated offenders are flagged
  - grade expiry alerts show when applicable
  - penalties are listed (if generated)

6) **Stall analytics**
- Go to `Stalls`
- Select a stall
- Verify:
  - Hygiene Grade Trend chart updates
  - Score Trend chart updates
  - History table lists inspections + violations

---

## B) Test Vendor In-App Notifications (New Orders)

1) Login as a vendor using the normal account system
2) Open vendor portal:
- `VendorManangementLervyn/index.html`

3) Ensure the vendor page includes:
- `vendorNotifications-(Aydan)/vendorNofications.js`
- `vendorNotifications-(Aydan)/vendorNofications.css`
- `vendorNotifications-(Aydan)/vendorSessionBridge.js`

4) Place an order from the customer side (any customer ordering flow)
5) Verify vendor sees a toast notification for the new order

---

# 5) Notes / Known Limitations

- The queue ticket system is currently a reusable module; integrating it into a UI page requires adding buttons/forms on customer/vendor pages.
- Firestore access depends on the project’s Firestore rules. 
- Vendor live notifications require the vendor page to load the notification scripts (JS + CSS).

