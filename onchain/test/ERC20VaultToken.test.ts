import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20VaultToken, ProofOfReserves } from "../typechain-types";

/**
 * ERC20VaultToken Contract Tests
 * 
 * IMPORTANT: This is a Phase-3 stub implementation.
 * Comprehensive test suite required before production deployment.
 */

describe("ERC20VaultToken", function () {
  let vaultToken: ERC20VaultToken;
  let proofOfReserves: ProofOfReserves;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let backendService: SignerWithAddress;
  let auditor: SignerWithAddress;

  const TOKEN_NAME = "PBCEx Gold Vault Token";
  const TOKEN_SYMBOL = "XAUV";
  const TOKEN_DECIMALS = 18;
  const MAX_SUPPLY = ethers.utils.parseEther("10000000"); // 10M tokens
  const INITIAL_VAULT_OUNCES = ethers.utils.parseEther("1000"); // 1000 oz
  const VAULT_LOCATION = "VAULT-MAIN";
  const CUSTODIAN = "Brinks Global Services";

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, backendService, auditor] = await ethers.getSigners();

    // Deploy ProofOfReserves
    const ProofOfReservesFactory = await ethers.getContractFactory("ProofOfReserves");
    proofOfReserves = await ProofOfReservesFactory.deploy();
    await proofOfReserves.deployed();

    // Deploy ERC20VaultToken
    const ERC20VaultTokenFactory = await ethers.getContractFactory("ERC20VaultToken");
    vaultToken = await ERC20VaultTokenFactory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_DECIMALS,
      MAX_SUPPLY,
      INITIAL_VAULT_OUNCES,
      VAULT_LOCATION,
      CUSTODIAN
    );
    await vaultToken.deployed();

    // Set up roles
    const MINTER_ROLE = await vaultToken.MINTER_ROLE();
    const BURNER_ROLE = await vaultToken.BURNER_ROLE();
    const AUDITOR_ROLE = await proofOfReserves.AUDITOR_ROLE();

    await vaultToken.grantRole(MINTER_ROLE, backendService.address);
    await vaultToken.grantRole(BURNER_ROLE, backendService.address);
    await proofOfReserves.grantRole(AUDITOR_ROLE, auditor.address);
  });

  describe("Deployment", function () {
    it("Should set the correct token details", async function () {
      expect(await vaultToken.name()).to.equal(TOKEN_NAME);
      expect(await vaultToken.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await vaultToken.decimals()).to.equal(TOKEN_DECIMALS);
      expect(await vaultToken.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("Should initialize vault backing correctly", async function () {
      const backing = await vaultToken.vaultBacking();
      expect(backing.totalPhysicalOunces).to.equal(INITIAL_VAULT_OUNCES);
      expect(backing.vaultLocation).to.equal(VAULT_LOCATION);
      expect(backing.custodian).to.equal(CUSTODIAN);
    });

    it("Should grant correct roles to owner", async function () {
      const DEFAULT_ADMIN_ROLE = await vaultToken.DEFAULT_ADMIN_ROLE();
      expect(await vaultToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow authorized minter to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("100");
      const physicalOunces = ethers.utils.parseEther("1");

      await expect(
        vaultToken.connect(backendService).mintBacked(user1.address, mintAmount, physicalOunces)
      )
        .to.emit(vaultToken, "TokensMinted")
        .withArgs(user1.address, mintAmount, physicalOunces);

      expect(await vaultToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await vaultToken.totalSupply()).to.equal(mintAmount);

      const backing = await vaultToken.vaultBacking();
      expect(backing.totalPhysicalOunces).to.equal(INITIAL_VAULT_OUNCES.add(physicalOunces));
    });

    it("Should reject minting from unauthorized account", async function () {
      const mintAmount = ethers.utils.parseEther("100");
      const physicalOunces = ethers.utils.parseEther("1");

      await expect(
        vaultToken.connect(user1).mintBacked(user1.address, mintAmount, physicalOunces)
      ).to.be.revertedWith("AccessControl:");
    });

    it("Should reject minting above max supply", async function () {
      const mintAmount = MAX_SUPPLY.add(1);
      const physicalOunces = ethers.utils.parseEther("1000000");

      await expect(
        vaultToken.connect(backendService).mintBacked(user1.address, mintAmount, physicalOunces)
      ).to.be.revertedWith("ERC20VaultToken: exceeds max supply");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Mint some tokens first
      const mintAmount = ethers.utils.parseEther("100");
      const physicalOunces = ethers.utils.parseEther("1");
      await vaultToken.connect(backendService).mintBacked(user1.address, mintAmount, physicalOunces);
    });

    it("Should allow authorized burner to burn tokens", async function () {
      const burnAmount = ethers.utils.parseEther("50");
      const physicalOunces = ethers.utils.parseEther("0.5");

      const initialBacking = await vaultToken.vaultBacking();
      
      await expect(
        vaultToken.connect(backendService).burnBacked(user1.address, burnAmount, physicalOunces)
      )
        .to.emit(vaultToken, "TokensBurned")
        .withArgs(user1.address, burnAmount, physicalOunces);

      expect(await vaultToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("50"));

      const newBacking = await vaultToken.vaultBacking();
      expect(newBacking.totalPhysicalOunces).to.equal(initialBacking.totalPhysicalOunces.sub(physicalOunces));
    });

    it("Should reject burning from unauthorized account", async function () {
      const burnAmount = ethers.utils.parseEther("50");
      const physicalOunces = ethers.utils.parseEther("0.5");

      await expect(
        vaultToken.connect(user1).burnBacked(user1.address, burnAmount, physicalOunces)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("Compliance Features", function () {
    beforeEach(async function () {
      // Mint tokens to user1
      const mintAmount = ethers.utils.parseEther("1000");
      const physicalOunces = ethers.utils.parseEther("10");
      await vaultToken.connect(backendService).mintBacked(user1.address, mintAmount, physicalOunces);
    });

    it("Should allow compliance officer to blacklist addresses", async function () {
      const COMPLIANCE_ROLE = await vaultToken.COMPLIANCE_ROLE();
      await vaultToken.grantRole(COMPLIANCE_ROLE, owner.address);

      await expect(
        vaultToken.setBlacklisted(user1.address, true, "Suspicious activity")
      )
        .to.emit(vaultToken, "ComplianceAction")
        .withArgs(user1.address, "BLACKLISTED", "Suspicious activity");

      expect(await vaultToken.isBlacklisted(user1.address)).to.be.true;
    });

    it("Should prevent transfers from blacklisted addresses", async function () {
      const COMPLIANCE_ROLE = await vaultToken.COMPLIANCE_ROLE();
      await vaultToken.grantRole(COMPLIANCE_ROLE, owner.address);
      
      await vaultToken.setBlacklisted(user1.address, true, "Test");

      await expect(
        vaultToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("ERC20VaultToken: sender is blacklisted");
    });

    it("Should enforce daily transfer limits", async function () {
      const transferAmount = ethers.utils.parseEther("2000"); // Above default limit
      
      await expect(
        vaultToken.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("ERC20VaultToken: exceeds daily transfer limit");
    });
  });

  describe("Backing Ratio", function () {
    it("Should return 100% backing ratio with no tokens", async function () {
      const ratio = await vaultToken.getBackingRatio();
      expect(ratio).to.equal(10000); // 10000 basis points = 100%
    });

    it("Should calculate correct backing ratio with tokens", async function () {
      // Mint 1000 tokens backed by 10 physical ounces
      const mintAmount = ethers.utils.parseEther("1000");
      const physicalOunces = ethers.utils.parseEther("10");
      
      await vaultToken.connect(backendService).mintBacked(user1.address, mintAmount, physicalOunces);
      
      // Total physical: 1000 (initial) + 10 (minted) = 1010 ounces
      // Total tokens: 1000
      // Ratio should be (1010 * 10000) / 1000 = 10100 basis points = 101%
      
      const ratio = await vaultToken.getBackingRatio();
      expect(ratio).to.equal(10100);
    });
  });

  describe("ProofOfReserves Integration", function () {
    it("Should link token contract to ProofOfReserves", async function () {
      await expect(
        proofOfReserves.linkTokenContract(0, vaultToken.address) // 0 = GOLD
      )
        .to.emit(proofOfReserves, "TokenContractLinked")
        .withArgs(0, vaultToken.address);

      expect(await proofOfReserves.tokenContracts(0)).to.equal(vaultToken.address);
    });

    it("Should allow auditor to submit reserve updates", async function () {
      const physicalOunces = ethers.utils.parseEther("2000");
      const merkleRoot = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
      const auditHash = "QmTest123...";

      // This would normally be time-locked, but for testing we'll just verify the call doesn't revert
      await expect(
        proofOfReserves.connect(auditor).submitReserveUpdate(0, physicalOunces, merkleRoot, auditHash)
      ).to.not.be.reverted;
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow pausing token transfers", async function () {
      const PAUSER_ROLE = await vaultToken.PAUSER_ROLE();
      await vaultToken.grantRole(PAUSER_ROLE, owner.address);
      
      await vaultToken.pause();
      expect(await vaultToken.paused()).to.be.true;

      // Mint some tokens first (should still work)
      const mintAmount = ethers.utils.parseEther("100");
      const physicalOunces = ethers.utils.parseEther("1");
      
      await expect(
        vaultToken.connect(backendService).mintBacked(user1.address, mintAmount, physicalOunces)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  // Additional test suites would include:
  // - Gas optimization tests
  // - Integration tests with price oracles
  // - Stress testing with large numbers
  // - Upgrade path testing (if using proxy pattern)
  // - Multi-signature wallet integration
  // - Cross-chain functionality (if applicable)
});

// Note: This is a basic test suite. Production deployment would require:
// 1. Comprehensive edge case testing
// 2. Gas usage optimization
// 3. Security audit
// 4. Formal verification
// 5. Integration testing with backend services
