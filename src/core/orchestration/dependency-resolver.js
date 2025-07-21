const Logger = require('../../cli/utils/logger');

/**
 * Dependency Resolver
 * Manages task dependencies and determines execution order
 */
class DependencyResolver {
  constructor() {
    // Map of workflow ID to dependency graph
    this.graphs = new Map();
  }

  /**
   * Build dependency graph for a workflow
   */
  buildGraph(workflowId, tasks, dependencies = {}) {
    const graph = {
      nodes: new Set(tasks),
      edges: new Map(), // task -> dependencies
      reverseEdges: new Map(), // task -> dependents
      completed: new Set(),
      inProgress: new Set()
    };

    // Initialize nodes
    for (const task of tasks) {
      graph.edges.set(task, new Set());
      graph.reverseEdges.set(task, new Set());
    }

    // Build edges
    for (const [task, deps] of Object.entries(dependencies)) {
      if (!graph.nodes.has(task)) {
        Logger.warn(`Task ${task} in dependencies but not in task list`);
        continue;
      }

      for (const dep of deps) {
        if (!graph.nodes.has(dep)) {
          Logger.warn(`Dependency ${dep} not found in task list`);
          continue;
        }

        // Add edge: task depends on dep
        graph.edges.get(task).add(dep);
        
        // Add reverse edge: dep is required by task
        graph.reverseEdges.get(dep).add(task);
      }
    }

    // Check for cycles
    if (this.hasCycle(graph)) {
      throw new Error('Circular dependency detected in workflow');
    }

    this.graphs.set(workflowId, graph);
    
    Logger.debug(`Built dependency graph for workflow ${workflowId}:`, {
      nodes: graph.nodes.size,
      totalDependencies: Array.from(graph.edges.values())
        .reduce((sum, deps) => sum + deps.size, 0)
    });
  }

  /**
   * Check if graph has cycles using DFS
   */
  hasCycle(graph) {
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (node) => {
      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.edges.get(node) || new Set();
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (dfs(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          Logger.error(`Cycle detected: ${node} -> ${dep}`);
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        if (dfs(node)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get tasks that are ready to execute
   */
  getReadyTasks(workflowId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return [];
    }

    const ready = [];

    for (const task of graph.nodes) {
      // Skip if already completed or in progress
      if (graph.completed.has(task) || graph.inProgress.has(task)) {
        continue;
      }

      // Check if all dependencies are completed
      const dependencies = graph.edges.get(task) || new Set();
      let allDepsCompleted = true;

      for (const dep of dependencies) {
        if (!graph.completed.has(dep)) {
          allDepsCompleted = false;
          break;
        }
      }

      if (allDepsCompleted) {
        ready.push(task);
      }
    }

    return ready;
  }

  /**
   * Mark task as completed
   */
  completeTask(workflowId, taskId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return;
    }

    graph.completed.add(taskId);
    graph.inProgress.delete(taskId);

    Logger.debug(`Task ${taskId} marked as completed in dependency graph`);
  }

  /**
   * Mark task as in progress
   */
  startTask(workflowId, taskId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return;
    }

    graph.inProgress.add(taskId);
  }

  /**
   * Get task dependencies
   */
  getTaskDependencies(workflowId, taskId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return [];
    }

    return Array.from(graph.edges.get(taskId) || []);
  }

  /**
   * Get task dependents (tasks that depend on this task)
   */
  getTaskDependents(workflowId, taskId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return [];
    }

    return Array.from(graph.reverseEdges.get(taskId) || []);
  }

  /**
   * Get execution order (topological sort)
   */
  getExecutionOrder(workflowId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return [];
    }

    const visited = new Set();
    const order = [];

