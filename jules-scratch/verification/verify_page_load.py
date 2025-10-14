from playwright.sync_api import sync_playwright

def test_page_load():
    """
    This test simply loads the page and takes a screenshot.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1920, "height": 1080})

        page.goto("http://localhost:3010", timeout=60000)

        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    test_page_load()