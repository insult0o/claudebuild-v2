const chalk = require('chalk');

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than a minute
  if (diff < 60000) {
    return 'just now';
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Default to date
  return date.toLocaleDateString();
}

/**
 * Format file size
 */
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Create a progress bar
 */
function progressBar(current, total, width = 30) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `${bar} ${percentage}%`;
}

/**
 * Format status with color
 */
function formatStatus(status) {
  const statusConfig = {
    active: { color: 'green', icon: '●' },
    running: { color: 'blue', icon: '►' },
    paused: { color: 'yellow', icon: '‖' },
    completed: { color: 'gray', icon: '✓' },
    failed: { color: 'red', icon: '✗' },
    pending: { color: 'gray', icon: '○' }
  };

  const config = statusConfig[status] || { color: 'white', icon: '?' };
  return chalk[config.color](`${config.icon} ${status}`);
}

/**
 * Format table data
 */
function formatTable(data, headers) {
  if (!data || data.length === 0) return '';

  // Calculate column widths
  const widths = headers.map((header, i) => {
    const values = data.map(row => String(row[i] || ''));
    return Math.max(header.length, ...values.map(v => v.length));
  });

  // Create header
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
  const separator = widths.map(w => '─'.repeat(w)).join('  ');

  // Create rows
  const rows = data.map(row => 
    row.map((cell, i) => String(cell || '').padEnd(widths[i])).join('  ')
  );

  return [
    chalk.bold(headerRow),
    chalk.gray(separator),
    ...rows
  ].join('\n');
}

module.exports = {
  formatTimestamp,
  formatSize,
  formatDuration,
  progressBar,
  formatStatus,
  formatTable
};