// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DetectiveGameLeaderboard.sol";
import "../src/MysteryToken.sol";
import "../src/GameLogic.sol";
import "../src/ClueNFT.sol";

contract DeployGameContracts is Script {
    function run() external {
        // Get the deployer's private key from the environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the leaderboard contract
        DetectiveGameLeaderboard leaderboard = new DetectiveGameLeaderboard();
        console.log("DetectiveGameLeaderboard deployed at:", address(leaderboard));
        
        // Deploy the token contract
        MysteryToken token = new MysteryToken(deployer);
        console.log("MysteryToken deployed at:", address(token));
        
        // Deploy the ClueNFT contract with a base URI for metadata
        string memory baseURI = "https://detective-game.example.com/api/clue/";
        ClueNFT clueNFT = new ClueNFT(deployer, baseURI);
        console.log("ClueNFT deployed at:", address(clueNFT));
        
        // Deploy the game logic contract
        GameLogic gameLogic = new GameLogic(
            address(token),
            address(leaderboard),
            address(clueNFT),
            deployer
        );
        console.log("GameLogic deployed at:", address(gameLogic));
        
        // Set the game logic contract as the authorized minter for the token
        token.setGameLogicContract(address(gameLogic));
        console.log("Set GameLogic as authorized minter for MysteryToken");
        
        // Set the game logic contract as authorized for the leaderboard
        leaderboard.setGameLogicContract(address(gameLogic));
        console.log("Set GameLogic as authorized for Leaderboard");
        
        // Set the game logic contract as authorized for the ClueNFT
        clueNFT.setGameLogicContract(address(gameLogic));
        console.log("Set GameLogic as authorized minter for ClueNFT");
        
        // Add initial game scenes
        gameLogic.addScene("study", "Detective's Study", 10 * 10**18);
        gameLogic.addScene("library", "Old Library", 15 * 10**18);
        gameLogic.addScene("basement", "Hidden Basement", 25 * 10**18);
        console.log("Added initial game scenes");
        
        // Add initial clues to scenes
        uint256 clueId1 = clueNFT.addClue(
            "study", 
            "Mysterious Letter", 
            "A letter with cryptic handwriting found on the desk", 
            2, 
            string(abi.encodePacked(baseURI, "1"))
        );
        
        uint256 clueId2 = clueNFT.addClue(
            "study", 
            "Broken Watch", 
            "A pocket watch stopped at exactly 3:15", 
            3, 
            string(abi.encodePacked(baseURI, "2"))
        );
        
        uint256 clueId3 = clueNFT.addClue(
            "library", 
            "Bookmarked Page", 
            "A specific page marked in a book about ancient symbols", 
            3, 
            string(abi.encodePacked(baseURI, "3"))
        );
        
        uint256 clueId4 = clueNFT.addClue(
            "basement", 
            "Hidden Key", 
            "A small key hidden behind a loose brick", 
            4, 
            string(abi.encodePacked(baseURI, "4"))
        );
        
        console.log("Added initial clues to scenes");
        console.log("Clue ID 1:", clueId1);
        console.log("Clue ID 2:", clueId2);
        console.log("Clue ID 3:", clueId3);
        console.log("Clue ID 4:", clueId4);
        
        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
    }
} 