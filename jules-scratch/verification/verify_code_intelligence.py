import asyncio
import os  # Import the os module
from playwright.async_api import async_playwright, TimeoutError

# Read the target URL from an environment variable, with a default
TARGET_URL = os.environ.get('TARGET_URL', 'http://localhost:3010')

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        def log_console_message(msg):
            try:
                # In some environments, msg.type and msg.text are functions, in others, they are properties.
                # This code handles both cases.
                msg_type = msg.type() if callable(msg.type) else msg.type
                msg_text = msg.text() if callable(msg.text) else msg.text
                print(f"Browser Console: [{msg_type}] {msg_text}")
            except Exception as e:
                print(f"Error logging console message: {e}")

        page.on("console", log_console_message)

        try:
            print(f"Navigating to {TARGET_URL}...")
            # Use the configurable URL
            await page.goto(TARGET_URL, wait_until="networkidle", timeout=30000)

            print("Waiting for 'Code Intelligence' heading to be visible...")
            # The original test looked for this heading. I will keep this logic.
            await page.wait_for_selector("h3:has-text('Code Intelligence')", timeout=15000)
            print("Heading found.")

            print("Taking screenshot...")
            # Ensure the scratch directory exists
            os.makedirs("jules-scratch/verification", exist_ok=True)
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Verification successful. Screenshot is at {screenshot_path}")

        except TimeoutError as e:
            print(f"An error occurred: {e}")
            os.makedirs("jules-scratch/verification", exist_ok=True)
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
            print("Error screenshot saved to jules-scratch/verification/error_screenshot.png")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            os.makedirs("jules-scratch/verification", exist_ok=True)
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
            print("Error screenshot saved to jules-scratch/verification/error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())