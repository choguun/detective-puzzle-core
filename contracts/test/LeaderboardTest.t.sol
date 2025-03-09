// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DetectiveGameLeaderboard.sol";

contract LeaderboardTest is Test {
    DetectiveGameLeaderboard leaderboard;
    address owner = address(1);
    address player1 = address(2);
    address player2 = address(3);
    address player3 = address(4);

    function setUp() public {
        // Deploy the contract with owner as the owner
        vm.prank(owner);
        leaderboard = new DetectiveGameLeaderboard();
    }

    function testUpdatePlayerScore() public {
        // Update player1's score as the owner
        vm.prank(owner);
        leaderboard.updatePlayerScore(player1, 100, 300, 5, true);

        // Get player1's score and verify it
        vm.prank(player1);
        (uint256 score, uint256 time, uint8 clues, bool completed, uint256 rank) = leaderboard.getPlayerScore(player1);
        
        assertEq(score, 100);
        assertEq(time, 300);
        assertEq(clues, 5);
        assertTrue(completed);
        assertEq(rank, 1);
    }

    function testGetTopScores() public {
        // Add multiple players with different scores
        vm.startPrank(owner);
        leaderboard.updatePlayerScore(player1, 100, 300, 5, true);
        leaderboard.updatePlayerScore(player2, 200, 250, 6, true);
        leaderboard.updatePlayerScore(player3, 150, 275, 7, true);
        vm.stopPrank();

        // Get top 3 scores
        DetectiveGameLeaderboard.LeaderboardEntry[] memory entries = leaderboard.getTopScores(3);
        
        // Verify rankings
        assertEq(entries.length, 3);
        assertEq(entries[0].player, player2); // Highest score should be first
        assertEq(entries[0].score, 200);
        assertEq(entries[0].rank, 1);
        
        assertEq(entries[1].player, player3); // Second highest next
        assertEq(entries[1].score, 150);
        assertEq(entries[1].rank, 2);
        
        assertEq(entries[2].player, player1); // Lowest score last
        assertEq(entries[2].score, 100);
        assertEq(entries[2].rank, 3);
    }

    function testGetTopPlayer() public {
        // Add multiple players with different scores
        vm.startPrank(owner);
        leaderboard.updatePlayerScore(player1, 100, 300, 5, true);
        leaderboard.updatePlayerScore(player2, 200, 250, 6, true);
        vm.stopPrank();

        // Check top player
        (address topPlayer, uint256 topScore) = leaderboard.getTopPlayer();
        assertEq(topPlayer, player2);
        assertEq(topScore, 200);

        // Update player1 to have the highest score
        vm.prank(owner);
        leaderboard.updatePlayerScore(player1, 300, 300, 5, true);

        // Check top player again
        (topPlayer, topScore) = leaderboard.getTopPlayer();
        assertEq(topPlayer, player1);
        assertEq(topScore, 300);
    }

    function testPause() public {
        // Pause the contract as owner
        vm.prank(owner);
        leaderboard.pause();

        // Try to update a score while paused (should revert)
        vm.prank(owner);
        vm.expectRevert("Pausable: paused");
        leaderboard.updatePlayerScore(player1, 100, 300, 5, true);

        // Unpause the contract
        vm.prank(owner);
        leaderboard.unpause();

        // Now should be able to update
        vm.prank(owner);
        leaderboard.updatePlayerScore(player1, 100, 300, 5, true);
    }

    function testOnlyOwnerCanUpdate() public {
        // Try to update as non-owner (should revert)
        vm.prank(player1);
        vm.expectRevert();
        leaderboard.updatePlayerScore(player1, 100, 300, 5, true);

        // Update as owner (should succeed)
        vm.prank(owner);
        leaderboard.updatePlayerScore(player1, 100, 300, 5, true);
    }
} 