# ClaudeBuild Agent Roles

## 🧠 Planner Agent
**Purpose**: Requirements gathering and project planning
- Analyzes user requirements and business needs
- Generates `PRD.md` (Product Requirements Document)
- Researches market solutions and best practices
- Defines success criteria and constraints

**Tools Used**: 
- `web_search` - Research existing solutions
- `pdf_parser` - Extract requirements from documents

## 🏗️ Architect Agent  
**Purpose**: Technical design and system architecture
- Designs system architecture based on PRD
- Creates `architecture.md` with technical specifications
- Defines component boundaries and interfaces
- Selects technology stack and patterns

**Tools Used**:
- `web_search` - Research architectural patterns
- `pdf_parser` - Import technical specifications

## 📋 ScrumMaster Agent
**Purpose**: Task breakdown and story creation
- Breaks PRD into actionable `story-xxx.md` files
- Embeds full context and acceptance criteria
- Ensures proper story sequencing
- Manages dependencies between stories

**Tools Used**:
- `pdf_parser` - Extract detailed requirements

## 💻 Builder Agent
**Purpose**: Code implementation
- Executes tasks from story files
- Implements features with full context
- Commits code to feature branches
- Follows architectural guidelines

**Tools Used**:
- `web_search` - API documentation, examples
- `code_validator` - Verify implementation

## 🧪 QA Agent
**Purpose**: Quality assurance and validation
- Validates code against acceptance criteria
- Runs tests and reports results
- Checks code quality and standards
- Ensures story completion criteria met

**Tools Used**:
- `code_validator` - Validate code correctness
- `unit_test_runner` - Execute test suites

## 🤖 Orchestrator Agent
**Purpose**: Workflow coordination and management
- Sequences all agent activities
- Manages agent lifecycle
- Routes messages between agents
- Enforces tool access policies
- Monitors progress and health

**Tools Used**: All tools (for delegation)

## 🔧 DevOps Agent (Future)
**Purpose**: Deployment and infrastructure
- Manages CI/CD pipelines
- Handles deployments
- Monitors production systems
- Manages infrastructure as code

## 📊 Manager Agent
**Purpose**: Project oversight and reporting
- Tracks overall progress
- Generates status reports
- Manages PR creation and merging
- Updates STATUS_BOARD.md

## Inter-Agent Communication Flow
```
Planner → PRD.md
    ↓
Architect → architecture.md
    ↓
ScrumMaster → story-001.md, story-002.md, ...
    ↓
Builders (parallel) → feature code
    ↓
QA → validation results
    ↓
Manager → PR + merge
```

## Agent Capabilities Matrix
| Agent | Planning | Design | Code | Test | Deploy | Coordinate |
|-------|----------|--------|------|------|--------|------------|
| Planner | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Architect | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| ScrumMaster | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Builder | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| QA | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Orchestrator | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |