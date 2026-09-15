# Sahakari Seva Developer & Agent Guidelines

## 📌 Feature Dual-Registration Rule (Worker AI & Customer Search)

**Every time any feature, tool, capability, or screen is added or modified in the Sahakari Seva platform, it must be integrated into both interfaces:**

1. **Worker AI Assistant (`src/services/aiAssistantService.ts` & `src/components/worker/WorkerAIAssistantWidget.tsx`)**:
   - Add the intent, natural language phrases, and execution logic.
   - Provide an action card or voice response for service workers.

2. **Customer Universal Search Bar (`src/screens/customer/HomeScreen.tsx`)**:
   - Add the feature to `ACTIONS_DIRECTORY` or category search indexing.
   - Include keywords and synonyms so customers can find and launch it with 1 tap.

---

## ☁️ Cloud Persistence & Real-Time Sync Architecture

- **Supabase PostgreSQL Integration:**
  - `src/services/cloudSyncAdapter.ts`: Handles two-way delta synchronization between local storage and Supabase PostgreSQL.
  - `src/services/databaseService.ts`: Hybrid persistence layer that caches all state locally in `@react-native-async-storage/async-storage` and pushes updates to the cloud.
  - **Conflict Resolution:** Last-write-wins using ISO 8601 `updated_at` timestamps.
  - **Required Environment Variables:**
    ```env
    EXPO_PUBLIC_SUPABASE_URL=https://cvbraoniruzplwxbgzja.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_nGQOmXn-_7FD0w4dMwbvgg_6KGkPR0X
    ```
  - **Health Monitoring:** Any changes affecting network state or backend entities should be testable via the Database Diagnostic Modal (`DatabaseSyncModal.tsx`).

---

## 🗣 Internationalization (i18n) Rules

- **14 Supported Locales:** English (`en`) + 13 Indian languages (`hi`, `bn`, `ta`, `te`, `mr`, `gu`, `kn`, `ml`, `pa`, `or`, `as`, `ur`, `bho`).
- Whenever a new user-facing string is added:
  - Add the key to `src/i18n/en.json` first.
  - Add translations across the other 13 locale JSON files in `src/i18n/`.
  - Never hardcode raw English text into JSX components.
- Language switching is wrapped in `LanguageSwitchProvider` (`src/animations/`) for seamless cross-fade transitions.

---

## 🎨 Design System & Visual Guidelines

- **Color Palette & Theme Tokens:** Defined in `src/theme/index.tsx`. Always use theme tokens (`colors.primary`, `colors.surface`, `colors.text`, etc.) rather than ad-hoc hex values.
- **Sovereign Cooperative Aesthetic:**
  - Login & brand screens incorporate the Sovereign Trust Card (100% ITI Verified, 24/7 Ombudsman, Worker Welfare Safety Net).
  - Subtle architectural watermark of Indian monuments with feathered tricolor horizon.
- **Haptic & Motion Feedback:**
  - Use `ScalePressable` for primary interactive touch targets.
  - Use `FadeInView` for smooth screen and card entrance animations.
  - Use `AnimatedNumber` for financial tallies, hours, and KPI stats.

---

## 🧪 Verification & Build Commands

Always run type checks and tests before committing changes:
```bash
# Typecheck mobile core
npm --prefix mobile run typecheck

# Production web export build
npm --prefix Sahakari-Seva-main run build:web
```
