from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the dashboard
        page.goto("http://localhost:3010")
        page.wait_for_load_state('networkidle')

        # 2. Verify the new "Set Project Path" UI is present
        project_input = page.get_by_placeholder("Enter project path...")
        expect(project_input).to_be_visible()

        set_project_button = page.get_by_role("button", name="Set Project")
        expect(set_project_button).to_be_visible()

        # 3. Verify the Terminal component is gone
        # We look for a heading that would have identified the terminal card.
        terminal_heading = page.get_by_role("heading", name="Terminal")
        expect(terminal_heading).not_to_be_visible()

        # 4. Verify the Code Browser is present but shows "Select a file"
        code_browser_heading = page.get_by_role("heading", name="Code Browser")
        expect(code_browser_heading).to_be_visible()
        expect(page.get_by_text("Select a file to view its content")).to_be_visible()

        # 5. Take a screenshot for visual confirmation
        screenshot_path = "jules-scratch/verification/dashboard_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        # 6. Clean up
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)