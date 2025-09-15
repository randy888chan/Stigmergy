import chalk from "chalk";

/**
 * Utility class for consistent CLI output formatting
 */
export class OutputFormatter {
  /**
   * Display a section header
   * @param {string} title - Section title
   */
  static section(title) {
    console.log(chalk.blue.bold(`\n${title}`));
    console.log(chalk.blue("─".repeat(title.length)));
  }

  /**
   * Display a success message
   * @param {string} message - Success message
   */
  static success(message) {
    console.log(chalk.green(`✅ ${message}`));
  }

  /**
   * Display a warning message
   * @param {string} message - Warning message
   */
  static warning(message) {
    console.log(chalk.yellow(`⚠️ ${message}`));
  }

  /**
   * Display an error message
   * @param {string} message - Error message
   */
  static error(message) {
    console.log(chalk.red(`❌ ${message}`));
  }

  /**
   * Display an informational message
   * @param {string} message - Info message
   */
  static info(message) {
    console.log(chalk.cyan(`ℹ️ ${message}`));
  }

  /**
   * Display a progress step
   * @param {string} message - Progress message
   */
  static step(message) {
    console.log(chalk.gray(`→ ${message}`));
  }

  /**
   * Display a key-value pair
   * @param {string} key - Key
   * @param {string} value - Value
   */
  static keyValue(key, value) {
    console.log(chalk.gray(`${key}:`) + ` ${value}`);
  }

  /**
   * Display a list of items
   * @param {string[]} items - List items
   * @param {string} title - Optional title for the list
   */
  static list(items, title = null) {
    if (title) {
      this.section(title);
    }
    items.forEach(item => {
      console.log(chalk.gray("•") + ` ${item}`);
    });
  }

  /**
   * Display a table-like structure
   * @param {Array<Object>} data - Array of objects with consistent keys
   * @param {string[]} columns - Column keys to display
   * @param {Object} headers - Optional column headers mapping
   */
  static table(data, columns, headers = {}) {
    if (data.length === 0) {
      console.log(chalk.gray("No data to display"));
      return;
    }

    // Calculate column widths
    const widths = {};
    columns.forEach(col => {
      const header = headers[col] || col;
      widths[col] = Math.max(
        header.length,
        ...data.map(row => String(row[col] || "").length)
      );
    });

    // Print header
    let headerRow = "";
    columns.forEach(col => {
      const header = headers[col] || col;
      headerRow += header.padEnd(widths[col] + 2);
    });
    console.log(chalk.bold(headerRow));
    console.log(chalk.gray("─".repeat(headerRow.length)));

    // Print rows
    data.forEach(row => {
      let rowStr = "";
      columns.forEach(col => {
        rowStr += String(row[col] || "").padEnd(widths[col] + 2);
      });
      console.log(rowStr);
    });
  }

  /**
   * Display a summary box
   * @param {Object} items - Key-value pairs to display
   * @param {string} title - Optional title
   */
  static summary(items, title = null) {
    if (title) {
      this.section(title);
    }
    
    const entries = Object.entries(items);
    const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
    
    entries.forEach(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength);
      console.log(chalk.gray(`${paddedKey}:`) + ` ${value}`);
    });
  }
}