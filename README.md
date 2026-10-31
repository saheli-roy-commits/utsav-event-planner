# Utsav — AI Event Planner

Utsav is an editorial, quiet event planner designed for weddings, birthdays, and community gatherings across India. Styled with the warmth and craftsmanship of printed paper stationery, it avoids tech startup clichés and presents celebration plans as clean, tangible documents.

---

## What the App Does

Utsav takes basic celebration parameters and generates a complete, realistic event plan:

1. **Budget Ledger**:
   - Categorizes spending into six standard categories: **Venue**, **Food**, **Decor**, **Entertainment**, **Photography**, and **Miscellaneous**.
   - Displays percentage shares with warm marigold proportion indicators and exact rupee amounts in Indian numbering format (`₹12,500`).
   - Mathematically guarantees that line items sum exactly to the total budget with zero rounding drift.
2. **Chronological Timeline**:
   - A step-by-step milestone countdown (e.g. "8 weeks before", "4 weeks before", "Day of event") tailored to Indian vendor lead times.
3. **Interactive Vendor Checklist**:
   - Grouped checklists across vendor categories that can be checked off during planning and remembered in the active session.
4. **Tailored Local Ideas**:
   - Five specific, grounded recommendations matching the city's local markets (flower mandis, seasonal sweet shops, folk musicians) and aesthetic style notes.
5. **Print & Export**:
   - Clean print styling that hides interactive form controls and formats the plan as a printed broadsheet or wedding stationery document.

---

## Design Philosophy

- **Stationery Aesthetic**: Built on a warm paper tone (`#F3EDE2`), dark ink text (`#231F1A`), and subtle 1px borders (`#CFC6B6`).
- **Carefully Chosen Accents**: Brick red (`#9C3D2A`) for primary actions, deep marigold (`#C98A1B`) for proportion bars, and deep green (`#3E5C46`) for completed checklist items.
- **Editorial Typography**: Headings in serif *Libre Caslon Text* and body in *Source Sans 3*.
- **Accessible & Screen-Reader Ready**: Semantic HTML5 landmark regions, accessible form controls, ARIA live announcements, high contrast, and keyboard navigation.

---

## How to Run the App

### Prerequisites
- Node.js 20 or higher.
- npm, pnpm, or bun.

### 1. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Provide your Gemini API key in `.env`:
```env
GEMINI_API_KEY="your_api_key_here"
```

### 2. Start the Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000`. Express handles backend API requests under `/api/*` and serves the Vite frontend with HMR.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## How to Run the Unit Tests

The test suite validates the deterministic budget allocation engine using Node.js's native test runner (`node:test`) powered by `tsx`:

```bash
npm test
```

### Test Coverage in `src/budgetCalculator.test.ts`
- **Shares that add up to 100%**: Verifies exact calculation on standard budgets (e.g. 50,000 INR) and synonym category resolution.
- **Shares that do not add up to 100%**: Tests automatic normalization when Gemini returns shares totaling over 100% (e.g. 107%) or under 100% (e.g. 90%), adjusting the largest share accordingly.
- **Awkward budgets like 735,000 INR**: Verifies clean integer allocations with standard and prime percentage distributions without penny or fractional rupee errors.
- **Rounding differences**: Tests odd, awkward budgets (such as 735,001 INR, 99,999 INR, and 1,003 INR) where mathematical rounding produces a fractional discrepancy, ensuring the difference is balanced on the largest category so the final ledger sum strictly equals the user's budget.

---

## How Gemini AI is Used

Utsav uses Google Gemini through the `@google/genai` TypeScript SDK:

- **Server-Side Isolation**: All Gemini API calls happen exclusively in `server.ts`. The API key is loaded from server environment variables and never exposed to client browsers or bundled files.
- **Strict Input Validation & Sanitization**: Incoming requests are validated on the server for reasonable guest counts (2 to 10,000), valid budgets (₹1,000 to ₹100 Cr), calendar dates, and trimmed style notes (max 300 characters, stripped of injection tags).
- **Percentage-Only Budget Contract**: Gemini is prompted to return only integer percentage shares (whole numbers adding to 100), not rupee amounts. The application itself calculates all rupee amounts deterministically in code (`amount = round(totalBudget * share / 100)`).
- **Editorial Prompt Constraints**: Prompts instruct the model to produce warm, grounded sentences, prohibiting hype words ("magical", "seamless", "delve") and em dashes.
- **Resilient Fallbacks**: If Gemini is unreachable or rate-limited, friendly error messages are returned, alongside a built-in editorial fallback template so planning is never blocked.
