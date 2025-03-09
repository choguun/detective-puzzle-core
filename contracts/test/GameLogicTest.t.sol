// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GameLogic.sol";
import "../src/MysteryToken.sol";
import "../src/DetectiveGameLeaderboard.sol";
import "../src/ClueNFT.sol";

contract GameLogicTest is Test {
    GameLogic gameLogic;
    MysteryToken token;
    DetectiveGameLeaderboard leaderboard;
    ClueNFT clueNFT;
    
    address owner = address(1);
    address admin = address(2);
    address player1 = address(3);
    address player2 = address(4);
    
    string baseURI = "https://detective-game.example.com/api/clue/";
    uint256 clueId1;
    uint256 clueId2;

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy token
        token = new MysteryToken(owner);
        
        // Deploy leaderboard
        leaderboard = new DetectiveGameLeaderboard();
        
        // Deploy ClueNFT
        clueNFT = new ClueNFT(owner, baseURI);
        
        // Deploy game logic
        gameLogic = new GameLogic(
            address(token),
            address(leaderboard),
            address(clueNFT),
            owner
        );
        
        // Set game logic as authorized minter for token
        token.setGameLogicContract(address(gameLogic));
        
        // Set game logic as authorized for leaderboard
        leaderboard.setGameLogicContract(address(gameLogic));
        
        // Set game logic as authorized for ClueNFT
        clueNFT.setGameLogicContract(address(gameLogic));
        
        // Add admin
        gameLogic.addAdmin(admin);
        
        // Add a scene
        gameLogic.addScene("study", "Detective's Study", 10 * 10**18);
        
        // Add clues to the scene
        clueId1 = clueNFT.addClue(
            "study", 
            "Mysterious Letter", 
            "A letter with cryptic handwriting", 
            2, 
            "ipfs://QmExample1"
        );
        
        clueId2 = clueNFT.addClue(
            "study", 
            "Broken Watch", 
            "A pocket watch stopped at exactly 3:15", 
            3, 
            "ipfs://QmExample2"
        );
        
        vm.stopPrank();
    }

    function testAddScene() public {
        // Add a scene as owner
        vm.prank(owner);
        gameLogic.addScene("library", "Old Library", 15 * 10**18);
        
        // Verify scene was added
        (string memory id, string memory name, uint256 rewardAmount, bool active) = gameLogic.scenes("library");
        assertEq(id, "library");
        assertEq(name, "Old Library");
        assertEq(rewardAmount, 15 * 10**18);
        assertTrue(active);
    }

    function testAddSceneAsAdmin() public {
        // Add a scene as admin
        vm.prank(admin);
        gameLogic.addScene("library", "Old Library", 15 * 10**18);
        
        // Verify scene was added
        (string memory id, string memory name, uint256 rewardAmount, bool active) = gameLogic.scenes("library");
        assertEq(id, "library");
        assertEq(name, "Old Library");
        assertEq(rewardAmount, 15 * 10**18);
        assertTrue(active);
    }

    function testNonAdminCannotAddScene() public {
        // Try to add a scene as non-admin
        vm.prank(player1);
        vm.expectRevert("GameLogic: caller is not an admin or owner");
        gameLogic.addScene("library", "Old Library", 15 * 10**18);
    }

    function testUpdateScene() public {
        // Update the scene
        vm.prank(owner);
        gameLogic.updateScene("study", "Updated Study Name", 20 * 10**18, false);
        
        // Verify scene was updated
        (string memory id, string memory name, uint256 rewardAmount, bool active) = gameLogic.scenes("study");
        assertEq(id, "study");
        assertEq(name, "Updated Study Name");
        assertEq(rewardAmount, 20 * 10**18);
        assertFalse(active);
    }

    function testCompleteScene() public {
        // Complete the scene as admin
        vm.prank(admin);
        gameLogic.completeScene(player1, "study", 250, 5);
        
        // Check player completed the scene
        assertTrue(gameLogic.hasCompletedScene(player1, "study"));
        
        // Check player received the reward (10 tokens for scene + 100 tokens bonus for completing the game)
        // Since there's only one scene, completing it also completes the game
        assertEq(token.balanceOf(player1), 110 * 10**18);
        assertEq(gameLogic.playerRewards(player1), 110 * 10**18);
        
        // Check leaderboard was updated
        (,uint256 time, uint8 clues, bool completed, ) = leaderboard.getPlayerScore(player1);
        assertEq(time, 250);
        assertEq(clues, 5);
        assertTrue(completed); // Game is fully completed since there's only one scene
    }

    function testCannotCompleteSceneTwice() public {
        // Complete the scene
        vm.prank(admin);
        gameLogic.completeScene(player1, "study", 250, 5);
        
        // Try to complete the same scene again
        vm.prank(admin);
        vm.expectRevert("GameLogic: scene already completed by player");
        gameLogic.completeScene(player1, "study", 250, 5);
    }

    function testCompleteGame() public {
        // Add more scenes
        vm.startPrank(owner);
        gameLogic.addScene("library", "Old Library", 15 * 10**18);
        gameLogic.addScene("basement", "Hidden Basement", 25 * 10**18);
        vm.stopPrank();
        
        // Complete all scenes
        vm.startPrank(admin);
        gameLogic.completeScene(player1, "study", 250, 5);
        gameLogic.completeScene(player1, "library", 300, 6);
        gameLogic.completeScene(player1, "basement", 400, 7);
        vm.stopPrank();
        
        // Check game completion
        assertTrue(gameLogic.gameCompleted(player1));
        
        // Check total rewards (10 + 15 + 25 + 100 bonus)
        assertEq(gameLogic.playerRewards(player1), 150 * 10**18);
        assertEq(token.balanceOf(player1), 150 * 10**18);
        
        // Check leaderboard was updated to show game completion
        (, , , bool completed, ) = leaderboard.getPlayerScore(player1);
        assertTrue(completed);
    }

    function testCalculateScore() public view {
        // Test score calculation
        
        // Fast completion with many clues
        uint256 score1 = gameLogic.calculateScore(150, 8);
        // Base 1000 + time bonus (300-150=150) + clue bonus (8*100=800) = 1950
        assertEq(score1, 1950);
        
        // Slow completion with few clues
        uint256 score2 = gameLogic.calculateScore(500, 2);
        // Base 1000 + time bonus (0) + clue bonus (2*100=200) = 1200
        assertEq(score2, 1200);
    }

    function testPause() public {
        // Pause the contract
        vm.prank(owner);
        gameLogic.pause();
        
        // Try to complete a scene while paused
        vm.prank(admin);
        vm.expectRevert();
        gameLogic.completeScene(player1, "study", 250, 5);
        
        // Unpause the contract
        vm.prank(owner);
        gameLogic.unpause();
        
        // Should be able to complete scene now
        vm.prank(admin);
        gameLogic.completeScene(player1, "study", 250, 5);
        
        assertTrue(gameLogic.hasCompletedScene(player1, "study"));
    }

    function testAdminManagement() public {
        // Add a new admin
        vm.prank(owner);
        gameLogic.addAdmin(player2);
        
        // Verify player2 is an admin
        assertTrue(gameLogic.gameAdmins(player2));
        
        // Remove admin
        vm.prank(owner);
        gameLogic.removeAdmin(player2);
        
        // Verify player2 is no longer an admin
        assertFalse(gameLogic.gameAdmins(player2));
    }

    function testNonOwnerCannotManageAdmins() public {
        // Try to add admin as non-owner
        vm.prank(admin);
        vm.expectRevert();
        gameLogic.addAdmin(player2);
        
        // Try to remove admin as non-owner
        vm.prank(player1);
        vm.expectRevert();
        gameLogic.removeAdmin(admin);
    }
    
    function testFindClue() public {
        // Find a clue as admin
        vm.prank(admin);
        gameLogic.findClue(player1, clueId1);
        
        // Check player found the clue
        assertTrue(gameLogic.hasFoundClue(player1, clueId1));
        
        // Check player received the clue NFT
        assertEq(clueNFT.balanceOf(player1, clueId1), 1);
        assertTrue(clueNFT.hasClue(player1, clueId1));
    }
    
    function testCannotFindClueAgain() public {
        // Find a clue
        vm.prank(admin);
        gameLogic.findClue(player1, clueId1);
        
        // Try to find the same clue again
        vm.prank(admin);
        vm.expectRevert("GameLogic: clue already found by player");
        gameLogic.findClue(player1, clueId1);
    }
    
    function testGetCluesFoundInScene() public {
        // Find multiple clues
        vm.startPrank(admin);
        gameLogic.findClue(player1, clueId1);
        gameLogic.findClue(player1, clueId2);
        vm.stopPrank();
        
        // Check clues found in scene
        assertEq(gameLogic.getCluesFoundInScene(player1, "study"), 2);
    }
    
    function testNonAdminCannotFindClue() public {
        // Try to find a clue as non-admin
        vm.prank(player1);
        vm.expectRevert("GameLogic: caller is not an admin or owner");
        gameLogic.findClue(player1, clueId1);
    }
} 