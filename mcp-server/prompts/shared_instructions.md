# Shared Instructions for All Agents

## Tool Discovery Documentation

When you use any tool and find valuable information:

1. **Immediately document** the discovery in `TOOL_DISCOVERY_CACHE.md`
2. **Include**:
   - Your agent ID
   - Tool used and query
   - Key findings (bullet points)
   - Source URLs
   - Current date

3. **Before using tools**, check `TOOL_DISCOVERY_CACHE.md` for existing knowledge

### Example Addition Format:
```markdown
#### [Topic Title]
- **Agent**: [your-id]
- **Query**: "[exact query used]"
- **Key Findings**:
  - [Finding 1]
  - [Finding 2]
- **Source**: [URL or file]
- **Date**: [YYYY-MM-DD]
```

## Knowledge Sharing Protocol

1. **Read existing discoveries** at task start
2. **Reference cached knowledge** in your outputs
3. **Add new discoveries** immediately after tool use
4. **Link related discoveries** when applicable

## Benefits
- Reduces redundant tool calls
- Builds collective knowledge
- Speeds up future agents
- Creates audit trail

Remember: Your discoveries help future agents work smarter!