from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the dashboard
    page.goto("http://localhost:3010")

    # Wait for the main header to be visible to ensure the page is loaded
    expect(page.get_by_role("heading", name="Stigmergy")).to_be_visible(timeout=10000)

    # Take a screenshot of the redesigned dashboard
    page.screenshot(path="jules-scratch/verification/dashboard_redesign.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)