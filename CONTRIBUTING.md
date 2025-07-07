# Contributing to Stigmergy

Thank you for your interest in contributing to the Stigmergy project!

## Development Workflow

This project uses `npm link` to enable local development and testing against other projects on your machine.

### Setting up the Local Link

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/randy888chan/Stigmergy.git
    cd Stigmergy
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Create the Global Symlink:**
    From the root of the `Stigmergy` directory, run:
    ```bash
    npm link
    ```
    This creates a global symlink from `@randy888chan/stigmergy` to your local source code.

### Using the Local Version in Another Project

1.  **Navigate to Your Test Project:**
    ```bash
    cd /path/to/your/test-project
    ```

2.  **Link the Package:**
    Run the following command to make your test project use your local version of Stigmergy instead of the published one:
    ```bash
    npm link @randy888chan/stigmergy
    ```

3.  **Run Stigmergy:**
    You can now use the `stigmergy` command within your test project, and any changes you make in the Stigmergy source code will be reflected immediately.
    ```bash
    npx stigmergy install
    ```

## Publishing a New Version

This project uses `semantic-release` to automate versioning and publishing based on Conventional Commits. New versions are published automatically via the GitHub Actions workflow defined in `.github/workflows/release.yml` when commits are pushed to the `main` branch.
