// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title ProofOfReserves
 * @dev PBCEx Proof of Reserves system for vault-backed tokens
 * 
 * This contract provides cryptographic proof that PBCEx maintains adequate
 * physical precious metal reserves to back all issued synthetic tokens.
 * 
 * Features:
 * - Merkle tree proofs for reserve verification
 * - Integration with external auditors
 * - Chainlink oracle integration for real-time verification
 * - Time-locked reserve updates for security
 * - Emergency pause functionality
 * 
 * IMPORTANT: This is a Phase-3 stub implementation.
 * Full implementation requires integration with Chainlink PoR feeds and
 * security audits before production deployment.
 */
contract ProofOfReserves is AccessControl, Pausable {
    // Role definitions
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Reserve data structure
    struct ReserveData {
        uint256 totalPhysicalOunces;    // Total physical metal in troy ounces (scaled by 1e18)
        uint256 totalTokenSupply;       // Total synthetic tokens issued (scaled by decimals)
        uint256 lastAuditTimestamp;     // Last audit timestamp
        bytes32 merkleRoot;             // Merkle root of all vault holdings
        string auditHash;               // IPFS hash of detailed audit report
        string auditorSignature;        // Auditor's digital signature
        bool isVerified;                // Whether reserves are verified by auditor
    }

    // Asset type definitions
    enum MetalType {
        GOLD,       // Gold (AU)
        SILVER,     // Silver (AG)
        PLATINUM,   // Platinum (PT)
        PALLADIUM,  // Palladium (PD)
        COPPER      // Copper (CU)
    }

    // Reserve tracking by metal type
    mapping(MetalType => ReserveData) public reserves;
    mapping(MetalType => address) public tokenContracts;
    mapping(MetalType => AggregatorV3Interface) public priceFeeds;

    // Audit trail
    struct AuditEntry {
        uint256 timestamp;
        MetalType metal;
        uint256 physicalOunces;
        uint256 tokenSupply;
        bytes32 merkleRoot;
        address auditor;
        string reportHash;
    }

    AuditEntry[] public auditHistory;
    mapping(address => bool) public approvedAuditors;

    // Time-lock for reserve updates
    uint256 public constant UPDATE_DELAY = 24 hours; // 24-hour delay for security
    mapping(bytes32 => uint256) public pendingUpdates;

    // Emergency controls
    mapping(MetalType => bool) public emergencyPaused;
    uint256 public lastEmergencyUpdate;

    // Events
    event ReserveUpdated(MetalType indexed metal, uint256 physicalOunces, uint256 tokenSupply, bytes32 merkleRoot);
    event AuditCompleted(MetalType indexed metal, address indexed auditor, string reportHash, bool verified);
    event EmergencyPause(MetalType indexed metal, string reason);
    event AuditorApproved(address indexed auditor, bool approved);
    event TokenContractLinked(MetalType indexed metal, address tokenContract);

    /**
     * @dev Constructor sets up the contract with initial parameters
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Link a token contract to a metal type
     * @param metal The metal type
     * @param tokenContract Address of the ERC20VaultToken contract
     */
    function linkTokenContract(MetalType metal, address tokenContract) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokenContract != address(0), "Invalid token contract");
        tokenContracts[metal] = tokenContract;
        emit TokenContractLinked(metal, tokenContract);
    }

    /**
     * @dev Set Chainlink price feed for a metal
     * @param metal The metal type
     * @param priceFeed Address of the Chainlink price feed
     */
    function setPriceFeed(MetalType metal, address priceFeed) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(priceFeed != address(0), "Invalid price feed");
        priceFeeds[metal] = AggregatorV3Interface(priceFeed);
    }

    /**
     * @dev Submit reserve update (time-locked)
     * @param metal The metal type
     * @param physicalOunces Total physical metal in vault (scaled by 1e18)
     * @param merkleRoot Merkle root of all vault holdings
     * @param auditHash IPFS hash of audit report
     */
    function submitReserveUpdate(
        MetalType metal,
        uint256 physicalOunces,
        bytes32 merkleRoot,
        string memory auditHash
    ) external onlyRole(AUDITOR_ROLE) whenNotPaused {
        require(physicalOunces > 0, "Physical ounces must be positive");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(bytes(auditHash).length > 0, "Audit hash required");

        // Create unique identifier for this update
        bytes32 updateId = keccak256(abi.encodePacked(
            metal, physicalOunces, merkleRoot, auditHash, block.timestamp
        ));

        // Schedule update with delay
        pendingUpdates[updateId] = block.timestamp + UPDATE_DELAY;

        // Store update data temporarily (in production, would use more efficient storage)
        // For now, we emit an event to track the pending update
        // emit ReserveUpdateScheduled(updateId, metal, physicalOunces, block.timestamp + UPDATE_DELAY);
    }

    /**
     * @dev Execute a time-locked reserve update
     * @param metal The metal type
     * @param physicalOunces Total physical metal in vault
     * @param merkleRoot Merkle root of all vault holdings
     * @param auditHash IPFS hash of audit report
     * @param auditorSignature Auditor's digital signature
     */
    function executeReserveUpdate(
        MetalType metal,
        uint256 physicalOunces,
        bytes32 merkleRoot,
        string memory auditHash,
        string memory auditorSignature
    ) external onlyRole(AUDITOR_ROLE) whenNotPaused {
        // Verify time-lock has passed
        bytes32 updateId = keccak256(abi.encodePacked(
            metal, physicalOunces, merkleRoot, auditHash, 
            block.timestamp - UPDATE_DELAY // Approximate original timestamp
        ));
        
        require(pendingUpdates[updateId] > 0, "Update not found");
        require(block.timestamp >= pendingUpdates[updateId], "Update still time-locked");

        // Get current token supply from linked contract
        uint256 tokenSupply = 0;
        if (tokenContracts[metal] != address(0)) {
            // In production, would call totalSupply() on the token contract
            tokenSupply = 1000000 * 10**18; // Stub value
        }

        // Update reserves
        reserves[metal] = ReserveData({
            totalPhysicalOunces: physicalOunces,
            totalTokenSupply: tokenSupply,
            lastAuditTimestamp: block.timestamp,
            merkleRoot: merkleRoot,
            auditHash: auditHash,
            auditorSignature: auditorSignature,
            isVerified: true
        });

        // Add to audit history
        auditHistory.push(AuditEntry({
            timestamp: block.timestamp,
            metal: metal,
            physicalOunces: physicalOunces,
            tokenSupply: tokenSupply,
            merkleRoot: merkleRoot,
            auditor: msg.sender,
            reportHash: auditHash
        }));

        // Clear pending update
        delete pendingUpdates[updateId];

        emit ReserveUpdated(metal, physicalOunces, tokenSupply, merkleRoot);
        emit AuditCompleted(metal, msg.sender, auditHash, true);
    }

    /**
     * @dev Verify a specific vault holding using Merkle proof
     * @param metal The metal type
     * @param vaultId Unique vault identifier
     * @param amount Amount held in this vault
     * @param proof Merkle proof array
     */
    function verifyVaultHolding(
        MetalType metal,
        bytes32 vaultId,
        uint256 amount,
        bytes32[] memory proof
    ) external view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(vaultId, amount));
        bytes32 merkleRoot = reserves[metal].merkleRoot;
        
        return _verifyMerkleProof(proof, merkleRoot, leaf);
    }

    /**
     * @dev Get backing ratio for a metal type
     * @param metal The metal type
     * @return ratio Backing ratio in basis points (10000 = 100%)
     */
    function getBackingRatio(MetalType metal) external view returns (uint256 ratio) {
        ReserveData memory reserve = reserves[metal];
        
        if (reserve.totalTokenSupply == 0) {
            return 10000; // 100% if no tokens issued
        }
        
        // Calculate ratio: (physical * 10000) / tokens
        return (reserve.totalPhysicalOunces * 10000) / reserve.totalTokenSupply;
    }

    /**
     * @dev Get current price from Chainlink oracle
     * @param metal The metal type
     * @return price Current price with 8 decimals
     * @return timestamp Price timestamp
     */
    function getLatestPrice(MetalType metal) external view returns (int256 price, uint256 timestamp) {
        AggregatorV3Interface priceFeed = priceFeeds[metal];
        require(address(priceFeed) != address(0), "Price feed not set");
        
        (, price, , timestamp, ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        
        return (price, timestamp);
    }

    /**
     * @dev Calculate total USD value of reserves
     * @param metal The metal type
     * @return totalValue Total value in USD with 8 decimals
     */
    function calculateReserveValue(MetalType metal) external view returns (uint256 totalValue) {
        ReserveData memory reserve = reserves[metal];
        (int256 price, ) = this.getLatestPrice(metal);
        
        // Calculate: (physical ounces * price) / 1e18 (to account for scaling)
        totalValue = (reserve.totalPhysicalOunces * uint256(price)) / 1e18;
        
        return totalValue;
    }

    /**
     * @dev Emergency pause for a specific metal
     * @param metal The metal type
     * @param reason Reason for pause
     */
    function emergencyPauseMetal(MetalType metal, string memory reason) 
        external onlyRole(PAUSER_ROLE) {
        emergencyPaused[metal] = true;
        lastEmergencyUpdate = block.timestamp;
        emit EmergencyPause(metal, reason);
    }

    /**
     * @dev Unpause a metal after emergency
     * @param metal The metal type
     */
    function unpauseMetal(MetalType metal) 
        external onlyRole(PAUSER_ROLE) {
        emergencyPaused[metal] = false;
    }

    /**
     * @dev Approve/disapprove an auditor
     * @param auditor Auditor address
     * @param approved Whether to approve or disapprove
     */
    function setAuditorApproval(address auditor, bool approved) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        approvedAuditors[auditor] = approved;
        emit AuditorApproved(auditor, approved);
    }

    /**
     * @dev Get audit history length
     */
    function getAuditHistoryLength() external view returns (uint256) {
        return auditHistory.length;
    }

    /**
     * @dev Check if reserves are current (audited within last 30 days)
     * @param metal The metal type
     */
    function areReservesCurrent(MetalType metal) external view returns (bool) {
        return (block.timestamp - reserves[metal].lastAuditTimestamp) <= 30 days;
    }

    /**
     * @dev Internal function to verify Merkle proof
     * @param proof Merkle proof array
     * @param root Merkle root
     * @param leaf Leaf to verify
     */
    function _verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }

    /**
     * @dev Pause the entire contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the entire contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
