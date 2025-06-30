# Task: Audit Smart Contract

**Objective:** To perform a comprehensive security audit of a smart contract to identify vulnerabilities, potential exploits, and deviations from best practices.

**Agent Role:** SmartContractAuditor

**Inputs:**
1.  Path to the smart contract source code file(s) (Solidity).
2.  Path to the Smart Contract Architecture Document.
3.  Path to the PRD or functional specifications.
4.  Information about the target blockchain and Solidity compiler version used.
5.  (Optional) Path to existing test suites.

**Process:**
1.  **Understand Context:** Review the architecture document and PRD to understand the contract's intended functionality, business logic, and trust model.
2.  **Automated Analysis:**
    *   Run static analysis tools (e.g., Slither, Solhint) to identify potential issues and non-adherence to best practices.
    *   (If applicable) Run symbolic execution tools (e.g., Mythril) or fuzzers to explore execution paths.
3.  **Manual Code Review (Line-by-Line):**
    *   **Access Control:** Verify that all sensitive functions have appropriate access controls (e.g., `onlyOwner`, role-based). Check for vulnerabilities like unprotected functions or incorrect modifier usage.
    *   **Input Validation:** Ensure all external and public function inputs are properly validated to prevent unexpected behavior or exploits.
    *   **Reentrancy:** Analyze for potential reentrancy vulnerabilities, especially in functions involving external calls or token transfers. Ensure adherence to Checks-Effects-Interactions pattern.
    *   **Integer Overflow/Underflow:** Check all arithmetic operations for potential overflows or underflows, especially if not using SafeMath or a recent Solidity version (>=0.8.0).
    *   **Gas Issues:** Look for unbounded loops, potential denial-of-service vectors due to gas limits (e.g., array iteration for payouts), and overly complex operations.
    *   **Timestamp Dependence & Miner Manipulability:** Identify reliance on `block.timestamp`, `block.number`, or `block.gaslimit` for critical logic that could be manipulated by miners.
    *   **Transaction-Ordering Dependence (Front-Running):** Analyze if the contract is vulnerable to front-running attacks.
    *   **Logic Errors:** Scrutinize the contract logic to ensure it behaves as intended under all conditions and correctly implements the business requirements.
    *   **Oracle Issues:** If the contract uses oracles, check for secure integration and handling of oracle data.
    *   **Token Interaction:** If interacting with ERC20, ERC721, or other token standards, verify correct and safe interaction patterns (e.g., `safeApprove`, handling of non-standard tokens).
    *   **External Calls:** Ensure all external calls are handled safely, checking return values and considering potential failures or reentrancy.
    *   **Assembly Usage:** If `assembly` is used, review it with extreme care for potential memory safety issues or logic errors.
    *   **Known Vulnerabilities:** Check against lists of known smart contract vulnerabilities (e.g., SWC Registry).
4.  **Test Review (If available):** Review existing tests for coverage and effectiveness in identifying potential issues.
5.  **Report Compilation:**
    *   Document each finding with:
        *   A unique ID.
        *   Description of the vulnerability/issue.
        *   Location(s) in the code (contract name, line numbers).
        *   Severity (e.g., Critical, High, Medium, Low, Informational).
        *   Potential impact if exploited.
        *   Recommended remediation steps.
    *   Provide an overall summary of the contract's security posture.
    *   List any positive security practices observed.

**Output:**
1.  A comprehensive Smart Contract Audit Report in Markdown format, detailing all findings, severity levels, and recommendations.
2.  (Optional) A list of suggested new test cases to cover identified vulnerabilities or edge cases.

**Key Considerations:**
- The audit should be performed with an adversarial mindset.
- Clarity and actionability of the audit report are paramount.
- Prioritize findings based on severity and exploitability.