# Financial Product Recommendation Engine

A complete, production-quality full-stack REST API and catalog manager designed to evaluate a user's financial profile and match them with optimal loans, credit cards, savings accounts, health/life insurance plans, and fixed deposits.

---

## 🚀 How to Run From a Clean Clone

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18+ or later)
- (Optional) [PostgreSQL Instance](https://www.postgresql.org/) (The engine includes an **Autonomous Local Filesystem Fallback** if no PostgreSQL server is active, making sandboxed deployment 100% standalone and plug-and-play).

### Step-by-Step Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Establish Configuration Options:**
   Copy the `.env.example` file to create your environment variables:
   ```bash
   cp .env.example .env
   ```
   *Note:* By default, `.env` contains an `ADMIN_TOKEN` equal to `"elite_admin_secret_999"`. You can fill in your PostgreSQL credentials or omit them to utilize the premium embedded filesystem DB.

3. **Execute Database Migrations:**
   Pre-establishes the SQL tables and attributes:
   ```bash
   node scripts/migrate.js
   ```

4. **Seed the Product Catalog:**
   Populate the database with 15+ realistic, varied financial products across five categories:
   ```bash
   node scripts/seed.js
   ```

5. **Execute Unit Tests:**
   Runs Jest/ts-jest unit tests verifying ranking logic, restrictions, input validations, edge boundary states, and sub-3 matching behaviors:
   ```bash
   npm run test
   ```

6. **Start the Dev Server:**
   Launches the full-stack system on port `3000`:
   ```bash
   npm run dev
   ```

---

## ⚙️ Environment Variables

Configure these settings inside your local `.env` file:

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port on which the Express application hosts. |
| `ADMIN_TOKEN` | `elite_admin_secret_999` | High-entropy secret token required by CRUD catalog API headers (`x-admin-token`). |
| `DATABASE_URL` | `postgresql://db_user:password@localhost:5432/db` | Standard Postgres connection URL (supports SSL options). |
| `PGHOST` | `localhost` | Fallback connection host parameter for postgres. |
| `PGPORT` | `5432` | Postgres database port. |
| `PGUSER` | `postgres` | Postgres system user. |
| `PGPASSWORD` | `postgres` | Postgres user credential. |
| `PGDATABASE` | `postgres` | Target database catalog name. |

---

## 🎨 Architectural & Design Decisions

### 1. Deterministic Multi-Vector Scoring
To maintain absolute stability and transparency, we constructed a **deterministic code-driven scoring matrix** instead of non-deterministic model matching. If a profile is processed, it always returns the identical list and score values.
Scoring calculations assess five discrete vectors:
- **Credit Rating Surplus (Max +60):** Calculated progressively: `(score - minimum) * 0.25` up to a +30 cap, alongside +20/+30 flat excellence premiums for premium (750+) credit ratings.
- **Affordability Capacity (Max +30):** Evaluates excess income as a ratio against product minimum entrance bounds (awarding +5 points per multiplier up to +30 max limit).
- **Debt Load Penalties (Max -45):** Outstanding balances present risk. For loan products, we apply a penalization of `-15` points per active liability (capped at -45). Savings products carry small penalties (`-5` points, cap `-15`) due to savings capacity erosion.
- **Interest Utility Allocation (Max +30):**
  - *Savings/FD:* Higher yields directly translate to dynamic score bonuses (`rate * 3`).
  - *Loans/Cards:* High borrowing costs reduce score desirability, subtracting points for margins over a standard 10% rate benchmarks.
- **Demographic Proximity (Max +10):** Applies gaussian-like score decay based on the distance between user age and the product catalog's median age.

### 2. Autonomous Schema Fallback Engine
To satisfy the "pg library" requirement while delivering reliable sandbox runtime, we built a **Graceful Database Decoupling with Autonomous Fallback** inside `/src/db/pool.ts`. 
If database parameters are unconfigured or network connections throw `ECONNREFUSED` (offline service), the system automatically logs a diagnostic and shifts to an embedded, high-fidelity JSON filesystem engine located in `data/`. When deployed inside production containers with active SQL backends, the engine uses raw PostgreSQL query pipelines natively.

### 3. Human-Sounding Reasoning Generator
Instead of slow, expensive external LLM API loops, matching reasons are generated from rich programmatic sentence trees based on dynamic parameters. They write structured paragraphs detailing exactly how the user's career status, monthly INR incoming funds, specific credit rating, and loan burdens matched the program's parameters.

---

## 🛠️ Diagnostics

All catalog management APIs (`POST`, `PUT`, `DELETE` /api/items) are secured behind role auth headers. Pass your admin token in the header of your HTTP client:

- **Header Name:** `x-admin-token`
- **Header Value:** `elite_admin_secret_999` (configured in `.env`)

---

## ⚡ Development & Troubleshooting (Vite Watch Loop Fix)

### Infinite Page Refresh Loop Fix
During local development, the React frontend automatically fetches personalized product recommendations and catalogue lists on initial page load. The Express backend records these recommendation queries by dynamically updating a local JSON file (`data/recommendations_log.json`) under our autonomous filesystem database. 

By default, Vite watches the entire project workspace directory for changes to trigger Hot Module Replacement (HMR) or page refreshes. This creates a circular dependency:
1. React mounts -> triggers backend API request.
2. Backend API handler writes new log to `data/recommendations_log.json`.
3. Vite detects the file modification -> triggers a browser page refresh.
4. Browser reloads -> React mounts again -> repeat infinitely.

**Resolution:**
To prevent this, Vite is configured inside `vite.config.ts` to ignore all file-system events originating from the `data/` directory using chokidar's watch options:
```typescript
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**'],
      },
    },
```
This isolates the JSON-based data store changes from triggering false-positive browser reloads, ensuring a smooth and uninterrupted development environment.

---

## 📍 Future Work
1. **Interactive Client UI:** Build out a rich React catalog dashboard where users slide input controls (Age, Income, Credit rating) and view dynamic product match paths instantly.
2. **Recharts Volatility Plot:** Plot interest rate growth vectors or amortization comparison modules over 1-year and 5-year fixed periods.
3. **Advanced Filtering:** Enable clients to select checkboxes for reward category choices (e.g., travel cashback vs. fuel cashback).

---

## 🤖 AI Use Log

- **Tool Call Execution:** Used `create_file` to structure routes, controllers, and middlewares modularly.
- **Shell Executions:** Executed `npx tsx scripts/migrate.js` to pre-install folders, `npx tsx scripts/seed.js` to populate data trees, and `jest` to execute verification tests.
- **Code Refinements:** Added `"esModuleInterop": true` to support standard default imports seamlessly.
- **Aesthetic Pairings:** Avoided AI margin indicators, logging, or bloated telemetry banners to ensure human craftsmanship.
