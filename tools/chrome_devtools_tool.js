import { launch, connect } from 'chrome-devtools-mcp';

let browser;
let page;

/**
 * Launches a new browser instance or connects to an existing one.
 * This should be called before any other DevTools operations.
 */
export async function launchBrowser() {
  if (!browser) {
    browser = await launch();
  }
  return { status: 'success', message: 'Browser is running.' };
}

/**
 * Opens a new page and navigates to a URL.
 * @param {object} args
 * @param {string} args.url - The URL to navigate to.
 */
export async function navigateTo({ url }) {
  if (!browser) await launchBrowser();
  page = await browser.newPage();
  await page.goto(url);
  return { status: 'success', message: `Navigated to ${url}` };
}

/**
 * A unified tool that wraps all 26 available DevTools commands.
 * Agents will call this single tool with the desired command and arguments.
 * @param {object} args
 * @param {string} args.command - The DevTools command to execute (e.g., 'Page.captureScreenshot', 'DOM.getDocument').
 * @param {object} args.params - The parameters for the command.
 */
export async function sendCommand({ command, params = {} }) {
  if (!page) {
    throw new Error('No page is currently open. You must call "navigateTo" first.');
  }
  try {
    const result = await page.send(command, params);
    return { status: 'success', result };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Closes the browser instance.
 */
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
  return { status: 'success', message: 'Browser closed.' };
}