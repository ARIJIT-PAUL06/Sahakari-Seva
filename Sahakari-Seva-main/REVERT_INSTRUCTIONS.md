# Sahakari Seva — Rollback & Backup Documentation

This guide outlines how to safely inspect or roll back UI components to previous snapshots if desired.

---

## 🔄 Instant Rollback Options

### Option 1: Run the Automated Revert Script (Fastest)
Open your terminal in the `Sahakari-Seva-main/` directory and execute:
```bash
node revert_ui.js
```
This script immediately restores the legacy UI component snapshots from `revert_backup/` into `src/`.

### Option 2: Git Revision Checkout
To inspect or revert code to a previous commit state:
```bash
# Checkout previous commit snapshot
git checkout bae0364

# Or hard reset working branch (Caution: will discard uncommitted changes)
# git reset --hard bae0364
```

### Option 3: Manual Component Restoration
Files stored in `revert_backup/` can be manually copied back to their corresponding source locations:
- `revert_backup/index.tsx` → `src/theme/index.tsx`
- `revert_backup/Header.tsx` → `src/components/common/Header.tsx`
- `revert_backup/HomeScreen.tsx` → `src/screens/customer/HomeScreen.tsx`
- `revert_backup/WorkerCard.tsx` → `src/components/common/WorkerCard.tsx`
- `revert_backup/WorkerSearchScreen.tsx` → `src/screens/customer/WorkerSearchScreen.tsx`
- `revert_backup/CustomerBookingsScreen.tsx` → `src/screens/customer/CustomerBookingsScreen.tsx`
- `revert_backup/RootNavigator.tsx` → `src/navigation/RootNavigator.tsx`
- `revert_backup/MobileMapView.tsx` → `src/components/map/MobileMapView.tsx`

---

> [!NOTE]
> Reverting these UI components does not affect Supabase cloud synchronization (`cloudSyncAdapter.ts`, `databaseService.ts`) or 14-language localization (`src/i18n/`), which remain intact.
