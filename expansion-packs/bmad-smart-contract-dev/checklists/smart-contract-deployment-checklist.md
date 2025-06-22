# Smart Contract Deployment Checklist

**Objective:** To ensure a safe, secure, and successful deployment of smart contracts to the target blockchain network.

**Agent Role:** DevOps Agent (extended) or `BlockchainDeployer`

---

## I. Pre-Deployment Preparations

- [ ] **Final Code Freeze:** Is the contract source code finalized and committed to version control?
- [ ] **Version Tagging:** Has the specific commit/version for deployment been tagged in Git?
- [ ] **Successful Compilation:** Has the contract been compiled successfully with the target Solidity version and optimizer settings?
- [ ] **Successful Test Suite Execution:** Have all unit and integration tests passed on a local development network or a recent testnet deployment?
- [ ] **Security Audit Completion:** Has a security audit been performed by `SmartContractAuditor` or a third party?
- [ ] **Audit Findings Addressed:** Have all critical and high-severity findings from the audit report been addressed and verified?
- [ ] **Stakeholder Sign-off:** Has relevant stakeholder (e.g., Product Owner, Lead Developer) sign-off been obtained for deployment?
- [ ] **Environment Configuration:**
    - [ ] Target Network Identified (e.g., Mainnet, Ropsten, Polygon, Mumbai).
    - [ ] RPC Endpoint URL for the target network is correct and accessible.
    - [ ] Gas Price Strategy Defined (e.g., use gas station API, fixed price, default).
- [ ] **Deployment Script Ready:** Is the deployment script (e.g., Hardhat/Truffle script, custom ethers.js/web3.js script) finalized and tested on a testnet?
- [ ] **Constructor Arguments:** Are all constructor arguments finalized, correctly formatted, and securely sourced?
- [ ] **Deployment Wallet (Deployer Account):**
    - [ ] Wallet address confirmed.
    - [ ] Sufficient native currency (ETH, MATIC, etc.) in the wallet to cover deployment gas costs (check current gas prices and estimated deployment cost).
    - [ ] Private key/mnemonic for the deployer account is securely accessible to the deployment environment (e.g., via environment variables, hardware wallet). **NEVER hardcode private keys.**
- [ ] **Third-Party Service Keys (if any):** API keys for services like Etherscan, Infura, Alchemy are configured if needed for verification or deployment.
- [ ] **Backup Plan:** Is there a plan in case of deployment failure (e.g., rollback steps, communication plan)?

---

## II. During Deployment

- [ ] **Secure Environment:** Is the deployment being performed from a secure machine and network?
- [ ] **Monitor Gas Prices:** Check current network gas prices before initiating deployment.
- [ ] **Execute Deployment Script:** Run the deployment script.
- [ ] **Monitor Transaction:** Monitor the deployment transaction on a block explorer. Note the transaction hash.
- [ ] **Wait for Confirmations:** Wait for a sufficient number of block confirmations as per network security standards.

---

## III. Post-Deployment Actions & Verifications

- [ ] **Obtain Contract Address:** Securely record the official deployed contract address(es).
- [ ] **Verify Contract on Block Explorer:**
    - [ ] Submit source code (flattened if necessary) or ABI to the relevant block explorer (e.g., Etherscan, PolygonScan).
    - [ ] Confirm successful verification.
- [ ] **Initial Sanity Checks:**
    - [ ] Perform a few simple read operations on the deployed contract to ensure it's responsive (e.g., read public state variables, call view/pure functions).
    - [ ] (If applicable and safe) Perform a simple state-changing transaction to confirm basic writability.
- [ ] **Update Documentation:** Update all relevant project documentation with the official contract address(es) and ABI.
- [ ] **Update Application Configuration:** Update frontend dApp, backend services, and any other off-chain components with the new contract address(es) and ABI.
- [ ] **Securely Store Artifacts:** Store the final ABI, bytecode, and contract address in a secure and version-controlled location.
- [ ] **Announce Deployment:** Notify relevant team members and stakeholders of the successful deployment and the official contract address(es).
- [ ] **Monitor Deployed Contract:** Implement or enable monitoring for the deployed contract (e.g., for critical events, errors, or unusual activity).

---

## IV. Communication & Handover

- [ ] **Deployment Report:** Has a deployment report been generated and shared, including:
    - Contract Name(s) and Address(es)
    - Network
    - Transaction Hash(es)
    - Link to Block Explorer page(s)
    - Any issues encountered and resolutions
- [ ] **Knowledge Transfer:** If applicable, ensure relevant team members understand how to interact with the newly deployed contract.

---

**Deployment Sign-off:**

- [ ] All checklist items have been addressed.
- [ ] The contract is confirmed to be live and operational on the target network.

**Date:**
**Deployer:**

---
