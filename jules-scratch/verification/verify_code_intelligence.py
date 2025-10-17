import asyncio
from playwright.async_api import async_playwright, TimeoutError

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # The error "TypeError: 'str' object is not callable" strongly suggests
        # that .type and .text are properties, not methods, in this environment.
        def log_console_message(msg):
            try:
                print(f"Browser Console: [{msg.type}] {msg.text}")
            except Exception as e:
                print(f"Error logging console message: {e}")

        page.on("console", log_console_message)

        try:
            print("Navigating to http://localhost:3011...")
            await page.goto("http://localhost:3011", wait_until="networkidle", timeout=30000)

            print("Waiting for 'Code Intelligence' heading to be visible...")
            # The shadcn/ui CardTitle component renders as an h3
            await page.wait_for_selector("h3:has-text('Code Intelligence')", timeout=15000)
            print("Heading found.")

            print("Typing 'user auth logic' into the search input...")
            await page.fill("input[placeholder*='Semantic search']", "user auth logic")

            print("Clicking the search button...")
            await page.click("button:has-text('Search')")

            print("Waiting for search results...")
            # A search result item is a button containing a div with two spans.
            # The second span contains the source file path. This is a good, specific target.
            await page.wait_for_selector("button div > span.text-muted-foreground", timeout=10000)
            print("Search results are visible.")

            print("Taking screenshot...")
            screenshot_path = "code_intelligence_search.png"
            await page.screenshot(path=screenshot_path)
            print(f"Verification successful. Screenshot is at {screenshot_path}")

        except TimeoutError as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="error_screenshot.png")
            print("Error screenshot saved to error_screenshot.png")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            await page.screenshot(path="error_screenshot.png")
            print("Error screenshot saved to error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())