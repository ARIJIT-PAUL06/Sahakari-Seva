// ==============================================================================
// SAHAKARI SEVA - INSTANT UI REDESIGN REVERT SCRIPT
// Run: `node revert_ui.js` to instantly restore all files back to the pre-redesign state!
// ==============================================================================

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, 'revert_backup');

const FILE_MAP = [
  { backup: 'index.tsx', target: 'src/theme/index.tsx' },
  { backup: 'Header.tsx', target: 'src/components/common/Header.tsx' },
  { backup: 'HomeScreen.tsx', target: 'src/screens/customer/HomeScreen.tsx' },
  { backup: 'WorkerCard.tsx', target: 'src/components/common/WorkerCard.tsx' },
  { backup: 'WorkerSearchScreen.tsx', target: 'src/screens/customer/WorkerSearchScreen.tsx' },
  { backup: 'CustomerBookingsScreen.tsx', target: 'src/screens/customer/CustomerBookingsScreen.tsx' },
  { backup: 'RootNavigator.tsx', target: 'src/navigation/RootNavigator.tsx' },
  { backup: 'MobileMapView.tsx', target: 'src/components/map/MobileMapView.tsx' },
];

console.log('🔄 Reverting Sahakari Seva Customer UI to previous state...');

let count = 0;
for (const item of FILE_MAP) {
  const src = path.join(BACKUP_DIR, item.backup);
  const dest = path.join(__dirname, item.target);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(` ✅ Restored ${item.target}`);
    count++;
  } else {
    console.warn(` ⚠️ Backup file not found: ${src}`);
  }
}

console.log(`\n🎉 Done! Restored ${count} files. To test: npm run dev or deploy to Vercel.`);
