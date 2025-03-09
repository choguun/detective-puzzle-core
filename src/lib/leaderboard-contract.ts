'use client';

import { useEffect, useState } from 'react';

// TypeScript declarations for ethers and window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

// Contract ABI (this would be generated when you compile the contract)
const LEADERBOARD_ABI = [
  "function updatePlayerScore(address player, uint256 score, uint256 timeCompleted, uint8 cluesFound, bool completedGame) external",
  "function getPlayerScore(address player) external view returns (uint256 score, uint256 timeCompleted, uint8 cluesFound, bool completedGame, uint256 rank)",
  "function getTopScores(uint256 count) external view returns (tuple(address player, uint256 score, uint256 timeCompleted, uint256 rank)[] memory)",
  "function getTopPlayer() external view returns (address topPlayer, uint256 topScore)",
  "function getPlayerCount() external view returns (uint256 count)",
  "event ScoreUpdated(address indexed player, uint256 score, uint256 timeCompleted, uint8 cluesFound)",
  "event GameCompleted(address indexed player, uint256 finalScore, uint256 timeCompleted)",
  "event NewTopScore(address indexed player, uint256 score)"
];

// Contract address (this would be the address of your deployed contract)
const LEADERBOARD_ADDRESS = "YOUR_CONTRACT_ADDRESS";

// Types for leaderboard data
export interface PlayerScore {
  score: number;
  timeCompleted: number;
  cluesFound: number;
  completedGame: boolean;
  rank: number;
}

export interface LeaderboardEntry {
  player: string;
  score: number;
  timeCompleted: number;
  rank: number;
}

// Import ethers dynamically to avoid SSR issues
let ethers: any;

/**
 * Hook to interact with the leaderboard contract
 */
export function useLeaderboardContract() {
  const [contract, setContract] = useState<any | null>(null);
  const [playerScore, setPlayerScore] = useState<PlayerScore | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topPlayer, setTopPlayer] = useState<{ address: string; score: number } | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the contract when the component mounts
  useEffect(() => {
    const initLibrary = async () => {
      // Dynamically import ethers to avoid SSR issues
      ethers = (await import('ethers')).ethers;
    };

    const initContract = async () => {
      try {
        await initLibrary();
        
        // Check if ethereum is available (MetaMask or similar)
        if (typeof window !== 'undefined' && window.ethereum) {
          // Create a provider from the browser's ethereum object
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          
          // Create a signer (the connected wallet)
          const signer = provider.getSigner();
          
          // Create the contract instance
          const leaderboardContract = new ethers.Contract(
            LEADERBOARD_ADDRESS,
            LEADERBOARD_ABI,
            signer
          );
          
          setContract(leaderboardContract);
        } else {
          setError("Ethereum provider not found. Please install MetaMask or another wallet.");
        }
      } catch (err: any) {
        setError(`Error initializing contract: ${err.message}`);
      }
    };

    initContract();
  }, []);

  /**
   * Get the current player's score
   */
  const getPlayerScore = async (playerAddress?: string) => {
    if (!contract) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // If no address provided, use the connected wallet
      const address = playerAddress || await contract.signer.getAddress();
      
      const scoreData = await contract.getPlayerScore(address);
      
      const playerScoreData: PlayerScore = {
        score: Number(scoreData.score),
        timeCompleted: Number(scoreData.timeCompleted),
        cluesFound: Number(scoreData.cluesFound),
        completedGame: scoreData.completedGame,
        rank: Number(scoreData.rank)
      };
      
      setPlayerScore(playerScoreData);
      return playerScoreData;
    } catch (err: any) {
      setError(`Error getting player score: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the top scores from the leaderboard
   * @param count Number of scores to retrieve
   */
  const getTopScores = async (count: number = 10) => {
    if (!contract) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const topScores = await contract.getTopScores(count);
      
      const formattedScores: LeaderboardEntry[] = topScores.map((entry: any) => ({
        player: entry.player,
        score: Number(entry.score),
        timeCompleted: Number(entry.timeCompleted),
        rank: Number(entry.rank)
      }));
      
      setLeaderboard(formattedScores);
      return formattedScores;
    } catch (err: any) {
      setError(`Error getting top scores: ${err.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the top player and their score
   */
  const getTopPlayer = async () => {
    if (!contract) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [address, score] = await contract.getTopPlayer();
      
      const topPlayerData = {
        address,
        score: Number(score)
      };
      
      setTopPlayer(topPlayerData);
      return topPlayerData;
    } catch (err: any) {
      setError(`Error getting top player: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update a player's score
   */
  const updatePlayerScore = async (
    score: number,
    timeCompleted: number,
    cluesFound: number,
    completedGame: boolean
  ) => {
    if (!contract) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the connected wallet address
      const playerAddress = await contract.signer.getAddress();
      
      // Send the transaction to update the score
      const tx = await contract.updatePlayerScore(
        playerAddress,
        score,
        timeCompleted,
        cluesFound,
        completedGame
      );
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      // Refresh the player's score
      await getPlayerScore(playerAddress);
      
      return true;
    } catch (err: any) {
      setError(`Error updating player score: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the total number of players
   */
  const getPlayerCount = async () => {
    if (!contract) return 0;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const count = await contract.getPlayerCount();
      setPlayerCount(Number(count));
      return Number(count);
    } catch (err: any) {
      setError(`Error getting player count: ${err.message}`);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  // Return the functions and state
  return {
    playerScore,
    leaderboard,
    topPlayer,
    playerCount,
    isLoading,
    error,
    getPlayerScore,
    getTopScores,
    getTopPlayer,
    updatePlayerScore,
    getPlayerCount
  };
}

/**
 * Component for displaying the top players on the leaderboard
 */
export function LeaderboardComponent() {
  const {
    leaderboard,
    getTopScores,
    isLoading,
    error
  } = useLeaderboardContract();

  useEffect(() => {
    getTopScores(10);
  }, [getTopScores]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
      
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-300 mt-2">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="text-red-400 p-3 bg-red-900/20 rounded">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700">
              <tr>
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center">No scores yet</td>
                </tr>
              ) : (
                leaderboard.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                    <td className="px-4 py-2">{entry.rank}</td>
                    <td className="px-4 py-2 font-mono">
                      {entry.player.substring(0, 6)}...{entry.player.substring(entry.player.length - 4)}
                    </td>
                    <td className="px-4 py-2">{entry.score.toLocaleString()}</td>
                    <td className="px-4 py-2">{formatTime(entry.timeCompleted)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 