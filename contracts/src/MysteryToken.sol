// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MysteryToken
 * @dev ERC20 token for the Detective Puzzle Game rewards
 */
contract MysteryToken is ERC20, ERC20Burnable, Ownable, Pausable {
    // Token details
    uint8 private constant _decimals = 18;
    uint256 private constant _maxSupply = 1_000_000 * 10**18; // 1 million tokens
    
    // Game logic contract that is allowed to mint tokens
    address private _gameLogicContract;
    
    // Events
    event GameLogicContractUpdated(address indexed oldAddress, address indexed newAddress);
    
    /**
     * @dev Constructor to set up the token
     * @param initialOwner The address that will own the contract
     */
    constructor(address initialOwner) 
        ERC20("Mystery Token", "MSTY") 
        Ownable(initialOwner)
    {
        // No initial supply is minted - tokens are minted through the game logic
    }
    
    /**
     * @dev Set the game logic contract address that's allowed to mint tokens
     * @param gameLogicContract The address of the game logic contract
     */
    function setGameLogicContract(address gameLogicContract) external onlyOwner {
        require(gameLogicContract != address(0), "MysteryToken: zero address");
        
        address oldGameLogic = _gameLogicContract;
        _gameLogicContract = gameLogicContract;
        
        emit GameLogicContractUpdated(oldGameLogic, gameLogicContract);
    }
    
    /**
     * @dev Get the current game logic contract address
     * @return The address of the game logic contract
     */
    function getGameLogicContract() external view returns (address) {
        return _gameLogicContract;
    }
    
    /**
     * @dev Mint new tokens - can only be called by the game logic contract
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external whenNotPaused {
        require(msg.sender == _gameLogicContract, "MysteryToken: caller is not the game logic contract");
        require(to != address(0), "MysteryToken: mint to the zero address");
        require(totalSupply() + amount <= _maxSupply, "MysteryToken: max supply exceeded");
        
        _mint(to, amount);
    }
    
    /**
     * @dev Return the number of decimals used for the token
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Return the maximum supply of tokens
     */
    function maxSupply() public pure returns (uint256) {
        return _maxSupply;
    }
    
    /**
     * @dev Pause token transfers and minting
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers and minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override the _beforeTokenTransfer hook to check if the contract is paused
     */
    function _update(address from, address to, uint256 amount) internal override(ERC20) whenNotPaused {
        super._update(from, to, amount);
    }
} 