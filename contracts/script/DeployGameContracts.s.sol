// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DetectiveGameLeaderboard.sol";
import "../src/MysteryToken.sol";
import "../src/GameLogic.sol";

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
        
        // Deploy the game logic contract
        GameLogic gameLogic = new GameLogic(
            address(token),
            address(leaderboard),
            deployer
        );
        console.log("GameLogic deployed at:", address(gameLogic));
        
        // Set the game logic contract as the authorized minter for the token
        token.setGameLogicContract(address(gameLogic));
        console.log("Set GameLogic as authorized minter for MysteryToken");
        
        // Set the game logic contract as authorized for the leaderboard
        leaderboard.setGameLogicContract(address(gameLogic));
        console.log("Set GameLogic as authorized for Leaderboard");
        
        // Add initial game scenes
        gameLogic.addScene("study", "Detective's Study", 10 * 10**18);
        gameLogic.addScene("library", "Old Library", 15 * 10**18);
        gameLogic.addScene("basement", "Hidden Basement", 25 * 10**18);
        console.log("Added initial game scenes");
        
        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        console.log("Deployment completed successfully!");
    }
} 