const chalk = require('chalk');

/**
 * Simple progress bar for CLI
 */
class ProgressBar {
  constructor(total, options = {}) {
    this.total = total;
    this.current = 0;
    this.width = options.width || 40;
    this.complete = options.complete || '█';
    this.incomplete = options.incomplete || '░';
    this.renderThrottle = options.renderThrottle || 16;
    this.lastRender = 0;
    this.startTime = null;
    this.lastMessage = '';
    this.isComplete = false;
  }

  start() {
    this.startTime = Date.now();
    this.render();
  }

  update(current, message = '') {
    this.current = Math.min(current, this.total);
    this.lastMessage = message;
    
    const now = Date.now();
    if (now - this.lastRender >= this.renderThrottle) {
      this.render();
      this.lastRender = now;
    }
  }

  increment(message = '') {
    this.update(this.current + 1, message);
  }

  render() {
    if (this.isComplete) return;

    const percent = this.current / this.total;
    const filledLength = Math.round(this.width * percent);
    const emptyLength = this.width - filledLength;

    const filled = chalk.green(this.complete.repeat(filledLength));
    const empty = chalk.gray(this.incomplete.repeat(emptyLength));
    const percentage = Math.round(percent * 100);

    const elapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const rate = this.current / elapsed;
    const eta = this.current === 0 ? 0 : (this.total - this.current) / rate;

    let line = `  [${filled}${empty}] ${percentage}% | ${this.current}/${this.total}`;
    
    if (elapsed > 1) {
      line += ` | ${this.formatTime(elapsed)} elapsed`;
      if (this.current < this.total && eta > 0) {
        line += ` | ~${this.formatTime(eta)} remaining`;
      }
    }

    if (this.lastMessage) {
      line += ` | ${chalk.dim(this.truncateMessage(this.lastMessage))}`;
    }

    // Clear line and write progress
    process.stdout.write('\r' + line + ' '.repeat(Math.max(0, process.stdout.columns - line.length - 10)));
  }

  complete() {
    this.isComplete = true;
    this.current = this.total;
    this.render();
    process.stdout.write('\n');
  }

  formatTime(seconds) {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${minutes}m${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h${minutes}m`;
    }
  }

  truncateMessage(message, maxLength = 30) {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }
}

module.exports = ProgressBar;