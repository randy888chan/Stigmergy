import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the dashboard
        page.goto("http://localhost:3010", timeout=20000)

        # 2. Set the active project
        project_path = "/app"

        project_input = page.get_by_placeholder("Enter absolute path to project...")
        set_project_button = page.get_by_role("button", name="Set Active Project")

        expect(project_input).to_be_visible(timeout=10000)
        expect(set_project_button).to_be_visible()

        project_input.fill(project_path)
        set_project_button.click()

        # 3. Wait for confirmation using a robust locator
        user_info_container = page.locator("div.user-info")
        expect(user_info_container).to_contain_text(f"Active Project: {project_path}", timeout=10000)

        # 4. Verify the Code Browser is now visible and shows files
        code_browser_container = page.locator('.code-browser-container')
        expect(code_browser_container).to_be_visible()

        readme_file = code_browser_container.get_by_text("README.md")
        expect(readme_file).to_be_visible(timeout=10000)

        # 5. Take a screenshot for visual verification
        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Screenshot 'jules-scratch/verification/verification.png' taken successfully.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
        raise e

    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)