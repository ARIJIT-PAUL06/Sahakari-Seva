# Sahakari Seva — Mobile Application Core (सहकारी सेवा)

> **Expo SDK 52 / React Native (React 19) Mobile Core for Sahakari Seva**  
> India's First Worker-Owned Cooperative Platform for Urban & Household Gig Services.

---

[![Production Web App](https://img.shields.io/badge/Production-Live%20on%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://sahakari-seva-six.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-ARIJIT--PAUL06%2FSahakari--Seva-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ARIJIT-PAUL06/Sahakari-Seva)
[![Framework](https://img.shields.io/badge/Expo-SDK%2052-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Database](https://img.shields.io/badge/Cloud%20Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://cvbraoniruzplwxbgzja.supabase.co)
[![Languages](https://img.shields.io/badge/Localization-14%20Indian%20Languages-FF9933?style=for-the-badge)](#-14-language-comprehensive-localization)

---

## 🌟 Highlights & Capabilities

- **📱 Unified Multi-Platform App:** Single codebase supporting **Expo Go (Android / iOS)** and **Modern Web**.
- **☁️ Supabase Real-Time Cloud Sync:** Real-time two-way synchronization via `cloudSyncAdapter.ts` and `databaseService.ts`. Changes made on one device instantly propagate to others, with delta-based offline local storage.
- **🛡 Sovereign Cooperative Trust Architecture:** 
  - Ministry of Cooperation & MSDE recognized cooperative framework.
  - Three Core Pillars: **100% ITI & Skill India Certified**, **24/7 Cooperative Ombudsman**, and **Worker Welfare Safety Net**.
  - Redesigned Login screen featuring subtle architectural watermark silhouettes of iconic Indian monuments (*India Gate, Taj Mahal, Qutub Minar, Red Fort, Lotus Temple*) and a slender feathered tricolor horizon.
- **🗣 14-Language Comprehensive Localization:** Full coverage for English + 13 Major Indian regional languages (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Bhojpuri) with seamless cross-fade switching.
- **🤝 Pay on Completion & Dual Sign-Off:** Customers only pay after the job is finished, verified by a 4-digit code or one-tap approval with photo verification.
- **🤖 AI Worker Voice Assistant & Customer Universal Search:** Intent engine for workers and a 1-tap `ACTIONS_DIRECTORY` universal search for customers adhering to the platform's Dual-Registration Rule.
- **📍 Zero Paid Map APIs:** Complete open-source geocoding with OpenStreetMap and client-side Haversine matching.

---

## 🌐 14-Language Comprehensive Localization

| # | Language | Native Script | Landmark Region Coverage |
|:---:|:---|:---|:---|
| 1 | **English** | English | Pan-India / International / Default |
| 2 | **Hindi** | हिन्दी | North & Central India (Delhi, UP, MP, Rajasthan, Bihar) |
| 3 | **Bengali** | বাংলা | East India (West Bengal, Kolkata, Tripura) |
| 4 | **Tamil** | தமிழ் | South India (Tamil Nadu, Chennai) |
| 5 | **Telugu** | తెలుగు | South India (Andhra Pradesh, Telangana, Hyderabad) |
| 6 | **Marathi** | मराठी | Western India (Maharashtra, Mumbai, Pune) |
| 7 | **Gujarati** | ગુજરાતી | Western India (Gujarat, Ahmedabad, Surat) |
| 8 | **Kannada** | ಕನ್ನಡ | South India (Karnataka, Bengaluru) |
| 9 | **Malayalam** | മലയാളം | South India (Kerala, Kochi, Thiruvananthapuram) |
| 10 | **Punjabi** | ਪੰਜਾਬੀ | North & Northwest (Punjab, Chandigarh, Delhi NCR) |
| 11 | **Odia** | ଓଡ଼ିଆ | Eastern India (Odisha, Bhubaneswar, Cuttack) |
| 12 | **Assamese** | অসমীয়া | Northeast India (Assam, Guwahati & Seven Sisters) |
| 13 | **Urdu** | اردو | Pan-India / North / J&K / Hyderabad / Lucknow |
| 14 | **Bhojpuri** | भोजपुरी | Heartland Workforce (Bihar, Purvanchal UP, Jharkhand) |

---

## 🛠 Directory Layout & Architecture

```
src/
├── animations/              # Smooth motion primitives & LanguageSwitchProvider
├── components/
│   ├── common/              # Header, LanguageModal, WorkerCard, DatabaseSyncModal
│   ├── worker/              # WorkerAIAssistantWidget, WorkerIDModal
│   ├── map/                 # MobileMapView (OpenStreetMap + Haversine)
│   └── ui/                  # Buttons, Input, Badges, Tabs
├── i18n/                    # 14 complete JSON locale dictionaries (en, hi, bn...)
├── navigation/              # Role-based Tab & Stack navigation (RootNavigator)
├── screens/
│   ├── auth/                # Sovereign LoginScreen with Monument Watermarks
│   ├── customer/            # HomeScreen, WorkerSearchScreen, Bookings, Checkout
│   ├── worker/              # WorkerHomeScreen, JobManagement, WelfarePassbook
│   └── admin/               # AdminDashboardScreen, KYCVerificationScreen
├── services/
│   ├── cloudSyncAdapter.ts  # Supabase real-time delta synchronization
│   ├── databaseService.ts   # Local AsyncStorage + Cloud hybrid persistence
│   ├── aiAssistantService.ts# Multilingual Worker AI intent classification
│   ├── apiClient.ts         # Unified API client with automatic offline fallback
│   └── gpsService.ts        # OpenStreetMap geocoding & Haversine distance
└── theme/                   # Cooperative design tokens, HSL colors, typography
```

---

## 🚀 Running the Mobile Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env.local`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://cvbraoniruzplwxbgzja.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_nGQOmXn-_7FD0w4dMwbvgg_6KGkPR0X
```

### 3. Run in Web Browser
```bash
npm run web
# or:
npm run dev
```

### 4. Run on Android / iOS via Expo Go
```bash
npm start
```
Scan the QR code displayed in your terminal using the **Expo Go** app on your phone.

### 5. Build for Production Web
```bash
npm run build:web
```

### 6. TypeScript Validation
```bash
npm run typecheck
```

---

## 📌 Dual-Registration Rule Reference

Per developer guidelines in `AGENTS.md`:
1. **Worker AI Assistant (`src/services/aiAssistantService.ts` & `src/components/worker/WorkerAIAssistantWidget.tsx`)**: Every added capability must be registered with intent keywords and worker action cards.
2. **Customer Universal Search (`src/screens/customer/HomeScreen.tsx`)**: Every added capability must be registered with `ACTIONS_DIRECTORY` or category search indexing for 1-tap discovery.

---

## ⚖️ License

MIT License — Developed as an open-source public good for worker cooperatives.
