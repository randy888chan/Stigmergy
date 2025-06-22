# Task: Design Smart Contract Architecture

**Objective:** To create a comprehensive architectural design for the smart contract system based on the project's Product Requirements Document (PRD) and technical specifications.

**Agent Role:** SmartContractArchitect

**Inputs:**
1.  Path to the PRD file.
2.  Path to any existing technical specification documents.
3.  User preferences regarding blockchain platform, specific design patterns, or constraints.

**Process:**
1.  **Understand Requirements:** Thoroughly analyze the PRD to identify all functional and non-functional requirements relevant to the on-chain logic. Pay close attention to user stories, data models, access control needs, and interactions.
2.  **Platform Considerations:** Confirm the target blockchain platform (e.g., Ethereum, Polygon, Solana). Note any platform-specific constraints or advantages.
3.  **Data Modeling:** Define the data structures that will be stored on-chain. Consider efficiency, cost, and security.
4.  **Contract Decomposition:** Decide if the system requires multiple smart contracts. If so, define the role and interface of each contract and how they will interact.
5.  **Function Signatures:** Specify the public and external functions for each contract, including parameters and return types.
6.  **Access Control:** Design the access control mechanisms (e.g., Ownable, Role-Based Access Control) for sensitive functions.
7.  **Upgradeability Strategy:** Determine if contract upgradeability is required. If so, select and outline an appropriate pattern (e.g., Proxy patterns like UUPS or Transparent Upgradeable Proxy).
8.  **Security Considerations:** Identify potential security risks at the architectural level and propose mitigation strategies (e.g., reentrancy guards, oracle usage patterns).
9.  **Event Design:** Define the events that contracts will emit for off-chain monitoring and integration.
10. **External Interactions:** Identify any required interactions with external contracts or oracles and define how these will be handled securely.
11. **Documentation:** Create the Smart Contract Architecture Document using the `smart-contract-architecture-doc-tmpl.md` template. This document should include diagrams (e.g., Mermaid sequence or component diagrams), detailed descriptions of each component, data structures, and justifications for key architectural decisions.

**Output:**
1.  A `SmartContractArchitecture.md` document (or similarly named, following project conventions).
2.  A list of any ambiguities in the PRD or areas requiring further clarification before development can proceed.

**Key Considerations:**
- Modularity and Reusability
- Security and Robustness
- Gas Efficiency (at a high level, detailed optimization is for development)
- Scalability and Maintainability
- Clarity for developers and auditors.```json
{
  "tool_code": "create_file_with_block\nexpansion-packs/bmad-smart-contract-dev/tasks/develop-solidity-contract.md\n# Task: Develop Solidity Smart Contract\n\n**Objective:** To write, compile, and perform basic unit testing for a Solidity smart contract based on its architectural design and detailed specifications.\n\n**Agent Role:** SmartContractDeveloper\n\n**Inputs:**\n1.  Path to the Smart Contract Architecture Document.\n2.  Path to the relevant section of the PRD or specific user stories detailing the contract's functionality.\n3.  Project's preferred Solidity version and development framework (e.g., Hardhat, Truffle, Foundry).\n4.  Path to any specific coding standards or style guides for Solidity.\n\n**Process:**\n1.  **Setup Development Environment:** Ensure the chosen development framework (e.g., Hardhat) is set up correctly.\n2.  **Understand Specifications:** Thoroughly review the architecture document and functional requirements for the specific contract to be developed.\n3.  **Write Solidity Code:** Implement the smart contract logic in Solidity, adhering to the architectural design, functional requirements, and coding standards.\n    *   Implement all data structures (structs, mappings, arrays).\n    *   Write all functions with correct visibility (public, external, internal, private).\n    *   Implement modifiers for access control or other checks if defined in the architecture.\n    *   Emit events as specified.\n4.  **Incorporate Security Best Practices:** Apply common Solidity security patterns (e.g., Checks-Effects-Interactions, reentrancy guards if applicable, safe math operations).\n5.  **Write Unit Tests:** For each public and external function, write unit tests to verify its behavior. Cover:\n    *   Happy path scenarios.\n    *   Edge cases.\n    *   Failure conditions (e.g., unauthorized access, invalid inputs).\n    *   Event emissions.\n6.  **Compile Contract:** Compile the Solidity code using the chosen framework. Resolve any compilation errors.\n7.  **Run Unit Tests:** Execute the unit tests. Ensure all tests pass. Debug and fix any failing tests.\n8.  **Gas Considerations:** While writing code, keep an eye on potential gas inefficiencies. Make reasonable efforts to write gas-conscious code, but defer heavy optimization if it sacrifices clarity or security at this stage.\n9.  **Documentation (Inline):** Add NatSpec comments to the Solidity code for all functions, state variables, and events, explaining their purpose, parameters, and return values.\n10. **Report Generation:** Prepare a brief report summarizing:\n    *   Path to the developed contract file(s).\n    *   Path to the test file(s).\n    *   Confirmation of successful compilation and test execution.\n    *   Any deviations from the specification or assumptions made.\n    *   Any identified areas that might need further security review or gas optimization later.\n\n**Output:**\n1.  The Solidity smart contract file(s) (e.g., `MyContract.sol`).\n2.  The unit test file(s) (e.g., `MyContract.test.js` or `MyContract.t.sol`).\n3.  A development report as described above.\n\n**Key Considerations:**\n- Adherence to the provided architecture and specifications.\n- Security best practices for Solidity.\n- Test coverage.\n- Code clarity and maintainability.",
  "tool_name": "create_file_with_block"
}
```
