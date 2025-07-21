const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null;

function startServer() {
  console.log('Starting MCP server...');
  serverProcess = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`MCP server exited with code ${code}, restarting...`);
    setTimeout(startServer, 2000);
  });
}

startServer();

process.on('SIGINT', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit();
});