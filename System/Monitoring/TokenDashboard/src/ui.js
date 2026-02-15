/**
 * CyCOS Token Dashboard - Terminal UI Module
 * Security-first implementation using only Node.js built-ins
 * No external dependencies
 */

// ANSI escape codes for terminal formatting
const ANSI = {
  // Colors
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',

  // Foreground colors
  FG_BLACK: '\x1b[30m',
  FG_RED: '\x1b[31m',
  FG_GREEN: '\x1b[32m',
  FG_YELLOW: '\x1b[33m',
  FG_BLUE: '\x1b[34m',
  FG_MAGENTA: '\x1b[35m',
  FG_CYAN: '\x1b[36m',
  FG_WHITE: '\x1b[37m',

  // Background colors
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',

  // Cursor control
  CLEAR_SCREEN: '\x1b[2J',
  CURSOR_HOME: '\x1b[H',
  HIDE_CURSOR: '\x1b[?25l',
  SHOW_CURSOR: '\x1b[?25h',
};

// Box-drawing characters
const BOX = {
  TOP_LEFT: '╔',
  TOP_RIGHT: '╗',
  BOTTOM_LEFT: '╚',
  BOTTOM_RIGHT: '╝',
  HORIZONTAL: '═',
  VERTICAL: '║',
  T_DOWN: '╦',
  T_UP: '╩',
  T_RIGHT: '╠',
  T_LEFT: '╣',
  CROSS: '╬',
};

/**
 * Terminal UI renderer
 */
class TerminalUI {
  constructor() {
    this.width = process.stdout.columns || 80;
    this.height = process.stdout.rows || 24;
  }

  /**
   * Clear screen and reset cursor
   */
  clear() {
    process.stdout.write(ANSI.CLEAR_SCREEN + ANSI.CURSOR_HOME);
  }

  /**
   * Hide cursor for cleaner display
   */
  hideCursor() {
    process.stdout.write(ANSI.HIDE_CURSOR);
  }

  /**
   * Show cursor
   */
  showCursor() {
    process.stdout.write(ANSI.SHOW_CURSOR);
  }

  /**
   * Draw a horizontal line
   */
  drawLine(char = BOX.HORIZONTAL, length = this.width - 2) {
    return char.repeat(length);
  }

  /**
   * Draw a box border
   */
  drawBox(title = '', width = 60) {
    const lines = [];

    // Top border
    if (title) {
      const titlePadding = Math.floor((width - title.length - 4) / 2);
      const topLine = BOX.TOP_LEFT +
        BOX.HORIZONTAL.repeat(titlePadding) +
        ` ${ANSI.BOLD}${title}${ANSI.RESET} ` +
        BOX.HORIZONTAL.repeat(width - titlePadding - title.length - 4) +
        BOX.TOP_RIGHT;
      lines.push(topLine);
    } else {
      lines.push(BOX.TOP_LEFT + this.drawLine(BOX.HORIZONTAL, width - 2) + BOX.TOP_RIGHT);
    }

    return lines.join('\n');
  }

  /**
   * Draw a progress bar
   */
  drawProgressBar(current, max, width = 20) {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;

    // Color based on percentage
    let color = ANSI.FG_GREEN;
    if (percentage > 80) color = ANSI.FG_RED;
    else if (percentage > 60) color = ANSI.FG_YELLOW;

    return color + '█'.repeat(filled) + ANSI.DIM + '░'.repeat(empty) + ANSI.RESET;
  }

  /**
   * Format a number with commas
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Format time remaining
   */
  formatTimeRemaining(timestamp) {
    const milliseconds = timestamp - Date.now();
    if (milliseconds < 0) return '0h 0m';

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  /**
   * Render model usage row
   */
  renderModelUsage(model, current, max, remaining) {
    const used = current;
    const quota = max;
    const percentage = quota > 0 ? ((used / quota) * 100).toFixed(1) : '0';
    const progressBar = this.drawProgressBar(used, quota, 10);

    const lines = [];
    lines.push(`${BOX.VERTICAL} ${ANSI.BOLD}${model}${ANSI.RESET}`.padEnd(63, ' ') + BOX.VERTICAL);
    lines.push(`${BOX.VERTICAL}   Remaining: ${ANSI.FG_GREEN}${this.formatNumber(remaining)}${ANSI.RESET} / Quota: ${this.formatNumber(quota)} units`.padEnd(95, ' ') + BOX.VERTICAL);
    lines.push(`${BOX.VERTICAL}   Progress: [${progressBar}]`.padEnd(50, ' ') + BOX.VERTICAL);

    return lines.join('\n');
  }

  /**
   * Render the complete dashboard
   */
  renderDashboard(data) {
    this.clear();
    this.hideCursor();

    const output = [];
    const boxWidth = 70;

    // Header with title
    const title = 'CyCOS Antigravity Token Dashboard';
    const titlePadding = Math.floor((boxWidth - title.length - 2) / 2);
    const topLine = BOX.TOP_LEFT +
      BOX.HORIZONTAL.repeat(titlePadding) +
      ' ' + ANSI.BOLD + title + ANSI.RESET + ' ' +
      BOX.HORIZONTAL.repeat(boxWidth - titlePadding - title.length - 2) +
      BOX.TOP_RIGHT;
    output.push(topLine);

    // Empty line after header
    output.push(BOX.VERTICAL + ' '.repeat(boxWidth - 2) + BOX.VERTICAL);

    // Model usage sections
    for (const model of data.models) {
      output.push(this.renderModelUsage(
        model.name,
        model.current || 0,
        model.limit || 0,
        model.remaining || 0
      ));
      output.push(BOX.VERTICAL + ' '.repeat(boxWidth - 2) + BOX.VERTICAL);
    }

    // Separator line
    output.push(BOX.T_RIGHT + BOX.HORIZONTAL.repeat(boxWidth - 2) + BOX.T_LEFT);

    // Footer with update time
    const updateLine = `${BOX.VERTICAL} Last Updated: ${new Date().toLocaleString()}`;
    output.push(updateLine.padEnd(boxWidth + 20, ' ') + BOX.VERTICAL);

    output.push(`${BOX.VERTICAL} Data Source: ${ANSI.DIM}${data.source}${ANSI.RESET}`.padEnd(boxWidth + 30, ' ') + BOX.VERTICAL);

    // Bottom border
    output.push(BOX.BOTTOM_LEFT + BOX.HORIZONTAL.repeat(boxWidth - 2) + BOX.BOTTOM_RIGHT);

    console.log(output.join('\n'));
  }
}

export default TerminalUI;
