import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the dashboard
            await page.goto("http://localhost:3010/", wait_until="networkidle")

            # Wait for the project selector to be visible
            project_selector_input = page.get_by_placeholder("Base path for projects...")
            await expect(project_selector_input).to_be_visible(timeout=30000)

            # Take a screenshot of the initial state
            await page.screenshot(path="jules-scratch/verification/verification_initial.png")

            # Type in the base path.
            await project_selector_input.fill("/app")

            # Click the "Find Projects" button
            find_projects_button = page.get_by_role("button", name="Find Projects")
            await find_projects_button.click()

            # Wait for the project dropdown to appear
            project_dropdown = page.get_by_role("combobox")
            await expect(project_dropdown).to_be_visible(timeout=10000)

            # Click the dropdown to show the options
            await project_dropdown.click()
            await page.wait_for_timeout(500) # wait for animation

            # Take a screenshot of the new project selector UI with the dropdown open
            await page.screenshot(path="jules-scratch/verification/verification_final.png")

            print("Screenshots taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
            print("Error screenshot taken.")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())