# {{projectName}}

{{description}}

## Overview

This is a full-stack application built with ClaudeBuild. It consists of:
- **Frontend**: React-based web application
- **Backend**: Node.js/Express API server
- **Shared**: Common types and utilities

## Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional, for containerized development)

## Getting Started

### Installation

1. Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```

3. Open http://localhost:3000 in your browser

### Docker Development

You can also run the entire stack using Docker:
```bash
docker-compose up
```

## Project Structure

```
{{projectName}}/
├── frontend/          # React frontend application
├── backend/           # Express backend API
├── shared/           # Shared types and utilities
├── docs/             # Documentation
└── docker-compose.yml # Docker configuration
```

## ClaudeBuild Integration

This project was scaffolded with ClaudeBuild. You can use ClaudeBuild commands to:

- Plan new features: `claudebuild plan`
- Build with AI agents: `claudebuild build`
- Monitor progress: `claudebuild status`

## Scripts

### Frontend
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

{{license}}

---
Generated with ClaudeBuild v{{claudebuildVersion}}