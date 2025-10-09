import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the dashboard
        await page.goto("http://localhost:3010")

        # Wait for the header to be visible to ensure the page has loaded
        await expect(page.get_by_role("heading", name="Stigmergy")).to_be_visible()

        # Give a little extra time for all components to settle
        await page.wait_for_timeout(2000) # Increased timeout for stability

        # Take a screenshot of the dashboard
        screenshot_path = "jules-scratch/verification/dashboard_verification.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())