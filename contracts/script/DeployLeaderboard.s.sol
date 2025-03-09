// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/DetectiveGameLeaderboard.sol";

contract DeployLeaderboard is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the contract
        DetectiveGameLeaderboard leaderboard = new DetectiveGameLeaderboard();
        
        // Log the deployment address
        console.log("DetectiveGameLeaderboard deployed to:", address(leaderboard));

        // Stop broadcasting transactions
        vm.stopBroadcast();
    }
} 