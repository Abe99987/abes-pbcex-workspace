import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

/**
 * PBCEx Smart Contract Deployment Script
 * 
 * This script deploys the PBCEx vault-backed token system:
 * 1. ProofOfReserves contract for reserve verification
 * 2. ERC20VaultToken contracts for each metal type
 * 3. Initial configuration and role assignments
 * 
 * IMPORTANT: This is a Phase-3 stub implementation.
 * Requires thorough testing and security audit before mainnet deployment.
 */

async function main() {
  console.log("🚀 Starting PBCEx smart contract deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Contract deployment results
  const deploymentResults: Record<string, any> = {
    network: await deployer.getChainId(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  try {
    // 1. Deploy ProofOfReserves contract
    console.log("\n📜 Deploying ProofOfReserves contract...");
    const ProofOfReserves = await ethers.getContractFactory("ProofOfReserves");
    const proofOfReserves = await ProofOfReserves.deploy();
    await proofOfReserves.deployed();
    
    console.log("✅ ProofOfReserves deployed to:", proofOfReserves.address);
    deploymentResults.contracts.ProofOfReserves = {
      address: proofOfReserves.address,
      transactionHash: proofOfReserves.deployTransaction.hash,
    };

    // 2. Deploy ERC20VaultToken contracts for each metal
    const metals = [
      {
        name: "PBCEx Gold Vault Token",
        symbol: "XAUV",
        metalType: "GOLD",
        decimals: 18,
        maxSupply: ethers.utils.parseEther("10000000"), // 10M tokens
        initialVaultOunces: ethers.utils.parseEther("1000"), // 1000 oz initial
        vaultLocation: "VAULT-MAIN",
        custodian: "Brinks Global Services",
      },
      {
        name: "PBCEx Silver Vault Token",
        symbol: "XAGV", 
        metalType: "SILVER",
        decimals: 18,
        maxSupply: ethers.utils.parseEther("100000000"), // 100M tokens
        initialVaultOunces: ethers.utils.parseEther("50000"), // 50,000 oz initial
        vaultLocation: "VAULT-MAIN",
        custodian: "Brinks Global Services",
      },
      {
        name: "PBCEx Platinum Vault Token",
        symbol: "XPTV",
        metalType: "PLATINUM", 
        decimals: 18,
        maxSupply: ethers.utils.parseEther("1000000"), // 1M tokens
        initialVaultOunces: ethers.utils.parseEther("500"), // 500 oz initial
        vaultLocation: "VAULT-MAIN",
        custodian: "Brinks Global Services",
      }
    ];

    console.log("\n🪙 Deploying ERC20VaultToken contracts...");
    const ERC20VaultToken = await ethers.getContractFactory("ERC20VaultToken");

    for (const metal of metals) {
      console.log(`\n🔨 Deploying ${metal.name} (${metal.symbol})...`);
      
      const vaultToken = await ERC20VaultToken.deploy(
        metal.name,
        metal.symbol,
        metal.decimals,
        metal.maxSupply,
        metal.initialVaultOunces,
        metal.vaultLocation,
        metal.custodian
      );
      await vaultToken.deployed();
      
      console.log(`✅ ${metal.symbol} deployed to:`, vaultToken.address);
      
      // Link token to ProofOfReserves
      console.log(`🔗 Linking ${metal.symbol} to ProofOfReserves...`);
      const metalTypeIndex = metals.indexOf(metal); // 0=GOLD, 1=SILVER, 2=PLATINUM
      await proofOfReserves.linkTokenContract(metalTypeIndex, vaultToken.address);
      
      deploymentResults.contracts[metal.symbol] = {
        address: vaultToken.address,
        transactionHash: vaultToken.deployTransaction.hash,
        name: metal.name,
        symbol: metal.symbol,
        metalType: metal.metalType,
        maxSupply: metal.maxSupply.toString(),
        linkedToPoR: true,
      };
    }

    // 3. Set up initial roles and permissions
    console.log("\n🔐 Setting up roles and permissions...");
    
    // For production, these would be multi-sig wallets or DAO governance
    const BACKEND_SERVICE = deployer.address; // Stub - would be actual backend service wallet
    const COMPLIANCE_OFFICER = deployer.address; // Stub - would be compliance officer wallet
    const AUDITOR = deployer.address; // Stub - would be external auditor wallet

    // Grant roles to ProofOfReserves
    const AUDITOR_ROLE = await proofOfReserves.AUDITOR_ROLE();
    await proofOfReserves.grantRole(AUDITOR_ROLE, AUDITOR);
    console.log("✅ Granted AUDITOR_ROLE to:", AUDITOR);

    // Grant roles to each token contract
    for (const [symbol, contractInfo] of Object.entries(deploymentResults.contracts)) {
      if (symbol === 'ProofOfReserves') continue;
      
      console.log(`🔑 Setting up roles for ${symbol}...`);
      const tokenContract = await ethers.getContractAt("ERC20VaultToken", contractInfo.address);
      
      const MINTER_ROLE = await tokenContract.MINTER_ROLE();
      const BURNER_ROLE = await tokenContract.BURNER_ROLE();
      const COMPLIANCE_ROLE = await tokenContract.COMPLIANCE_ROLE();
      
      await tokenContract.grantRole(MINTER_ROLE, BACKEND_SERVICE);
      await tokenContract.grantRole(BURNER_ROLE, BACKEND_SERVICE);
      await tokenContract.grantRole(COMPLIANCE_ROLE, COMPLIANCE_OFFICER);
      
      console.log(`✅ Granted roles for ${symbol} to backend service and compliance officer`);
    }

    // 4. Save deployment results
    const deploymentPath = join(__dirname, "..", "deployments", `deployment-${deploymentResults.network}.json`);
    writeFileSync(deploymentPath, JSON.stringify(deploymentResults, null, 2));
    console.log(`\n📄 Deployment results saved to: ${deploymentPath}`);

    // 5. Verify contracts (if on testnet/mainnet)
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 1337 && network.chainId !== 31337) { // Skip localhost
      console.log("\n🔍 Contract verification recommended for non-local networks");
      console.log("Run: npx hardhat verify --network", network.name, "<contract-address>");
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- ProofOfReserves:", deploymentResults.contracts.ProofOfReserves.address);
    for (const [symbol, contractInfo] of Object.entries(deploymentResults.contracts)) {
      if (symbol !== 'ProofOfReserves') {
        console.log(`- ${symbol}:`, contractInfo.address);
      }
    }

    console.log("\n⚠️  IMPORTANT NEXT STEPS:");
    console.log("1. Transfer admin roles from deployer to multi-sig wallets");
    console.log("2. Set up Chainlink price feeds in ProofOfReserves");
    console.log("3. Configure backend service integration");
    console.log("4. Conduct security audit before mainnet deployment");
    console.log("5. Set up monitoring and emergency procedures");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment error:", error);
    process.exit(1);
  });
