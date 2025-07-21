# /plan - BMAD Planning Command

## Purpose
Triggers the Planner Agent to break down a high-level requirement using BMAD methodology.

## Usage
```
/plan "Build a secure PDF content parser that extracts structured tables, metadata, and images"
```

## Process

### 1. Research Phase
- Search for best practices using web search and Context7 MCP
- Analyze existing codebase structure
- Identify required technologies and dependencies

### 2. BMAD Breakdown
- **B**reak down the requirement into atomic components
- **M**ap dependencies and architecture
- **A**ssign tasks to appropriate agent roles
- **D**eliver structured output

### 3. Output Generation
Think ultra hard about the requirements and create:
- `plans/PRD-{timestamp}.md` - Product Requirements Document
- `plans/architecture-{timestamp}.md` - Technical architecture
- `tasks/tasks.json` - Structured task tree for agents

### 4. Task Structure
Each task should include:
- Unique ID
- Description
- Agent role (dev, architect, qa, etc.)
- Dependencies
- Acceptance criteria
- Estimated complexity

### 5. Context Gathering
- Reference existing code patterns
- Include relevant documentation
- Consider security and performance requirements
- Think about edge cases and error handling

## Example Output
```json
{
  "tasks": [
    {
      "id": "pdf-parser-001",
      "title": "Create PDF parsing engine",
      "agent": "dev",
      "dependencies": [],
      "spec": "specs/pdf-parser.md"
    },
    {
      "id": "table-extractor-002",
      "title": "Implement table extraction",
      "agent": "dev", 
      "dependencies": ["pdf-parser-001"],
      "spec": "specs/table-extractor.md"
    }
  ]
}
```

## Best Practices
- Always think ultra hard during planning
- Create comprehensive specs, not just task lists
- Consider all agent roles needed
- Plan for testing and documentation
- Include deployment considerations

## Next Steps
After planning, typically run:
- `/spec` for detailed specifications
- `/build --from tasks.json` to start implementation