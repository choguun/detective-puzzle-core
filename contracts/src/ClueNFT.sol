// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ClueNFT
 * @dev ERC1155 token for representing clues discovered in the Detective Puzzle Game
 */
contract ClueNFT is ERC1155, ERC1155URIStorage, Ownable, Pausable {
    using Strings for uint256;
    
    // Game logic contract that is allowed to mint clue NFTs
    address private _gameLogicContract;
    
    // Counter for the next clue ID
    uint256 private _nextClueId = 1;
    
    // Mapping from scene ID to array of clue IDs
    mapping(string => uint256[]) private _sceneClues;
    
    // Mapping from clue ID to its metadata
    struct ClueMetadata {
        string name;
        string sceneId;
        string description;
        uint8 difficulty; // 1-5 scale, with 5 being most difficult
        bool exists;
    }
    
    mapping(uint256 => ClueMetadata) private _clueMetadata;
    
    // Events
    event ClueAdded(uint256 indexed clueId, string sceneId, string name);
    event ClueMinted(address indexed player, uint256 indexed clueId, string sceneId);
    event GameLogicContractUpdated(address indexed oldAddress, address indexed newAddress);
    
    /**
     * @dev Constructor to set up the token
     * @param initialOwner The address that will own the contract
     * @param baseURI The base URI for the token metadata
     */
    constructor(address initialOwner, string memory baseURI) 
        ERC1155(baseURI)
        Ownable(initialOwner)
    {
        // No clues are created initially - they are added by the owner and minted by game logic
    }
    
    /**
     * @dev Set the game logic contract address that's allowed to mint clue NFTs
     * @param gameLogicContract The address of the game logic contract
     */
    function setGameLogicContract(address gameLogicContract) external onlyOwner {
        require(gameLogicContract != address(0), "ClueNFT: game logic cannot be zero address");
        
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
     * @dev Add a new clue to the system
     * @param sceneId The scene where the clue is located
     * @param name The name of the clue
     * @param description A description of the clue
     * @param difficulty The difficulty level of finding the clue (1-5)
     * @param tokenUri The URI for the clue's metadata
     * @return The ID of the new clue
     */
    function addClue(
        string calldata sceneId,
        string calldata name,
        string calldata description,
        uint8 difficulty,
        string calldata tokenUri
    ) external onlyOwner returns (uint256) {
        require(bytes(sceneId).length > 0, "ClueNFT: scene ID cannot be empty");
        require(bytes(name).length > 0, "ClueNFT: name cannot be empty");
        require(difficulty >= 1 && difficulty <= 5, "ClueNFT: difficulty must be between 1 and 5");
        
        uint256 clueId = _nextClueId++;
        
        _clueMetadata[clueId] = ClueMetadata({
            name: name,
            sceneId: sceneId,
            description: description,
            difficulty: difficulty,
            exists: true
        });
        
        _sceneClues[sceneId].push(clueId);
        
        // Set the URI for this token
        _setURI(clueId, tokenUri);
        
        emit ClueAdded(clueId, sceneId, name);
        
        return clueId;
    }
    
    /**
     * @dev Update the metadata for an existing clue
     * @param clueId The ID of the clue to update
     * @param name The new name for the clue
     * @param description The new description for the clue
     * @param difficulty The new difficulty level for the clue
     * @param tokenUri The new URI for the clue's metadata
     */
    function updateClue(
        uint256 clueId,
        string calldata name,
        string calldata description,
        uint8 difficulty,
        string calldata tokenUri
    ) external onlyOwner {
        require(_clueMetadata[clueId].exists, "ClueNFT: clue does not exist");
        require(bytes(name).length > 0, "ClueNFT: name cannot be empty");
        require(difficulty >= 1 && difficulty <= 5, "ClueNFT: difficulty must be between 1 and 5");
        
        _clueMetadata[clueId].name = name;
        _clueMetadata[clueId].description = description;
        _clueMetadata[clueId].difficulty = difficulty;
        
        // Update the URI for this token
        _setURI(clueId, tokenUri);
    }
    
    /**
     * @dev Get all clue IDs for a specific scene
     * @param sceneId The scene ID to get clues for
     * @return Array of clue IDs in the scene
     */
    function getSceneClues(string calldata sceneId) external view returns (uint256[] memory) {
        return _sceneClues[sceneId];
    }
    
    /**
     * @dev Get metadata for a specific clue
     * @param clueId The ID of the clue
     * @return name The name of the clue
     * @return sceneId The scene where the clue is located
     * @return description The description of the clue
     * @return difficulty The difficulty level of finding the clue
     */
    function getClueMetadata(uint256 clueId) external view returns (
        string memory name,
        string memory sceneId,
        string memory description,
        uint8 difficulty
    ) {
        require(_clueMetadata[clueId].exists, "ClueNFT: clue does not exist");
        
        ClueMetadata memory metadata = _clueMetadata[clueId];
        return (
            metadata.name,
            metadata.sceneId,
            metadata.description,
            metadata.difficulty
        );
    }
    
    /**
     * @dev Mint a clue NFT to a player - can only be called by the game logic contract
     * @param to The address to mint the clue to
     * @param clueId The ID of the clue to mint
     */
    function mintClue(address to, uint256 clueId) external whenNotPaused {
        require(msg.sender == _gameLogicContract, "ClueNFT: caller is not the game logic contract");
        require(to != address(0), "ClueNFT: mint to the zero address");
        require(_clueMetadata[clueId].exists, "ClueNFT: clue does not exist");
        
        // Mint a single clue NFT to the player
        _mint(to, clueId, 1, "");
        
        emit ClueMinted(to, clueId, _clueMetadata[clueId].sceneId);
    }
    
    /**
     * @dev Check if a player owns a specific clue NFT
     * @param player The address of the player
     * @param clueId The ID of the clue to check
     * @return Whether the player owns the clue NFT
     */
    function hasClue(address player, uint256 clueId) external view returns (bool) {
        return balanceOf(player, clueId) > 0;
    }
    
    /**
     * @dev Get the total number of clues a player has discovered
     * @param player The address of the player
     * @return The total number of unique clues owned by the player
     */
    function getPlayerClueCount(address player) external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i < _nextClueId; i++) {
            if (balanceOf(player, i) > 0) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Pause clue minting
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause clue minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override the uri function to use the token URI storage
     */
    function uri(uint256 tokenId) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return ERC1155URIStorage.uri(tokenId);
    }
    
    /**
     * @dev Override _update to check if the contract is paused
     */
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual override whenNotPaused {
        super._update(from, to, ids, values);
    }
} 