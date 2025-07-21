# {{projectName}}

{{description}}

## Installation

```bash
npm install -g {{kebabCase(projectName)}}
```

Or run directly with npx:
```bash
npx {{kebabCase(projectName)}} [command]
```

## Usage

```bash
{{kebabCase(projectName)}} --help
```

### Commands

#### hello
Say hello to someone

```bash
{{kebabCase(projectName)}} hello [name]

# Options:
#   -u, --uppercase  Output in uppercase
```

## Development

### Setup
```bash
npm install
```

### Running locally
```bash
npm start -- [command]
# or
node bin/cli.js [command]
```

### Testing
```bash
npm test
```

## ClaudeBuild Integration

This CLI was scaffolded with ClaudeBuild. You can use ClaudeBuild to:

- Add new commands: `claudebuild plan --description "Add new command X"`
- Enhance features: `claudebuild build`
- Generate tests: `claudebuild agent run --name qa`

## Project Structure

```
{{projectName}}/
├── bin/
│   └── cli.js         # CLI entry point
├── src/
│   ├── commands/      # Command implementations
│   ├── utils/         # Utility functions
│   └── index.js       # Main application logic
├── tests/             # Test files
└── package.json
```

## Adding New Commands

1. Create a new file in `src/commands/`
2. Export a function that handles the command
3. Register it in `bin/cli.js`

Example:
```javascript
// src/commands/my-command.js
module.exports = function myCommand(arg, options) {
  console.log('My command executed!');
};

// bin/cli.js
program
  .command('my-command <arg>')
  .description('My new command')
  .action(require('../src/commands/my-command'));
```

## License

{{license}}

---
Generated with ClaudeBuild v{{claudebuildVersion}}