
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3011")

        # Inject the event directly into the window object
        page.evaluate("""
            () => {
                const event = {
                    type: 'human_approval_request',
                    payload: {
                        requestId: 'test-request-id',
                        message: 'Please approve this important action.',
                        data: {
                            action: 'deploy',
                            environment: 'production'
                        }
                    }
                };
                const eventData = { data: JSON.stringify(event) };
                window.dispatchEvent(new MessageEvent('message', eventData));
            }
        """)

        # Wait for the dialog to appear
        dialog = page.locator('div[role="dialog"]')
        expect(dialog).to_be_visible(timeout=5000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