    const dfs = (node) => {
      visited.add(node);

      const dependencies = graph.edges.get(node) || new Set();
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          dfs(dep);
        }
      }

      order.push(node);
    };

    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return order;
  }

  /**
   * Get critical path (longest dependency chain)
   */
  getCriticalPath(workflowId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return [];
    }

    const memo = new Map();

    const findLongestPath = (node) => {
      if (memo.has(node)) {
        return memo.get(node);
      }

      const dependencies = graph.edges.get(node) || new Set();
      if (dependencies.size === 0) {
        memo.set(node, [node]);
        return [node];
      }

      let longestPath = [];
      for (const dep of dependencies) {
        const depPath = findLongestPath(dep);
        if (depPath.length > longestPath.length) {
          longestPath = depPath;
        }
      }

      const path = [...longestPath, node];
      memo.set(node, path);
      return path;
    };

    let criticalPath = [];
    for (const node of graph.nodes) {
      const path = findLongestPath(node);
      if (path.length > criticalPath.length) {
        criticalPath = path;
      }
    }

    return criticalPath;
  }

  /**
   * Get parallel execution groups
   */
  getParallelGroups(workflowId) {
    const order = this.getExecutionOrder(workflowId);
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return [];
    }

    const groups = [];
    const assigned = new Set();

    for (const task of order) {
      if (assigned.has(task)) {
        continue;
      }

      // Find all tasks that can run in parallel with this task
      const group = [task];
      assigned.add(task);

      for (const other of order) {
        if (assigned.has(other)) {
          continue;
        }

        // Check if they have conflicting dependencies
        const taskDeps = graph.edges.get(task) || new Set();
        const otherDeps = graph.edges.get(other) || new Set();
        
        // Can run in parallel if neither depends on the other
        if (!taskDeps.has(other) && !otherDeps.has(task)) {
          // Also check transitive dependencies
          const taskDependents = this.getTransitiveDependents(graph, task);
          const otherDependents = this.getTransitiveDependents(graph, other);
          
          if (!taskDependents.has(other) && !otherDependents.has(task)) {
            group.push(other);
            assigned.add(other);
          }
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Get all transitive dependents of a task
   */
  getTransitiveDependents(graph, task) {
    const dependents = new Set();
    const queue = [task];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const directDependents = graph.reverseEdges.get(current) || new Set();
      for (const dep of directDependents) {
        dependents.add(dep);
        queue.push(dep);
      }
    }

    return dependents;
  }

  /**
   * Visualize dependency graph (returns ASCII representation)
   */
  visualize(workflowId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return 'No graph found';
    }

    let output = 'Dependency Graph:\n';
    output += '================\n\n';

    for (const task of graph.nodes) {
      const deps = Array.from(graph.edges.get(task) || []);
      const status = graph.completed.has(task) ? '✓' : 
                    graph.inProgress.has(task) ? '⚡' : '○';
      
      output += `${status} ${task}`;
      
      if (deps.length > 0) {
        output += ' → [' + deps.join(', ') + ']';
      }
      
      output += '\n';
    }

    output += '\n';
    output += 'Critical Path: ' + this.getCriticalPath(workflowId).join(' → ') + '\n';

    return output;
  }

  /**
   * Remove workflow graph
   */
  removeWorkflow(workflowId) {
    this.graphs.delete(workflowId);
  }

  /**
   * Get statistics about the dependency graph
   */
  getStats(workflowId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return null;
    }

    const criticalPath = this.getCriticalPath(workflowId);
    const parallelGroups = this.getParallelGroups(workflowId);

    return {
      totalTasks: graph.nodes.size,
      completedTasks: graph.completed.size,
      inProgressTasks: graph.inProgress.size,
      remainingTasks: graph.nodes.size - graph.completed.size - graph.inProgress.size,
      criticalPathLength: criticalPath.length,
      maxParallelism: Math.max(...parallelGroups.map(g => g.length)),
      averageDependencies: Array.from(graph.edges.values())
        .reduce((sum, deps) => sum + deps.size, 0) / graph.nodes.size
    };
  }
}

module.exports = DependencyResolver;