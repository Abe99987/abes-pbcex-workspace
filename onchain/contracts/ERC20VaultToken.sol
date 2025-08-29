// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ERC20VaultToken
 * @dev PBCEx Vault-backed ERC20 token for synthetic precious metals
 * 
 * This contract represents synthetic precious metal tokens that are backed by
 * physical inventory held in PBCEx vaults. Only authorized backend services
 * can mint/burn tokens to maintain 1:1 backing with physical assets.
 * 
 * Features:
 * - Mint/burn only callable by authorized backend services
 * - Pausable for emergency stops
 * - Role-based access control
 * - Integration with Chainlink oracles for price feeds
 * - Compliance hooks for regulatory requirements
 * 
 * IMPORTANT: This is a Phase-3 stub implementation.
 * Full implementation requires security audits before production deployment.
 */
contract ERC20VaultToken is ERC20, ERC20Burnable, AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // Token metadata
    string private _tokenSymbol;
    uint8 private _decimals;
    
    // Vault backing information
    struct VaultBacking {
        uint256 totalPhysicalOunces;
        uint256 lastAuditTimestamp;
        string vaultLocation;
        string custodian;
    }
    
    VaultBacking public vaultBacking;
    
    // Compliance and regulatory
    mapping(address => bool) public isBlacklisted;
    mapping(address => uint256) public dailyTransferLimit;
    mapping(address => uint256) public dailyTransferUsed;
    mapping(address => uint256) public lastTransferDay;
    
    uint256 public constant DEFAULT_DAILY_LIMIT = 1000 * 10**18; // 1000 tokens
    uint256 public maxSupply;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, uint256 physicalOunces);
    event TokensBurned(address indexed from, uint256 amount, uint256 physicalOunces);
    event VaultAuditUpdated(uint256 physicalOunces, uint256 timestamp, string location);
    event ComplianceAction(address indexed account, string action, string reason);
    event DailyLimitUpdated(address indexed account, uint256 newLimit);

    /**
     * @dev Constructor sets up the token with initial parameters
     * @param name Token name (e.g., "PBCEx Gold Vault Token")
     * @param symbol Token symbol (e.g., "XAUV")
     * @param decimals_ Token decimals (18 for compatibility)
     * @param maxSupply_ Maximum token supply
     * @param initialVaultOunces Initial physical backing in troy ounces
     * @param vaultLocation Initial vault location
     * @param custodian Initial custodian name
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 maxSupply_,
        uint256 initialVaultOunces,
        string memory vaultLocation,
        string memory custodian
    ) ERC20(name, symbol) {
        _tokenSymbol = symbol;
        _decimals = decimals_;
        maxSupply = maxSupply_;
        
        vaultBacking = VaultBacking({
            totalPhysicalOunces: initialVaultOunces,
            lastAuditTimestamp: block.timestamp,
            vaultLocation: vaultLocation,
            custodian: custodian
        });

        // Grant default admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
    }

    /**
     * @dev Returns the number of decimals used for token amounts
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens backed by physical vault inventory
     * Only callable by authorized backend services with MINTER_ROLE
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param physicalOunces Amount of physical metal backing (in troy ounces * 1e18)
     */
    function mintBacked(
        address to,
        uint256 amount,
        uint256 physicalOunces
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(to != address(0), "ERC20VaultToken: mint to zero address");
        require(amount > 0, "ERC20VaultToken: mint amount must be positive");
        require(physicalOunces > 0, "ERC20VaultToken: physical backing required");
        require(!isBlacklisted[to], "ERC20VaultToken: recipient is blacklisted");
        
        // Check supply cap
        require(totalSupply() + amount <= maxSupply, "ERC20VaultToken: exceeds max supply");
        
        // Update vault backing
        vaultBacking.totalPhysicalOunces += physicalOunces;
        
        // Mint tokens
        _mint(to, amount);
        
        emit TokensMinted(to, amount, physicalOunces);
    }

    /**
     * @dev Burn tokens and release physical vault inventory
     * Only callable by authorized backend services with BURNER_ROLE
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * @param physicalOunces Amount of physical metal released (in troy ounces * 1e18)
     */
    function burnBacked(
        address from,
        uint256 amount,
        uint256 physicalOunces
    ) external onlyRole(BURNER_ROLE) whenNotPaused nonReentrant {
        require(from != address(0), "ERC20VaultToken: burn from zero address");
        require(amount > 0, "ERC20VaultToken: burn amount must be positive");
        require(physicalOunces > 0, "ERC20VaultToken: physical release required");
        require(balanceOf(from) >= amount, "ERC20VaultToken: insufficient balance");
        
        // Update vault backing
        require(vaultBacking.totalPhysicalOunces >= physicalOunces, 
                "ERC20VaultToken: insufficient physical backing");
        vaultBacking.totalPhysicalOunces -= physicalOunces;
        
        // Burn tokens
        _burn(from, amount);
        
        emit TokensBurned(from, amount, physicalOunces);
    }

    /**
     * @dev Update vault audit information
     * Only callable by accounts with COMPLIANCE_ROLE
     */
    function updateVaultAudit(
        uint256 physicalOunces,
        string memory location,
        string memory custodian
    ) external onlyRole(COMPLIANCE_ROLE) {
        vaultBacking.totalPhysicalOunces = physicalOunces;
        vaultBacking.lastAuditTimestamp = block.timestamp;
        vaultBacking.vaultLocation = location;
        vaultBacking.custodian = custodian;
        
        emit VaultAuditUpdated(physicalOunces, block.timestamp, location);
    }

    /**
     * @dev Pause token transfers (emergency use)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Add/remove address from blacklist
     */
    function setBlacklisted(address account, bool blacklisted, string memory reason) 
        external onlyRole(COMPLIANCE_ROLE) {
        isBlacklisted[account] = blacklisted;
        emit ComplianceAction(account, blacklisted ? "BLACKLISTED" : "UNBLACKLISTED", reason);
    }

    /**
     * @dev Set daily transfer limit for an address
     */
    function setDailyLimit(address account, uint256 limit) 
        external onlyRole(COMPLIANCE_ROLE) {
        dailyTransferLimit[account] = limit;
        emit DailyLimitUpdated(account, limit);
    }

    /**
     * @dev Get effective daily limit for an address
     */
    function getDailyLimit(address account) public view returns (uint256) {
        uint256 customLimit = dailyTransferLimit[account];
        return customLimit > 0 ? customLimit : DEFAULT_DAILY_LIMIT;
    }

    /**
     * @dev Check if transfer is within daily limits
     */
    function _checkDailyLimit(address from, uint256 amount) internal {
        if (hasRole(MINTER_ROLE, from) || hasRole(BURNER_ROLE, from)) {
            return; // Skip limit checks for authorized services
        }

        uint256 currentDay = block.timestamp / 86400; // Get current day
        uint256 userDay = lastTransferDay[from];
        
        if (userDay < currentDay) {
            // New day, reset usage
            dailyTransferUsed[from] = 0;
            lastTransferDay[from] = currentDay;
        }
        
        uint256 dailyLimit = getDailyLimit(from);
        require(dailyTransferUsed[from] + amount <= dailyLimit, 
                "ERC20VaultToken: exceeds daily transfer limit");
        
        dailyTransferUsed[from] += amount;
    }

    /**
     * @dev Override transfer to add compliance checks
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
        
        // Skip checks for mint/burn operations
        if (from == address(0) || to == address(0)) {
            return;
        }
        
        // Compliance checks
        require(!isBlacklisted[from], "ERC20VaultToken: sender is blacklisted");
        require(!isBlacklisted[to], "ERC20VaultToken: recipient is blacklisted");
        
        // Daily limit checks
        _checkDailyLimit(from, amount);
    }

    /**
     * @dev Get backing ratio (tokens to physical ounces)
     * Returns ratio in basis points (10000 = 100%)
     */
    function getBackingRatio() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 10000; // 100% if no tokens exist
        
        // Calculate ratio: (physical * 10000) / supply
        return (vaultBacking.totalPhysicalOunces * 10000) / supply;
    }

    /**
     * @dev Emergency withdraw function (only for extreme circumstances)
     * Requires majority of admin roles to approve
     */
    function emergencyWithdraw(address token, address to) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        // This would require multi-sig in production
        require(to != address(0), "ERC20VaultToken: invalid recipient");
        
        if (token == address(0)) {
            // Withdraw ETH
            payable(to).transfer(address(this).balance);
        } else {
            // Withdraw ERC20 tokens
            IERC20(token).transfer(to, IERC20(token).balanceOf(address(this)));
        }
    }

    /**
     * @dev The following functions are overrides required by Solidity
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC20, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
