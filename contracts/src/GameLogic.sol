// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MysteryToken.sol";
import "./DetectiveGameLeaderboard.sol";
import "./ClueNFT.sol";

/**
 * @title GameLogic
 * @dev Contract to handle game logic, scene completion, and token rewards
 */
contract GameLogic is Ownable, Pausable {
    // References to other contracts
    MysteryToken public mysteryToken;
    DetectiveGameLeaderboard public leaderboard;
    ClueNFT public clueNFT;
    
    // Game scene data
    struct Scene {
        string id;
        string name;
        uint256 rewardAmount;
        bool active;
    }
    
    // Mapping from scene ID to Scene data
    mapping(string => Scene) public scenes;
    
    // Array of scene IDs to track all scenes
    string[] public sceneIds;
    
    // Track which scenes a player has completed
    mapping(address => mapping(string => bool)) public completedScenes;
    
    // Track player's total rewards
    mapping(address => uint256) public playerRewards;
    
    // Track overall game completion per player
    mapping(address => bool) public gameCompleted;
    
    // Track which clues a player has found
    mapping(address => mapping(uint256 => bool)) public foundClues;
    
    // Authorized game administrators who can call certain functions
    mapping(address => bool) public gameAdmins;
    
    // Events
    event SceneAdded(string indexed sceneId, string name, uint256 rewardAmount);
    event SceneUpdated(string indexed sceneId, string name, uint256 rewardAmount, bool active);
    event SceneCompleted(address indexed player, string indexed sceneId, uint256 rewardAmount);
    event GameCompleted(address indexed player, uint256 totalReward);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event ClueFound(address indexed player, uint256 indexed clueId, string sceneId);
    
    // Modifiers
    modifier onlyAdmin() {
        require(gameAdmins[msg.sender] || owner() == msg.sender, "GameLogic: caller is not an admin or owner");
        _;
    }
    
    /**
     * @dev Constructor to set up the contract
     * @param tokenAddress Address of the MysteryToken contract
     * @param leaderboardAddress Address of the DetectiveGameLeaderboard contract
     * @param clueNFTAddress Address of the ClueNFT contract
     * @param initialOwner The address that will own the contract
     */
    constructor(
        address tokenAddress,
        address leaderboardAddress,
        address clueNFTAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        require(tokenAddress != address(0), "GameLogic: token is the zero address");
        require(leaderboardAddress != address(0), "GameLogic: leaderboard is the zero address");
        require(clueNFTAddress != address(0), "GameLogic: clueNFT is the zero address");
        
        mysteryToken = MysteryToken(tokenAddress);
        leaderboard = DetectiveGameLeaderboard(leaderboardAddress);
        clueNFT = ClueNFT(clueNFTAddress);
        
        // Add the contract owner as a game admin
        gameAdmins[initialOwner] = true;
        emit AdminAdded(initialOwner);
    }
    
    /**
     * @dev Add a new scene to the game
     * @param sceneId Unique identifier for the scene
     * @param name Human-readable name for the scene
     * @param rewardAmount Amount of tokens to reward when completing this scene
     */
    function addScene(string calldata sceneId, string calldata name, uint256 rewardAmount) external onlyAdmin {
        require(bytes(sceneId).length > 0, "GameLogic: scene ID cannot be empty");
        require(scenes[sceneId].rewardAmount == 0, "GameLogic: scene already exists");
        
        scenes[sceneId] = Scene({
            id: sceneId,
            name: name,
            rewardAmount: rewardAmount,
            active: true
        });
        
        sceneIds.push(sceneId);
        
        emit SceneAdded(sceneId, name, rewardAmount);
    }
    
    /**
     * @dev Update an existing scene's details
     * @param sceneId The ID of the scene to update
     * @param name New name for the scene
     * @param rewardAmount New reward amount for the scene
     * @param active Whether the scene is active
     */
    function updateScene(
        string calldata sceneId,
        string calldata name,
        uint256 rewardAmount,
        bool active
    ) external onlyAdmin {
        require(bytes(sceneId).length > 0, "GameLogic: scene ID cannot be empty");
        require(scenes[sceneId].rewardAmount > 0, "GameLogic: scene does not exist");
        
        scenes[sceneId].name = name;
        scenes[sceneId].rewardAmount = rewardAmount;
        scenes[sceneId].active = active;
        
        emit SceneUpdated(sceneId, name, rewardAmount, active);
    }
    
    /**
     * @dev Get all scene IDs
     * @return Array of scene IDs
     */
    function getAllSceneIds() external view returns (string[] memory) {
        return sceneIds;
    }
    
    /**
     * @dev Mark a scene as completed by a player and award tokens
     * @param player Address of the player who completed the scene
     * @param sceneId ID of the completed scene
     * @param timeTaken Time taken to complete the scene in seconds
     * @param cluesFound Number of clues found in the scene
     */
    function completeScene(
        address player,
        string calldata sceneId,
        uint256 timeTaken,
        uint8 cluesFound
    ) external onlyAdmin whenNotPaused {
        require(player != address(0), "GameLogic: player is the zero address");
        require(scenes[sceneId].active, "GameLogic: scene is not active");
        require(!completedScenes[player][sceneId], "GameLogic: scene already completed by player");
        
        Scene memory scene = scenes[sceneId];
        require(scene.rewardAmount > 0, "GameLogic: scene does not exist");
        
        // Mark the scene as completed
        completedScenes[player][sceneId] = true;
        
        // Award tokens to the player
        uint256 rewardAmount = scene.rewardAmount;
        playerRewards[player] += rewardAmount;
        
        // Mint tokens to the player
        mysteryToken.mint(player, rewardAmount);
        
        // Update the leaderboard
        uint256 score = calculateScore(timeTaken, cluesFound);
        leaderboard.updatePlayerScore(player, score, timeTaken, cluesFound, false);
        
        emit SceneCompleted(player, sceneId, rewardAmount);
        
        // Check if the player has completed all active scenes
        checkGameCompletion(player);
    }
    
    /**
     * @dev Record that a player has found a clue and mint the corresponding NFT
     * @param player Address of the player who found the clue
     * @param clueId ID of the clue that was found
     */
    function findClue(address player, uint256 clueId) external onlyAdmin whenNotPaused {
        require(player != address(0), "GameLogic: player is the zero address");
        require(!foundClues[player][clueId], "GameLogic: clue already found by player");
        
        // Get the clue metadata to verify it exists and get the scene ID
        (, string memory sceneId, , ) = clueNFT.getClueMetadata(clueId);
        
        // Mark the clue as found by the player
        foundClues[player][clueId] = true;
        
        // Mint the clue NFT to the player
        clueNFT.mintClue(player, clueId);
        
        emit ClueFound(player, clueId, sceneId);
    }
    
    /**
     * @dev Check if a player has found a specific clue
     * @param player The player's address
     * @param clueId The clue ID to check
     * @return Whether the player has found the clue
     */
    function hasFoundClue(address player, uint256 clueId) external view returns (bool) {
        return foundClues[player][clueId];
    }
    
    /**
     * @dev Get the number of clues a player has found in a specific scene
     * @param player The player's address
     * @param sceneId The scene ID to check
     * @return The number of clues found by the player in the scene
     */
    function getCluesFoundInScene(address player, string calldata sceneId) external view returns (uint256) {
        uint256[] memory sceneClues = clueNFT.getSceneClues(sceneId);
        uint256 count = 0;
        
        for (uint256 i = 0; i < sceneClues.length; i++) {
            if (foundClues[player][sceneClues[i]]) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @dev Check if a player has completed all active scenes
     * @param player The player's address to check
     */
    function checkGameCompletion(address player) internal {
        if (gameCompleted[player]) {
            return; // Already marked as completed
        }
        
        bool allCompleted = true;
        
        for (uint256 i = 0; i < sceneIds.length; i++) {
            string memory sceneId = sceneIds[i];
            if (scenes[sceneId].active && !completedScenes[player][sceneId]) {
                allCompleted = false;
                break;
            }
        }
        
        if (allCompleted && sceneIds.length > 0) {
            gameCompleted[player] = true;
            
            // Award a bonus for completing the entire game
            uint256 bonusReward = 100 * 10**18; // 100 tokens bonus
            mysteryToken.mint(player, bonusReward);
            playerRewards[player] += bonusReward;
            
            // Update the leaderboard to mark game completion
            (uint256 score, uint256 time, uint8 clues, , ) = leaderboard.getPlayerScore(player);
            leaderboard.updatePlayerScore(player, score + bonusReward, time, clues, true);
            
            emit GameCompleted(player, playerRewards[player]);
        }
    }
    
    /**
     * @dev Calculate a score based on time taken and clues found
     * @param timeTaken Time taken to complete the scene in seconds
     * @param cluesFound Number of clues found
     * @return The calculated score
     */
    function calculateScore(uint256 timeTaken, uint8 cluesFound) public pure returns (uint256) {
        // Base score is 1000
        uint256 baseScore = 1000;
        
        // Time bonus: faster completion gives higher score
        // If completion is under 5 minutes (300 seconds), award a time bonus
        uint256 timeBonus = 0;
        if (timeTaken < 300) {
            timeBonus = 300 - timeTaken; // Up to 300 points for fastest time
        }
        
        // Clue bonus: 100 points per clue found
        uint256 clueBonus = uint256(cluesFound) * 100;
        
        return baseScore + timeBonus + clueBonus;
    }
    
    /**
     * @dev Check if a player has completed a specific scene
     * @param player The player's address
     * @param sceneId The scene ID to check
     * @return Whether the player has completed the scene
     */
    function hasCompletedScene(address player, string calldata sceneId) external view returns (bool) {
        return completedScenes[player][sceneId];
    }
    
    /**
     * @dev Get the total rewards earned by a player
     * @param player The player's address
     * @return The total rewards earned by the player
     */
    function getTotalRewards(address player) external view returns (uint256) {
        return playerRewards[player];
    }
    
    /**
     * @dev Add a new game admin
     * @param admin The address to add as an admin
     */
    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "GameLogic: admin is the zero address");
        require(!gameAdmins[admin], "GameLogic: address is already an admin");
        
        gameAdmins[admin] = true;
        emit AdminAdded(admin);
    }
    
    /**
     * @dev Remove a game admin
     * @param admin The address to remove as an admin
     */
    function removeAdmin(address admin) external onlyOwner {
        require(gameAdmins[admin], "GameLogic: address is not an admin");
        require(admin != owner(), "GameLogic: cannot remove owner as admin");
        
        gameAdmins[admin] = false;
        emit AdminRemoved(admin);
    }
    
    /**
     * @dev Pause all scene completion and token minting
     */
    function pause() external onlyAdmin {
        _pause();
    }
    
    /**
     * @dev Unpause scene completion and token minting
     */
    function unpause() external onlyAdmin {
        _unpause();
    }
} 