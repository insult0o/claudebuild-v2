# CLAUDEBUILDS: Original Multi-Agent Architecture Design

## Overview
CLAUDEBUILDS is a multi-agent architecture for automated software development, using AI agent orchestration with a central Brain orchestrator coordinating specialized teams. As IBM defines it: "coordinating multiple specialized AI agents within a unified system to efficiently achieve shared objectives."

## Core Architecture

### Brain (Orchestrator)
The lead agent that coordinates everything:
- Ingests user prompts
- Formulates high-level plans
- Dispatches subtasks to team leads or agents
- Decomposes queries into subtasks with clear objectives
- Aggregates results from all agents into the final program

### Planning Team
Agents specialized in analysis and design:
- Interpret user ideas
- Research requirements
- Explore designs
- Break down projects into concrete pieces
- Create structured plans (design documents or issue lists)
- Save plans to memory database for reference

#### Planning Team Workflow:
1. **Interpret and Define the Project Goal**
   - Read user's prompt and clarify objectives
   - Query user for more details if needed
   - Establish clear goals

2. **Decompose into Subtasks**
   - Break main goal into components
   - Create work assignments for each subtask
   - Follow Microsoft's advice: complex goals → smaller specialized tasks

3. **Research and Strategy**
   - Gather information for each subtask
   - Use web searches, documentation, internal codebases
   - Employ MCP or similar protocols for tool access

4. **Produce a Structured Plan**
   - Output formal plan document or set of issues
   - Include assigned subtasks, expected outputs, acceptance criteria
   - Store in memory for other agents to consume

5. **Iterative Refinement**
   - Loop back to adjust plan based on new information
   - Ask user questions for clarification
   - Update plan accordingly

### Coding Team
Agents focused on implementation and testing:
- **Builder**: Writes code
- **Tester**: Writes and runs tests
- **Reviewer**: Checks code quality, security

#### Coding Team Workflow:
1. **Setup Development Environment**
   - Create Git repository
   - Establish .claude workspace

2. **Implement Features**
   - Write code for each planned subtask
   - Use full developer environment
   - Connect to MCP servers for extended capabilities

3. **Write and Run Tests**
   - Create unit/integration tests
   - Follow test-driven development pattern
   - Write failing tests first, then code to pass

4. **Continuous Integration & Validation**
   - Run linting, type-checking, security scans
   - Execute static analysis tools
   - Validate against quality standards

5. **Iterative Commit Cycle**
   - Write small portions and test
   - Commit changes frequently
   - Update docs as needed

### Memory / Knowledge Base
A shared database of plans, findings, and code artifacts:
- Enables agents to "retain context, recognize patterns over time and adapt"
- Stores project plans, research notes, design options, test results
- Grows into valuable repository of project context
- Prevents lost work due to context limits
- Allows cross-agent knowledge sharing

## Tools and Knowledge Management

### Tool Access
- Agents access resources via secure protocols (MCP, etc.)
- Web search APIs
- Code search tools
- Documentation servers
- Internal data sources
- Compilers, linters, test frameworks

### Knowledge Base Structure
- Centralized memory store
- Project plans
- Research findings
- Intermediate code
- Lessons learned
- Queryable by all agents

### Coordination Protocols
- Structured messages (ACP)
- Agent-to-agent calls (A2A)
- Intent-based messaging
- Clear task descriptions with expected outputs

## Hierarchical Coordination

### Sub-Orchestrators
- Planning Lead agent overseeing planning subagents
- Coding Lead overseeing coder/tester subagents
- Both report to main Brain
- Multi-tier orchestration for complex projects

### Best Practices
1. **Parallel Execution**: Run independent tasks simultaneously
2. **Clear Task Descriptions**: Well-defined goals and instructions
3. **Security and Scope**: Limited permissions per agent
4. **Iterative Feedback**: Validation and review loops
5. **Logging and Evaluation**: Track decisions and quality

## Comparison with Existing Frameworks

### ChatDev
- Virtual software company with agent roles
- Waterfall model orchestration
- Shows AI agents can cooperatively produce full applications

### Anthropic Research
- Lead agent + parallel subagents pattern
- Save plans to memory
- Iterative planning loops

### Claude Code
- Shows how LLMs use shell tools
- Manages permissions
- Follows TDD workflows

### Google ADK
- Multi-agent apps with hierarchical agents
- Rich tool support
- Modularity and orchestration

## Key Benefits

- **Parallelism**: Multiple features built simultaneously (90% time reduction)
- **Specialization**: Each agent focuses on specific expertise
- **Memory Persistence**: Context survives across sessions
- **Scalability**: Add new agent types as needed
- **Quality**: Structured workflow ensures tested, documented code

## Implementation Recommendations

1. Start with Brain orchestrator and basic team structure
2. Implement memory/knowledge base early
3. Use MCP for standardized tool access
4. Begin with simple Planning + Coding teams
5. Add specialized agents incrementally
6. Focus on clear task delegation
7. Implement robust logging from start

This architecture creates a self-managed "software factory" powered by AI, capable of autonomously producing complete, tested software applications from high-level user prompts.

---
*Source: TORE Matrix Labs CLAUDEBUILDS Discussion*