# /review - Multi-Perspective Code Review Command

## Purpose
Launches Reviewer Agents with different "hats" to review code from multiple perspectives.

## Usage
```
/review --pr 123 --hat security
/review --branch feature/auth --hat all
/review --latest --hat "ux,performance,best-practices"
```

## Review Perspectives (Hats)

### 🔒 Security
- SQL injection vulnerabilities
- XSS and CSRF protection
- Authentication/authorization flaws
- Sensitive data exposure
- Dependency vulnerabilities

### 🎨 UX/UI
- User experience flow
- Error message clarity
- Loading states
- Accessibility (a11y)
- Mobile responsiveness

### ⚡ Performance
- Database query optimization
- Caching opportunities
- Bundle size impact
- Memory leaks
- Async operation handling

### 📚 Best Practices
- Framework conventions
- Code style consistency
- DRY principle violations
- SOLID principles
- Testing coverage

### 🧪 QA
- Edge case handling
- Error boundaries
- Input validation
- Test coverage gaps
- Integration points

### 📝 Documentation
- Missing JSDoc/comments
- README updates needed
- API documentation
- Example code accuracy
- Changelog entries

## Process

### 1. Code Retrieval
```bash
# For PR review
gh pr checkout {pr_number}
gh pr diff {pr_number}

# For branch review  
git checkout {branch}
git diff main...{branch}
```

### 2. Multi-Agent Review
Think ultra hard about potential issues:
- Spawn reviewer for each hat
- Analyze code changes
- Check against best practices
- Reference MCP context (docs, patterns)

### 3. Output Format
Each reviewer produces:
```markdown
## {Hat} Review

### ✅ Strengths
- Well-structured error handling
- Consistent naming conventions

### ⚠️ Concerns
- Missing input validation on line 45
- Potential race condition in async handler

### 🔧 Suggestions
- Add rate limiting to API endpoint
- Consider using transaction for DB operations

### 📊 Score: 7/10
```

### 4. GitHub Integration
- Post reviews as PR comments
- Add inline suggestions
- Set review status (approve/request changes)
- Create issues for major findings

## Advanced Options

### Parallel Multi-Hat Review
```
/review --pr 123 --hat all --parallel
```
Spawns all reviewers simultaneously as sub-agents.

### Custom Review Criteria
```
/review --pr 123 --criteria "specs/review-criteria.md"
```

### Comparison Review
```
/review --compare "v1.0.0,main" --hat performance
```
Reviews performance impact between versions.

## Integration with CI/CD
- Triggered automatically on PR creation
- Block merge on critical issues
- Generate review reports
- Track review metrics over time

## Example Workflow
```bash
# Comprehensive review
/review --latest --hat all --parallel

# Security-focused review for auth changes
/review --pr 456 --hat security --criteria "auth-checklist.md"

# Quick best practices check
/review --branch feature/refactor --hat best-practices
```