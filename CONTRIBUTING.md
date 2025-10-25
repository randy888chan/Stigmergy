# Contributing to Stigmergy

First off, thank you for considering contributing to Stigmergy! It's people like you that make Stigmergy such a great tool.

We welcome contributions from everyone. Here are some ways you can contribute:

- Reporting bugs
- Suggesting enhancements
- Improving documentation
- Submitting pull requests

## How to Report Bugs

If you find a bug, please open an issue on our [GitHub issue tracker](https://github.com/stiggmergy/stigmergy-engine/issues).

When you report a bug, please include:

- A clear and descriptive title.
- A detailed description of the problem, including steps to reproduce it.
- Information about your environment (e.g., operating system, Node.js version).

## How to Suggest Enhancements

If you have an idea for a new feature or an improvement to an existing one, please open an issue on our [GitHub issue tracker](https://github.com/stiggmergy/stigmergy-engine/issues).

Please provide a clear and detailed explanation of the enhancement you're suggesting and why you think it would be a valuable addition to Stigmergy.

## Pull Request Process

We welcome pull requests! If you'd like to contribute code, please follow these steps:

1.  **Fork the repository** and create a new branch from `main`.
2.  **Set up your development environment:**
    ```bash
    # Make sure you have Bun installed (https://bun.sh/)
    bun install
    # To run the development server (with hot-reloading)
    docker-compose up stigmergy-dev
    ```
3.  **Make your changes.** Please ensure your code follows the existing style and that you add or update tests as appropriate.
4. **Run the test suite** to make sure everything is still working correctly. For local development, run the fast unit tests:
```bash
bun run test:local
```
The full test suite will be run automatically by our CI pipeline when you submit a pull request.
5.  **Submit a pull request** to the `main` branch of the main Stigmergy repository. Please provide a clear description of the changes you've made.

Thank you for your contributions!
