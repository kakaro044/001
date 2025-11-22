const { spawn } = require('child_process');
// Remove ngrok import since we'll use the fixed URL approach
// const ngrok = require('ngrok');

// Start the server
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

console.log('Starting server...');

// Handle server exit
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle server error
server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Give the server a moment to start, then show the URLs
setTimeout(() => {
  console.log('Server is running on http://localhost:3002');
  console.log('Ngrok URL (fixed): https://c63faeff4c93.ngrok-free.app');
  console.log('Use either URL to access your dashboard');
}, 2000);