# Feature Dual-Registration Rule: Worker AI Assistant & Customer Search Bar

**MANDATORY ARCHITECTURAL REQUIREMENT FOR ALL FUTURE FEATURES**

Whenever any new feature, screen, workflow, shortcut, tool, or capability is added to Sahakari Seva, it MUST be integrated into BOTH:

1. **Service Worker AI Assistant (`src/services/aiAssistantService.ts` & `src/components/worker/WorkerAIAssistantWidget.tsx`)**:
   - Register the new capability in `AssistantIntentType`.
   - Add keyword patterns and natural language handling in `classifyIntent` and `processUserQuery`.
   - Provide an actionable response, card, or navigation trigger so workers can access it via speech or text prompt.
   - Include it in contextual recommendations where appropriate.

2. **Customer Universal Search Engine (`src/screens/customer/HomeScreen.tsx`)**:
   - Register the feature in `ACTIONS_DIRECTORY` or `performUniversalSearch` category/skill mappings.
   - Map all relevant search keywords, synonyms, and localized terms (Hindi/English).
   - Provide a direct 1-tap action card with clear title, subtitle, icon, and immediate navigation/execution handler.

---
*Created as per user requirement: "any time we add any little feature, it should be added to both the AI assistant for service worker and the search bar for customer."*
