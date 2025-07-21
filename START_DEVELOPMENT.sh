#!/bin/bash

# ClaudeBuild Development Kickoff Script
# This script sets up the initial development environment

echo "🚀 Starting ClaudeBuild Development"
echo "=================================="
echo ""

# Create initial directory structure
echo "📁 Creating project structure..."
mkdir -p src/cli/{commands,utils,templates}
mkdir -p src/{core,agents,orchestrator,integrations}
mkdir -p tests/{unit,integration}
mkdir -p config
mkdir -p .claudebuild/{agents,artifacts,logs,checkpoints}

# Initialize git repository
echo "📝 Initializing git repository..."
git init
git checkout -b main

# Create feature branch for first story
echo "🌿 Creating feature branch for STORY-001..."
git checkout -b feature/cli-framework

# Install initial dependencies
echo "📦 Installing dependencies..."
npm init -y
npm install commander chalk ora figlet inquirer
npm install -D jest nodemon eslint prettier

# Create basic .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.claudebuild/logs/
.claudebuild/checkpoints/
dist/
*.log
.DS_Store
EOF

# Create initial CLI entry point
cat > bin/claudebuild.js << 'EOF'
#!/usr/bin/env node

console.log('🚧 ClaudeBuild CLI - Under Construction');
console.log('Run npm run dev to start development');
EOF

chmod +x bin/claudebuild.js

# Update package.json with bin entry
echo "📝 Updating package.json..."
node -e "
const pkg = require('./package.json');
pkg.bin = { claudebuild: './bin/claudebuild.js' };
pkg.scripts = {
  ...pkg.scripts,
  dev: 'nodemon src/index.js',
  test: 'jest',
  'test:watch': 'jest --watch',
  lint: 'eslint src',
  'lint:fix': 'eslint src --fix'
};
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

# Create initial README
cat > README.md << 'EOF'
# ClaudeBuild

Multi-agent development orchestrator that coordinates AI agents to build software projects in parallel.

## Status
🚧 Under active development - Following BMAD methodology

## Current Sprint
Working on STORY-001: CLI Framework Setup

## Installation
```bash
npm install -g claudebuild
```

## Usage
```bash
claudebuild --help
```

## Development
```bash
npm install
npm run dev
```

## Architecture
See `docs/architecture.md` for system design.
EOF

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📋 Next steps:"
echo "1. Start development: npm run dev"
echo "2. Run tests: npm test"
echo "3. Check status: cat STATUS_BOARD.md"
echo ""
echo "🎯 Current task: STORY-001 - CLI Framework Setup"
echo "📁 Working branch: feature/cli-framework"
echo ""
echo "Happy coding! 🚀"
EOF

chmod +x START_DEVELOPMENT.sh