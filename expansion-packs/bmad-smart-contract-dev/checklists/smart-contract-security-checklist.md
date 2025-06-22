# Smart Contract Security Checklist

**Objective:** To ensure comprehensive security verification of smart contracts before deployment. This checklist should be used by `SmartContractAuditor` and also by `SmartContractDeveloper` as a self-check.

---

## I. Pre-Audit / Pre-Development Checks

- [ ] **Requirements Clarity:** Are all business logic and security requirements clearly defined and understood?
- [ ] **Architecture Review:** Has the smart contract architecture been reviewed for security implications?
- [ ] **Known Vulnerabilities List:** Is the development/audit team aware of the latest common vulnerabilities (e.g., SWC Registry, DeFi exploits)?
- [ ] **Tooling Setup:** Are static analysis tools (Slither, Solhint), linters, and testing frameworks (Hardhat, Truffle, Foundry) correctly configured?

---

## II. Access Control

- [ ] **Default Visibility:** Are functions correctly marked `public`, `external`, `internal`, or `private`? Avoid default public visibility where not intended.
- [ ] **Protected Functions:** Are all functions that modify critical state variables or execute sensitive operations protected by appropriate access control mechanisms (e.g., `onlyOwner`, role-based access control)?
- [ ] **Modifier Correctness:** Are modifiers used correctly and without unintended side effects?
- [ ] **Constructor Security:** Is the constructor `internal` or `public` as intended? Is it properly secured if it sets critical initial values?
- [ ] **Authorization Logic:** Is authorization logic sound and not easily bypassable? (e.g., check for `tx.origin` abuse).
- [ ] **Privileged Role Management:** Is the process for granting/revoking privileged roles secure?

---

## III. Input Validation & Sanitization

- [ ] **Parameter Validation:** Are all inputs to `public` and `external` functions validated (e.g., non-zero addresses, sane numerical ranges, length checks for arrays/strings)?
- [ ] **Zero Address Checks:** Are address parameters checked against `address(0)` where appropriate?
- [ ] **Array/String Bounds:** Are operations on arrays and strings safe from out-of-bounds errors?
- [ ] **Integer Overflow/Underflow (Solidity <0.8.0):** Are all arithmetic operations protected against overflow/underflow (e.g., using SafeMath or similar libraries)? (Less critical for Solidity >=0.8.0 due to built-in checks, but still good to be mindful of).
- [ ] **Divide by Zero:** Is division by zero prevented?

---

## IV. Reentrancy & External Calls

- [ ] **Checks-Effects-Interactions Pattern:** Is this pattern strictly followed for all state changes and external calls?
- [ ] **Reentrancy Guards:** Are reentrancy guards (e.g., OpenZeppelin's `ReentrancyGuard`) used where necessary, especially in functions making external calls after state changes?
- [ ] **External Call Return Values:** Are return values of low-level calls (`.call()`, `.delegatecall()`, `.staticcall()`) checked?
- [ ] **Gas Griefing via External Calls:** Can an external call fail due to out-of-gas, and can this be exploited to block contract functionality?
- [ ] **Trusted External Contracts:** Are external contracts called assumed to be potentially malicious? Is interaction minimized?

---

## V. Gas & Denial of Service

- [ ] **Unbounded Loops:** Are there any loops that could iterate an unbounded number of times, potentially leading to out-of-gas errors (e.g., iterating over a user-growable array)?
- [ ] **Block Gas Limit:** Can any single transaction consume close to the block gas limit, making it difficult to include?
- [ ] **Gas-Heavy Operations:** Are there any unexpectedly gas-heavy operations that could be optimized?
- [ ] **Unexpected Reverts:** Can users be forced into states where their actions always revert, effectively DoS'ing them?

---

## VI. Timestamp & Miner Manipulability

- [ ] **`block.timestamp` Reliance:** Is `block.timestamp` used for critical logic (e.g., unlocking funds, determining winners)? Is the tolerance for manipulation understood?
- [ ] **`block.number` Reliance:** Is `block.number` used where `block.timestamp` might be more appropriate or vice-versa?
- [ ] **Oracle Usage:** If external data is needed, is a secure oracle pattern used instead of relying on miner-controllable values?

---

## VII. Transaction-Ordering Dependence (Front-Running / Back-Running)

- [ ] **Sensitive Operations:** Are there operations (e.g., market orders, revealing secrets) vulnerable to front-running?
- [ ] **Mitigation Strategies:** If vulnerable, are mitigation strategies in place (e.g., commit-reveal schemes, batching)?

---

## VIII. Logic Errors & Business Logic Flaws

- [ ] **Correct Implementation:** Does the code correctly implement the intended business logic as per specifications?
- [ ] **Edge Cases:** Have all relevant edge cases and boundary conditions been considered and tested?
- [ ] **State Transitions:** Are all state transitions handled correctly and securely?
- [ ] **Event Emission:** Are events emitted correctly for all significant state changes and actions, providing necessary information for off-chain monitoring?
- [ ] **Initialization:** Are all state variables initialized correctly in the constructor or via initializer functions (for proxies)?

---

## IX. Token Interactions (ERC20, ERC721, etc.)

- [ ] **`approve()` Race Condition:** If using `approve()`, is the user interface or contract logic aware of the potential ERC20 approve race condition? (Consider `safeIncreaseAllowance`/`safeDecreaseAllowance`).
- [ ] **Non-Standard Tokens:** Does the contract safely handle tokens that may not strictly adhere to ERC standards (e.g., tokens without return values on `transfer`/`transferFrom`)? Use OpenZeppelin's `SafeERC20` where appropriate.
- [ ] **`transferFrom()` Returns:** Is the return value of `transferFrom()` checked?
- [ ] **Correct Token Amounts:** Are token amounts handled correctly, considering decimals?

---

## X. Cryptography & Signatures

- [ ] **`ecrecover` Usage:** If `ecrecover` is used for signature verification, is it protected against signature malleability? (Hash message with `keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash))`).
- [ ] **Replay Attacks:** Are mechanisms in place (e.g., nonces) to prevent replay attacks on signed messages?
- [ ] **Private Key Exposure:** Is there any risk of private key or sensitive seed phrase exposure in the contract logic or deployment process? (Should never be on-chain).

---

## XI. Testing & Verification

- [ ] **Test Coverage:** Is there high unit test coverage for all contract functions and modifiers?
- [ ] **Scenario Testing:** Are complex interaction scenarios and potential attack vectors tested?
- [ ] **Formal Verification:** Has formal verification been considered or applied for critical contracts? (Advanced)
- [ ] **Code Linting:** Does the code pass linters (e.g., Solhint) with no major warnings?

---

## XII. General Best Practices & Housekeeping

- [ ] **Solidity Version:** Is a recent, stable version of the Solidity compiler used? Is pragma versioning appropriate (e.g., `^0.8.x`)?
- [ ] **Compiler Optimizations:** Are compiler optimizations understood and enabled appropriately for deployment?
- [ ] **Code Readability & Comments:** Is the code well-formatted, readable, and adequately commented (NatSpec for all public/external functions and state variables)?
- [ ] **Dependency Management:** Are external library dependencies (e.g., OpenZeppelin contracts) up-to-date and from trusted sources?
- [ ] **No Unused Code/Variables:** Has dead or unreachable code been removed?
- [ ] **Error Messages:** Are revert messages clear and informative?

---

**Auditor/Developer Sign-off:**

- [ ] All critical/high severity issues identified have been addressed or have a clear remediation plan.
- [ ] The contract's risk profile is understood and accepted by stakeholders.

**Date:**
**Auditor/Developer:**

---
