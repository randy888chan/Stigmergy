import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # 1. Navigate to the dashboard
            await page.goto("http://localhost:3010/", timeout=10000) # Increased timeout for server to start

            # 2. Wait for a key element of the new UI to be visible.
            # The "Code Browser" card is a good, stable indicator that the new UI has loaded.
            code_browser_card_title = page.get_by_role("heading", name="Code Browser")
            await expect(code_browser_card_title).to_be_visible(timeout=5000)

            # 3. Take a screenshot of the entire page.
            screenshot_path = "jules-scratch/verification/dashboard_verification.png"
            await page.screenshot(path=screenshot_path, full_page=True)

            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Take a screenshot even on failure for debugging.
            await page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())