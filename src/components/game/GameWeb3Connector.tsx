"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
// Fix ethers import and types
import * as ethersTypes from "ethers";
import useGameplay from "@/lib/use-gameplay";

// Import ABIs - Create functions to get ABIs to handle any import issues
const getGameLogicABI = () => {
  try {
    return require("@/contracts/GameLogic.json").abi;
  } catch (error) {
    console.error("Failed to load GameLogic ABI:", error);
    return [];
  }
};

const getClueNFTABI = () => {
  try {
    return require("@/contracts/ClueNFT.json").abi;
  } catch (error) {
    console.error("Failed to load ClueNFT ABI:", error);
    return [];
  }
};

const getMysteryTokenABI = () => {
  try {
    return require("@/contracts/MysteryToken.json").abi;
  } catch (error) {
    console.error("Failed to load MysteryToken ABI:", error);
    return [];
  }
};

// Contract addresses from environment
const GAME_LOGIC_ADDRESS = process.env.NEXT_PUBLIC_GAME_LOGIC_ADDRESS || "";
const CLUE_NFT_ADDRESS = process.env.NEXT_PUBLIC_CLUE_NFT_ADDRESS || "";
const MYSTERY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_MYSTERY_TOKEN_ADDRESS || "";

export function GameWeb3Connector() {
  // Access game context
  const { 
    currentScene, 
    discoveredClues,
    discoveredClueIds
  } = useGameplay();

  // Web3 state - Use any type to avoid ethers typing issues
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState<string>("");
  const [gameLogic, setGameLogic] = useState<any>(null);
  const [clueNFT, setClueNFT] = useState<any>(null);
  const [mysteryToken, setMysteryToken] = useState<any>(null);
  
  // UI state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>("0");

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window === 'undefined' || typeof window.ethereum === "undefined") {
      showFeedback("Please install MetaMask or another Web3 wallet");
      return;
    }

    try {
      setIsConnecting(true);
      
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      // Dynamically import ethers to avoid SSR issues
      const ethers = await import("ethers");
      
      // Create provider and signer
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      
      // Create contract instances
      const gameLogicContract = new ethers.Contract(
        GAME_LOGIC_ADDRESS,
        getGameLogicABI(),
        web3Signer
      );
      
      const clueNFTContract = new ethers.Contract(
        CLUE_NFT_ADDRESS,
        getClueNFTABI(),
        web3Signer
      );
      
      const mysteryTokenContract = new ethers.Contract(
        MYSTERY_TOKEN_ADDRESS,
        getMysteryTokenABI(),
        web3Signer
      );
      
      // Update state
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setGameLogic(gameLogicContract);
      setClueNFT(clueNFTContract);
      setMysteryToken(mysteryTokenContract);
      
      // Show success message
      showFeedback(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      
      // Update token balance
      await updateTokenBalance(mysteryTokenContract, address);
      
    } catch (error) {
      console.error("Error connecting wallet:", error);
      showFeedback("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Update token balance
  const updateTokenBalance = async (tokenContract: any, address: string) => {
    try {
      const balance = await tokenContract.balanceOf(address);
      // Dynamically import ethers to avoid SSR issues
      const ethers = await import("ethers");
      const formatted = ethers.utils.formatUnits(balance, 18);
      setTokenBalance(parseFloat(formatted).toFixed(2));
    } catch (error) {
      console.error("Error getting token balance:", error);
    }
  };
  
  // Mint clue as NFT
  const mintClueNFT = async (clueId: string) => {
    if (!gameLogic || !account) {
      showFeedback("Please connect your wallet first");
      return;
    }
    
    try {
      setIsMinting(true);
      
      // Check if already owned
      const alreadyOwned = await gameLogic.hasFoundClue(account, clueId);
      if (alreadyOwned) {
        showFeedback("You already own this clue NFT");
        return;
      }
      
      // Mint the clue
      const tx = await gameLogic.findClue(account, clueId);
      showFeedback("Minting clue NFT...");
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Update token balance
      if (mysteryToken) {
        await updateTokenBalance(mysteryToken, account);
      }
      
      showFeedback("Successfully minted clue NFT!");
    } catch (error) {
      console.error("Error minting clue NFT:", error);
      showFeedback("Failed to mint clue NFT");
    } finally {
      setIsMinting(false);
    }
  };
  
  // Complete scene on-chain
  const completeSceneOnChain = async () => {
    if (!gameLogic || !account || !currentScene) {
      showFeedback("Please connect your wallet first");
      return;
    }
    
    try {
      setIsCompleting(true);
      
      // Check if scene already completed
      const alreadyCompleted = await gameLogic.hasCompletedScene(account, currentScene.id);
      if (alreadyCompleted) {
        showFeedback("You've already completed this scene on-chain");
        return;
      }
      
      // Get current scene's clues
      const sceneClues = discoveredClues.filter(clue => clue.sceneId === currentScene.id);
      const cluesFoundInScene = sceneClues.filter(clue => discoveredClueIds.includes(clue.id)).length;
      
      // Complete the scene - hardcode totalSeconds from context if not available
      const totalSeconds = 300; // Placeholder
      
      const tx = await gameLogic.completeScene(
        account,
        currentScene.id,
        totalSeconds,
        cluesFoundInScene
      );
      
      showFeedback("Recording scene completion on blockchain...");
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Update token balance
      if (mysteryToken) {
        await updateTokenBalance(mysteryToken, account);
      }
      
      showFeedback(`Scene completed! You earned MYST tokens!`);
    } catch (error) {
      console.error("Error completing scene on blockchain:", error);
      showFeedback("Failed to complete scene on blockchain");
    } finally {
      setIsCompleting(false);
    }
  };
  
  // Update UI feedback
  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };
  
  // Get claimable clues from current scene
  const getClaimableClues = () => {
    if (!currentScene || !discoveredClueIds.length) return [];
    
    return discoveredClues
      .filter(clue => 
        clue.sceneId === currentScene.id && 
        discoveredClueIds.includes(clue.id)
      );
  };
  
  // Check if all clues in scene are found
  const areAllCluesFound = () => {
    if (!currentScene) return false;
    
    const sceneClues = discoveredClues.filter(clue => clue.sceneId === currentScene.id);
    return sceneClues.every(clue => discoveredClueIds.includes(clue.id));
  };

  // Listen for web3 events and update when wallet or scene changes
  useEffect(() => {
    if (mysteryToken && account) {
      updateTokenBalance(mysteryToken, account);
    }
  }, [mysteryToken, account, currentScene]);

  // Skip rendering on server
  if (typeof window === 'undefined') return null;

  // User interface
  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col items-end">
      {/* Connect Button */}
      {!account ? (
        <Button 
          size="sm" 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="bg-black/70 text-white hover:bg-black/90"
        >
          {isConnecting ? <><Spinner className="mr-2 h-4 w-4" /> Connecting...</> : "Connect Wallet"}
        </Button>
      ) : (
        <div className="bg-black/70 text-white px-3 py-2 rounded-md flex flex-col items-end">
          <div className="text-xs mb-1 text-gray-300">Connected</div>
          <div className="text-sm font-semibold">{account.slice(0, 6)}...{account.slice(-4)}</div>
          {tokenBalance !== "0" && (
            <div className="text-xs text-yellow-300 mt-1">{tokenBalance} MYST</div>
          )}
        </div>
      )}
      
      {/* Feedback Display */}
      {feedback && (
        <div className="mt-2 bg-black/70 text-white text-sm py-2 px-3 rounded-md max-w-md">
          {feedback}
        </div>
      )}
      
      {/* Blockchain Actions Panel (expands when connected) */}
      {account && currentScene && (
        <div className="mt-2 bg-black/70 text-white p-3 rounded-md w-64">
          <h3 className="text-sm font-bold mb-2">Blockchain Actions</h3>
          
          {/* Claimable Clues */}
          {getClaimableClues().length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium mb-1">Claim Clue NFTs:</h4>
              {getClaimableClues().map(clue => (
                <Button
                  key={clue.id}
                  size="sm"
                  variant="outline"
                  className="text-xs mb-1 w-full border-gray-500 justify-start"
                  disabled={isMinting}
                  onClick={() => mintClueNFT(clue.id)}
                >
                  {isMinting ? <Spinner className="mr-2 h-3 w-3" /> : "🔍 "}
                  Claim: {clue.name}
                </Button>
              ))}
            </div>
          )}
          
          {/* Complete Scene */}
          {areAllCluesFound() && (
            <Button
              size="sm"
              className="w-full mt-2"
              disabled={isCompleting}
              onClick={completeSceneOnChain}
            >
              {isCompleting ? <><Spinner className="mr-2 h-4 w-4" /> Recording...</> : "Complete Scene On-Chain"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default GameWeb3Connector; 