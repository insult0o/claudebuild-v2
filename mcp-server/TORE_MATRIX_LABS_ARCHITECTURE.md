# TORE Matrix Labs - Multi-Agent Architecture Documentation

## Overview
This document captures the comprehensive architecture discussions and implementation strategies from TORE Matrix Labs for building a multi-agent AI code factory using MCP (Model Context Protocol) and specialized agent teams.

## Key Architectural Components

### 1. MCP Foundation: Unified Context & Tools
The Model Context Protocol (MCP) provides the foundation as a client-server system:

- **MCP Servers** expose capabilities (file reads, DB queries, APIs) through standardized interfaces
- **MCP Hosts/Clients** - agents act as MCP hosts, negotiating with servers and invoking functions
- **Secure Integration** - MCP servers handle auth, auditing, and safe communication

MCP servers serve as adapters translating between agents and real-world systems:
- Code repositories (Git)
- CI/CD pipelines
- Documentation archives
- Databases (requirements DB)
- Web search/QA (external knowledge)
- Legacy tools

### 2. Specialized Agent Roles & Phases

#### Strategic Agents (Planning & Architecture)
- **Planner Agent**: Translates requirements into dependency graph of tasks
- **Architect Agent**: Produces detailed specifications (system architecture, data schemas, UI designs)

#### Execution Agents (Build & Code)
- **Builder Agents**: Multiple LLM-powered coder agents in parallel, each focused on a domain
- Examples: PDFParserAgent, UIAgent, APIAgent
- Role specialization: code committer, documenter, API integrator

#### Quality & Integration Agents
- **QA/Manager Agents**: Run automated tests, linters, validation tools
- **TestAgent**: Executes unit/integration tests
- **AnalysisAgent**: Runs static analysis or security scans
- **ReviewAgent**: Checks code style and consistency
- **Release Agent**: Handles merges, tagging, deployment

#### Future Specialists (Phase 2)
- **Security Agent**: Vulnerability scanning
- **Performance Agent**: Profiling and optimization
- **UX Agent**: Interface flow refinement

### 3. Contextual Data & Knowledge Integration

- **Codebase & Repo Context**: Git repository access through MCP servers
- **Planner Outputs & Specs**: Shared space for JSON task lists, design docs, UML diagrams
- **Domain Knowledge Repositories**: Internal knowledge (style guides, API docs, architecture manuals)
- **External Retrieval (RAG)**: Web search/QA for missing information
- **Shared Memory & Logs**: Central store for debugging and future learning

### 4. Orchestrated Development Workflow

1. **Issue/Input → Planning**: Evaluator Agent classifies request, invokes Planner
2. **Specification**: Architect Agent crafts detailed specifications
3. **Parallel Build Agents**: Independent builders launched for each task
4. **Integration & Testing**: Manager/QA Agent collects outputs, runs tests
5. **Code Review & Merge**: Review Agent performs analysis, generates PR
6. **Feedback Loop**: Bugs/changes loop back into backlog

### 5. BMAD Method Integration

BMAD (Breakthrough Method of Agile AI-Driven Development) uses two phases:

#### Agentic Planning
- Analyst/PM/Architect agents collaborate on complete product specification
- Produces PRD and architecture documents
- Iterative refinement with human feedback

#### Context-Engineered Development
- Scrum Master agent translates plans into hyper-detailed work items
- Each story file includes embedded context:
  - Design rationales
  - Architecture notes
  - Test criteria
  - Implementation guidance

### 6. CLAUDEBUILDS Enhancement Recommendations

To leverage BMAD's strengths in CLAUDEBUILDS:

1. **Formalize Planning Artifacts**
   - Ensure Planning Team produces PRD and Architecture spec
   - Use dedicated prompts for Analyst/Architect roles

2. **Embed Full Context in Tasks**
   - Package each feature as self-contained story file
   - Include background, acceptance criteria, architecture notes

3. **Add Scrum-Master/QA Agent**
   - Review tasks and code automatically
   - Feed test results back into story files

4. **Use Orchestrator as Multi-Role Switch**
   - Allow orchestrator to adopt different roles on command
   - Handle sub-tasks dynamically

5. **Integrate Knowledge/Decision Trees**
   - Maintain architectural choices and coding guidelines
   - Store key rules in shared memory for consistency

### 7. Infrastructure Blueprint

- **MCP Server Layer**: Git, filesystem, DB, web/multi-tool servers
- **Agent Layer**: LLM instances with scoped prompts and permitted tools
- **Orchestrator & Task Engine**: Controller tracking global plan and dependencies
- **Shared Context Store**: Database/vector store for plans, docs, results
- **Human-in-the-Loop Interfaces**: GUI tools for intervention
- **Monitoring & Feedback**: Cost and performance metrics logging

## Example: PDF-Parsing Toolchain

1. Planner Agent reads brief ("Extract tables from invoices accurately")
2. Architect specifies software architecture (Python backend, React frontend)
3. ParserAgent implements text extraction, UIAgent scaffolds correction interface
4. Agents retrieve sample PDFs and query web for unknown formats (RAG)
5. TestAgent runs extractor suite, UIAgent enables human corrections
6. QA agents ensure stability, Release Agent packages application

## Benefits

- **Parallelism**: Multiple features built simultaneously
- **Modularity**: Subprojects evolve independently
- **Quality**: Spec-driven, documented process
- **Scalability**: New agents are just new processes with new prompts

## Next Steps

1. Prototype MCP server and orchestrator
2. Define MCP schema for code repo and tools
3. Implement initial Planner agent prompts
4. Test on simple feature
5. Add builder and QA agents iteratively

This architecture creates a **self-driven AI software factory** that turns rough ideas into polished products efficiently, setting the stage for truly "AAA" AI-driven development.

---
*Source: TORE Matrix Labs Architecture Discussions and BMAD Method Documentation*