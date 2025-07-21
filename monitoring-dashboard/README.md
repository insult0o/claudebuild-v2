# ClaudeBuild Monitoring Dashboard

Real-time monitoring dashboard for ClaudeBuild multi-agent orchestration system.

## Features
- Real-time agent status updates via WebSocket
- Workflow visualization
- Task progress tracking
- Performance metrics
- Agent logs streaming

## Installation
```bash
npm install
```

## Development
```bash
npm run dev
```

## Production
```bash
npm run build:client
npm start
```

## Architecture
- Backend: Node.js + Express + Socket.io
- Frontend: Vanilla JS (to be converted to React)
- Real-time: WebSocket connections
- API: RESTful endpoints for historical data
