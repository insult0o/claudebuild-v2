const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

/**
 * MCP Tool Usage Logger
 * Tracks all tool usage for audit and monitoring
 */
class ToolUsageLogger extends EventEmitter {
  constructor() {
    super();
    this.logDir = path.join(process.cwd(), '.claudebuild/logs/tool-usage');
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      deniedCalls: 0,
      toolUsage: new Map(),
      agentUsage: new Map(),
      totalCost: 0
    };
  }

  /**
   * Log tool invocation
   */
  async logInvocation(entry) {
    const {
      timestamp = new Date().toISOString(),
      agentId,
      tool,
      parameters,
      result,
      duration,
      cost = 0,
      error = null
    } = entry;

    const logEntry = {
      timestamp,
      agentId,
      tool,
      parameters,
      result: result ? 'success' : 'failed',
      duration,
      cost,
      error
    };

    // Update stats
    this.updateStats(logEntry);

    // Write to log file
    await this.writeLog(logEntry);

    // Emit event for real-time monitoring
    this.emit('tool:used', logEntry);

    // Check for suspicious activity
    await this.checkSuspiciousActivity(logEntry);
  }

  /**
   * Update statistics
   */
  updateStats(entry) {
    this.stats.totalCalls++;
    
    if (entry.result === 'success') {
      this.stats.successfulCalls++;
    } else if (entry.result === 'denied') {
      this.stats.deniedCalls++;
    } else {
      this.stats.failedCalls++;
    }
    
    // Update tool usage count
    const toolCount = this.stats.toolUsage.get(entry.tool) || 0;
    this.stats.toolUsage.set(entry.tool, toolCount + 1);
    
    // Update agent usage count
    const agentCount = this.stats.agentUsage.get(entry.agentId) || 0;
    this.stats.agentUsage.set(entry.agentId, agentCount + 1);
    
    // Update cost
    this.stats.totalCost += entry.cost;
  }

  /**
   * Write log entry to file
   */
  async writeLog(entry) {
    // Create log directory if needed
    await fs.mkdir(this.logDir, { recursive: true });
    
    // Daily log files
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.jsonl`);
    
    // Append to log file
    await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
  }

  /**
   * Check for suspicious activity
   */
  async checkSuspiciousActivity(entry) {
    // High frequency checks
    const recentCalls = await this.getRecentCalls(entry.agentId, 60); // Last minute
    if (recentCalls.length > 10) {
      this.emit('alert:high_frequency', {
        agentId: entry.agentId,
        calls: recentCalls.length,
        period: '1 minute'
      });
    }
    
    // Unusual tool usage
    if (entry.tool === 'file_system' && entry.parameters.path?.includes('..')) {
      this.emit('alert:path_traversal', {
        agentId: entry.agentId,
        path: entry.parameters.path
      });
    }
    
    // High cost operations
    if (entry.cost > 0.1) {
      this.emit('alert:high_cost', {
        agentId: entry.agentId,
        tool: entry.tool,
        cost: entry.cost
      });
    }
  }

  /**
   * Get recent calls by agent
   */
  async getRecentCalls(agentId, seconds) {
    const since = new Date(Date.now() - seconds * 1000);
    const calls = [];
    
    // Read today's log
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.jsonl`);
    
    try {
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.trim().split('\n');
      
      for (const line of lines) {
        if (!line) continue;
        const entry = JSON.parse(line);
        if (entry.agentId === agentId && new Date(entry.timestamp) > since) {
          calls.push(entry);
        }
      }
    } catch (error) {
      // Log file may not exist yet
    }
    
    return calls;
  }

  /**
   * Generate usage report
   */
  async generateReport(startDate, endDate) {
    const report = {
      period: { start: startDate, end: endDate },
      summary: {
        totalCalls: 0,
        successRate: 0,
        totalCost: 0,
        uniqueAgents: new Set(),
        toolBreakdown: new Map(),
        agentBreakdown: new Map()
      },
      dailyStats: [],
      topAgents: [],
      topTools: [],
      alerts: []
    };
    
    // Process logs for date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
      const date = current.toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `${date}.jsonl`);
      
      try {
        const content = await fs.readFile(logFile, 'utf-8');
        const lines = content.trim().split('\n');
        
        for (const line of lines) {
          if (!line) continue;
          const entry = JSON.parse(line);
          
          report.summary.totalCalls++;
          report.summary.totalCost += entry.cost;
          report.summary.uniqueAgents.add(entry.agentId);
          
          // Update tool breakdown
          const toolCount = report.summary.toolBreakdown.get(entry.tool) || 0;
          report.summary.toolBreakdown.set(entry.tool, toolCount + 1);
          
          // Update agent breakdown
          const agentCount = report.summary.agentBreakdown.get(entry.agentId) || 0;
          report.summary.agentBreakdown.set(entry.agentId, agentCount + 1);
        }
      } catch (error) {
        // Log file may not exist
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Calculate success rate
    if (report.summary.totalCalls > 0) {
      const successCount = Array.from(report.summary.toolBreakdown.values())
        .reduce((sum, count) => sum + count, 0);
      report.summary.successRate = (successCount / report.summary.totalCalls) * 100;
    }
    
    // Get top agents and tools
    report.topAgents = Array.from(report.summary.agentBreakdown.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent, count]) => ({ agent, count }));
      
    report.topTools = Array.from(report.summary.toolBreakdown.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tool, count]) => ({ tool, count }));
    
    return report;
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      toolUsage: Array.from(this.stats.toolUsage.entries()),
      agentUsage: Array.from(this.stats.agentUsage.entries())
    };
  }
}

module.exports = ToolUsageLogger;