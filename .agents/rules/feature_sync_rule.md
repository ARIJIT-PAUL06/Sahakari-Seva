# Feature Dual-Registration Rule: Worker AI Assistant & Customer Search Bar

**MANDATORY ARCHITECTURAL REQUIREMENT FOR ALL NEW AND MODIFIED FEATURES**

Whenever any new feature, screen, workflow, shortcut, diagnostic tool, or capability is added to Sahakari Seva, it **MUST** be integrated into **BOTH** user-facing discovery interfaces:

---

## 1. Service Worker AI Assistant
- **Files:** `src/services/aiAssistantService.ts` & `src/components/worker/WorkerAIAssistantWidget.tsx`
- **Registration Steps:**
  1. **Intent Type:** Add the new capability identifier to `AssistantIntentType`.
  2. **Intent Classification:** In `classifyIntent`, add multilingual natural language triggers, synonyms, and regex patterns (covering English, Hindi, and regional terms).
  3. **Execution Logic:** In `processUserQuery`, handle the intent and construct an actionable response.
  4. **Action Card / UI Widget:** Render a dedicated action card with appropriate icons, status pill, and one-tap navigation callback (e.g. `navigation.navigate(...)`).
  5. **Voice Readout:** Provide a concise, localized speech readout for worker hands-free interaction.

### Example Capabilities Registered:
- `pay_on_completion` / `worker_signoff`: Sign-off on completed job and send payment link.
- `check_db_health`: Open Supabase real-time cloud sync diagnostics.
- `welfare_corpus`: Check Ayushman Bharat / PMSBY social security passbook balance.
- `emergency_sos`: 1-tap distress signal with live GPS coordinates.
- `standby_mobilize`: Instant standby mobilization into high-demand zones.

---

## 2. Customer Universal Search Engine
- **Files:** `src/screens/customer/HomeScreen.tsx`
- **Registration Steps:**
  1. **Action Directory:** Register the feature in `ACTIONS_DIRECTORY` with a unique ID.
  2. **Search Indexing:** Provide comprehensive keywords, aliases, and localized synonyms in both English and Hindi/regional terms.
  3. **Visual Representation:** Specify a descriptive title, informative subtitle, category tag, and Lucide icon.
  4. **Immediate 1-Tap Execution:** Provide an unambiguous `onPress` handler that launches the target screen, triggers the modal, or executes the desired workflow immediately.

### Example Capabilities Registered:
- `"pay completion"`, `"settle bill"`, `"bhuqtan"` -> Launches post-service checkout.
- `"db health"`, `"supabase"`, `"sync status"` -> Opens cloud connection diagnostics.
- `"welfare"`, `"social security"`, `"passbook"` -> Navigates to cooperative welfare overview.
- `"emergency"`, `"sos"`, `"urgent"` -> Opens high-priority emergency dispatch modal.

---

## 3. Pre-Commit Dual-Registration Checklist
Before completing any feature branch or task:
- [ ] Registered in `AssistantIntentType` in `aiAssistantService.ts`
- [ ] Handled in `classifyIntent` with natural language keywords in `aiAssistantService.ts`
- [ ] Action card rendered in `WorkerAIAssistantWidget.tsx`
- [ ] Added to `ACTIONS_DIRECTORY` in `HomeScreen.tsx`
- [ ] Tested via text/voice input in the Worker AI Assistant widget
- [ ] Tested via customer Universal Search input in `HomeScreen.tsx`
