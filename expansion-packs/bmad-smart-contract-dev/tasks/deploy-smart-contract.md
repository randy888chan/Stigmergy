# Task: Deploy Smart Contract

**Objective:** To compile, test, and deploy a smart contract to a specified blockchain network (testnet or mainnet).

**Agent Role:** DevOps Agent (extended) or a new `BlockchainDeployer` Agent

**Inputs:**
1.  Path to the final smart contract source code file(s).
2.  Path to the compiled contract artifacts (ABI, bytecode), if pre-compiled.
3.  Target blockchain network (e.g., "ropsten", "mainnet", "polygon", "mumbai").
4.  Deployment parameters (e.g., constructor arguments for the contract).
5.  Private key or mnemonic for the deploying account (securely handled, ideally via environment variables or a secure wallet mechanism, not directly in prompts).
6.  RPC endpoint URL for the target network (e.g., from Infura, Alchemy, or a local node).
7.  (Optional) Gas price strategy (e.g., "fast", "standard", or a specific gas price).
8.  Path to the `smart-contract-deployment-checklist.md`.

**Process:**
1.  **Pre-Deployment Checks (Run `smart-contract-deployment-checklist.md`):**
    *   Verify final code version.
    *   Confirm audit completion and sign-off (if applicable).
    *   Ensure all constructor arguments are correct and available.
    *   Confirm target network and RPC endpoint.
    *   Verify deployer account has sufficient funds for gas.
2.  **Setup Deployment Environment:**
    *   Ensure necessary tools are installed (e.g., Hardhat, Truffle, ethers.js/web3.js if using a script).
    *   Configure the deployment script or tool with the target network, deployer account, and RPC endpoint.
3.  **Compile Contract (If not already done or to ensure latest):**
    *   Compile the smart contract using the chosen framework (e.g., `npx hardhat compile`). Ensure there are no compilation errors.
4.  **Final Test Run (Optional but Recommended):**
    *   Execute the full test suite against a local development network or the target testnet to catch any last-minute issues.
5.  **Estimate Gas (If possible):**
    *   Use framework tools to estimate the gas required for deployment.
6.  **Execute Deployment:**
    *   Run the deployment script or command.
    *   Monitor the transaction progress.
    *   Wait for the transaction to be mined and for sufficient confirmations (if applicable).
7.  **Verify Deployment (Post-Deployment Checks from Checklist):**
    *   Once deployed, retrieve the contract address.
    *   Verify the contract code on a block explorer (e.g., Etherscan, Polygonscan) if the network supports it. This often requires submitting the source code or ABI.
    *   (Optional) Perform a few basic interactions with the deployed contract on the target network to ensure it's responsive and functioning as expected (e.g., reading a public variable).
8.  **Record Deployment Information:**
    *   Log the deployed contract address.
    *   Log the transaction hash of the deployment.
    *   Log the network it was deployed to.
    *   Save the ABI and contract address for use by off-chain services and dApp frontends.
9.  **Report Generation:**
    *   Prepare a deployment report summarizing the outcome:
        *   Success or failure.
        *   Target network.
        *   Deployed contract address(es).
        *   Transaction hash(es).
        *   Link to the contract on a block explorer (if verified).
        *   Any issues encountered during deployment.

**Output:**
1.  Deployment report.
2.  A file or record containing the deployed contract address and ABI.
3.  Confirmation of checklist completion.

**Key Considerations:**
- **Security of Private Keys:** This is paramount. The agent should not handle raw private keys directly in prompts. It should assume keys are managed securely via environment variables loaded by the deployment script or a hardware wallet.
- **Network Differences:** Be aware of differences between testnets and mainnet (gas costs, block times, available tools).
- **Idempotency:** Deployment scripts should ideally be idempotent or handle cases where a contract might already be deployed.
- **Error Handling:** Robust error handling in deployment scripts is crucial.
