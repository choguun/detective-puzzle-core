// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DetectiveGameLeaderboard
 * @dev A smart contract for storing and managing player scores in the Detective Puzzle Game
 */
contract DetectiveGameLeaderboard is Ownable, Pausable {
    // Structures
    struct PlayerScore {
        uint256 score;
        uint256 timeCompleted;
        uint8 cluesFound;
        bool completedGame;
    }

    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint256 timeCompleted;
        uint256 rank;
    }

    // State variables
    mapping(address => PlayerScore) private playerScores;
    address[] private playersArray;
    mapping(address => bool) private registeredPlayers;
    mapping(address => uint256) private playerRanks;
    
    uint256 private bestScore;
    address private bestPlayer;
    
    // Events
    event ScoreUpdated(address indexed player, uint256 score, uint256 timeCompleted, uint8 cluesFound);
    event GameCompleted(address indexed player, uint256 finalScore, uint256 timeCompleted);
    event NewTopScore(address indexed player, uint256 score);

    // Constructor
    constructor() Ownable(msg.sender) {
        bestScore = 0;
        bestPlayer = address(0);
    }

    /**
     * @dev Adds or updates a player's score
     * @param player The address of the player
     * @param score The player's score
     * @param timeCompleted Time taken to complete in seconds
     * @param cluesFound Number of clues the player found
     * @param completedGame Whether the player completed the game
     */
    function updatePlayerScore(
        address player,
        uint256 score,
        uint256 timeCompleted,
        uint8 cluesFound,
        bool completedGame
    ) external onlyOwner whenNotPaused {
        if (!registeredPlayers[player]) {
            playersArray.push(player);
            registeredPlayers[player] = true;
        }
        
        PlayerScore storage playerScore = playerScores[player];
        
        // Only update if the new score is better or the player completed the game
        if (score > playerScore.score || (completedGame && !playerScore.completedGame)) {
            playerScore.score = score;
            playerScore.timeCompleted = timeCompleted;
            playerScore.cluesFound = cluesFound;
            playerScore.completedGame = completedGame;
            
            emit ScoreUpdated(player, score, timeCompleted, cluesFound);
            
            if (completedGame) {
                emit GameCompleted(player, score, timeCompleted);
            }
            
            // Check if this is a new top score
            if (score > bestScore) {
                bestScore = score;
                bestPlayer = player;
                emit NewTopScore(player, score);
            }
            
            // Recalculate rankings
            calculateRankings();
        }
    }
    
    /**
     * @dev Calculate player rankings based on scores
     * Sorts players by score (more efficient implementations can be used for larger data sets)
     */
    function calculateRankings() internal {
        uint256 playersCount = playersArray.length;
        
        // Simple bubble sort (for demonstration - would need optimization for large datasets)
        for (uint256 i = 0; i < playersCount - 1; i++) {
            for (uint256 j = 0; j < playersCount - i - 1; j++) {
                if (playerScores[playersArray[j]].score < playerScores[playersArray[j + 1]].score) {
                    address temp = playersArray[j];
                    playersArray[j] = playersArray[j + 1];
                    playersArray[j + 1] = temp;
                }
            }
        }
        
        // Update ranks
        for (uint256 i = 0; i < playersCount; i++) {
            playerRanks[playersArray[i]] = i + 1;
        }
    }
    
    /**
     * @dev Get a player's score info
     * @param player The address of the player
     * @return score The player's score
     * @return timeCompleted Time taken to complete
     * @return cluesFound Number of clues found
     * @return completedGame Whether the player completed the game
     * @return rank The player's rank
     */
    function getPlayerScore(address player) external view returns (
        uint256 score,
        uint256 timeCompleted,
        uint8 cluesFound,
        bool completedGame,
        uint256 rank
    ) {
        PlayerScore memory playerScore = playerScores[player];
        return (
            playerScore.score,
            playerScore.timeCompleted,
            playerScore.cluesFound,
            playerScore.completedGame,
            playerRanks[player]
        );
    }
    
    /**
     * @dev Get the top leaderboard entries
     * @param count The number of entries to retrieve
     * @return leaderboard The array of leaderboard entries
     */
    function getTopScores(uint256 count) external view returns (LeaderboardEntry[] memory) {
        uint256 playersCount = playersArray.length;
        
        // If we have fewer players than requested, return all we have
        if (count > playersCount) {
            count = playersCount;
        }
        
        LeaderboardEntry[] memory leaderboard = new LeaderboardEntry[](count);
        
        for (uint256 i = 0; i < count; i++) {
            address playerAddress = playersArray[i];
            PlayerScore memory playerScore = playerScores[playerAddress];
            
            leaderboard[i] = LeaderboardEntry({
                player: playerAddress,
                score: playerScore.score,
                timeCompleted: playerScore.timeCompleted,
                rank: i + 1
            });
        }
        
        return leaderboard;
    }
    
    /**
     * @dev Get the best score and player
     * @return topPlayer The address of the top player
     * @return topScore The top score
     */
    function getTopPlayer() external view returns (address topPlayer, uint256 topScore) {
        return (bestPlayer, bestScore);
    }
    
    /**
     * @dev Returns the total number of players registered
     * @return count The number of players
     */
    function getPlayerCount() external view returns (uint256 count) {
        return playersArray.length;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
} 