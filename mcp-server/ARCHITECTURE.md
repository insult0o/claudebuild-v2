# ClaudeBuild Architecture

## System Overview

ClaudeBuild implements a multi-agent development orchestration system using process isolation and message-based communication.

## Core Architecture

### 1. CLI Layer
- **Commander.js** based CLI framework
- Modular command structure
- Validation and error handling
- Beautiful terminal output

### 2. Configuration Layer
```
┌─────────────────┐
│ ConfigManager   │
├─────────────────┤
│ Providers:      │
│ - Environment   │ ← Highest Priority
│ - Project       │
│ - Global        │
│ - Default       │ ← Lowest Priority
└─────────────────┘
```

### 3. Agent System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AgentManager                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │AgentRegistry│  │ MessageBus   │  │ Process   │ │
│  │             │  │              │  │ Manager   │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
┌───────▼────────┐                   ┌────────▼───────┐
│  Agent Process │                   │ Agent Process  │
│  ┌──────────┐  │                   │ ┌──────────┐  │
│  │ Runtime  │  │ ← IPC Channel → │ │ Runtime  │  │
│  │ (Node.js)│  │                   │ │(Node.js) │  │
│  └──────────┘  │                   │ └──────────┘  │
└────────────────┘                   └────────────────┘
```

### 4. Communication Flow

```
Agent A                     MessageBus                    Agent B
   │                            │                            │
   ├──publish(channel, msg)────►│                            │
   │                            ├──subscribe(channel)────────┤
   │                            │◄───────────────────────────┤
   │                            │                            │
   │                            ├──deliver(msg)─────────────►│
   │                            │                            │
   ├──request(target, data)────►│                            │
   │                            ├──route to target──────────►│
   │                            │                            │
   │                            │◄──response(data)───────────┤
   │◄──deliver response─────────┤                            │
```

### 5. Task Execution Flow

```
1. Load tasks.json
2. Initialize AgentManager
3. For each task:
   a. Find suitable agent type
   b. Create agent process
   c. Send task via IPC
   d. Monitor progress
   e. Handle completion
4. Aggregate results
5. Cleanup
```

## Component Details

### AgentManager
- Singleton pattern for global coordination
- Manages agent lifecycle
- Routes messages between agents
- Monitors health and resources
- Handles failures and restarts

### AgentProcess
- Wraps child_process.spawn()
- Manages IPC communication
- Tracks metrics and logs
- Implements health checks
- Handles graceful shutdown

### AgentRegistry
- Stores agent type definitions
- Matches capabilities to tasks
- Supports dynamic registration
- Handles BMAD agent definitions

### MessageBus
- Pub/sub messaging
- Request/response patterns
- Event broadcasting
- Channel-based routing
- Message queuing

### Configuration System
- Provider-based architecture
- Environment variable mapping
- Secure credential storage
- YAML file support
- Default value fallbacks

### Template Engine
- Variable interpolation
- Helper functions (camelCase, kebabCase, etc.)
- Recursive directory processing
- Binary file handling
- Git integration

## Security Considerations

1. **Process Isolation**: Each agent runs in a separate process with limited permissions
2. **Credential Encryption**: Sensitive data encrypted at rest
3. **Input Validation**: All user inputs validated before processing
4. **Resource Limits**: CPU, memory, and timeout constraints per agent

## Performance Characteristics

1. **Parallel Execution**: Up to N agents running simultaneously
2. **Async I/O**: Non-blocking file and network operations
3. **Event-Driven**: Efficient event loop utilization
4. **Message Queuing**: Prevents message loss under load

## Extensibility Points

1. **Agent Types**: Add new agent types via handlers/
2. **Runtimes**: Support for Python, Ruby, etc. runtimes
3. **Templates**: Custom project scaffolding templates
4. **Integrations**: External service integrations
5. **Message Protocols**: Custom communication protocols

## MCP Integration

The MCP server provides:
- Tool-based access to ClaudeBuild commands
- Resource endpoints for context and status
- Event streaming for real-time updates
- Programmatic control of agent orchestration

## Error Handling Strategy

1. **Agent Failures**: Auto-restart with exponential backoff
2. **Communication Errors**: Message retry with timeout
3. **Resource Exhaustion**: Graceful degradation
4. **Invalid Tasks**: Validation and user feedback
5. **System Crashes**: Checkpoint recovery

## Monitoring & Observability

- Agent health metrics
- Task completion tracking
- Resource usage monitoring
- Error and warning logs
- Performance metrics
- Status board updates