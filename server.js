import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server...');
console.log('Looking for dist folder at:', path.join(__dirname, 'dist'));

if (fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('✅ dist folder found');
  console.log('Files in dist:', fs.readdirSync(path.join(__dirname, 'dist')));
} else {
  console.log('❌ dist folder NOT found');
}

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
