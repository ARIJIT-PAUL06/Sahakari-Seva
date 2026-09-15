const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const oldExpoDir = path.join(distDir, '_expo');
const newExpoDir = path.join(distDir, 'static_expo');

if (fs.existsSync(oldExpoDir)) {
  fs.cpSync(oldExpoDir, newExpoDir, { recursive: true });
  console.log('[postbuild] Cloned _expo -> static_expo');
}

const htmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/_expo\//g, 'static_expo/');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('[postbuild] Patched index.html (_expo/ -> static_expo/)');
}
