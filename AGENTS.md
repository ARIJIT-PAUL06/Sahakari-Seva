# Sahakari Seva Developer & Agent Guidelines

## 📌 Feature Dual-Registration Rule (Worker AI & Customer Search)

**Every time any feature, tool, capability, or screen is added or modified in the Sahakari Seva platform, it must be integrated into both interfaces:**

1. **Worker AI Assistant (`src/services/aiAssistantService.ts` & `src/components/worker/WorkerAIAssistantWidget.tsx`)**:
   - Add the intent, natural language phrases, and execution logic.
   - Provide an action card or voice response for service workers.

2. **Customer Universal Search Bar (`src/screens/customer/HomeScreen.tsx`)**:
   - Add the feature to `ACTIONS_DIRECTORY` or category search indexing.
   - Include keywords and synonyms so customers can find and launch it with 1 tap.
