// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ClueNFT.sol";

contract ClueNFTTest is Test {
    ClueNFT clueNFT;
    address owner = address(1);
    address gameLogic = address(2);
    address player = address(3);
    
    string baseURI = "https://detective-game.example.com/api/clue/";
    
    function setUp() public {
        vm.prank(owner);
        clueNFT = new ClueNFT(owner, baseURI);
    }
    
    function testInitialState() public view {
        assertEq(clueNFT.owner(), owner);
    }
    
    function testSetGameLogicContract() public {
        vm.prank(owner);
        clueNFT.setGameLogicContract(gameLogic);
        
        assertEq(clueNFT.getGameLogicContract(), gameLogic);
    }
    
    function testNonOwnerCannotSetGameLogic() public {
        vm.prank(player);
        vm.expectRevert();
        clueNFT.setGameLogicContract(gameLogic);
    }
    
    function testCannotSetZeroAddressAsGameLogic() public {
        vm.prank(owner);
        vm.expectRevert("ClueNFT: game logic cannot be zero address");
        clueNFT.setGameLogicContract(address(0));
    }
    
    function testAddClue() public {
        vm.prank(owner);
        uint256 clueId = clueNFT.addClue(
            "study", 
            "Mysterious Letter", 
            "A letter with cryptic handwriting", 
            2, 
            "ipfs://QmExample"
        );
        
        assertEq(clueId, 1);
        
        (string memory name, string memory sceneId, string memory description, uint8 difficulty) = 
            clueNFT.getClueMetadata(clueId);
            
        assertEq(name, "Mysterious Letter");
        assertEq(sceneId, "study");
        assertEq(description, "A letter with cryptic handwriting");
        assertEq(difficulty, 2);
    }
    
    function testUpdateClue() public {
        // Add a clue
        vm.startPrank(owner);
        uint256 clueId = clueNFT.addClue(
            "study", 
            "Mysterious Letter", 
            "A letter with cryptic handwriting", 
            2, 
            "ipfs://QmExample"
        );
        
        // Update the clue
        clueNFT.updateClue(
            clueId,
            "Updated Letter",
            "Updated description",
            3,
            "ipfs://QmUpdated"
        );
        vm.stopPrank();
        
        // Verify the update
        (string memory name, string memory sceneId, string memory description, uint8 difficulty) = 
            clueNFT.getClueMetadata(clueId);
            
        assertEq(name, "Updated Letter");
        assertEq(sceneId, "study"); // Scene ID doesn't change
        assertEq(description, "Updated description");
        assertEq(difficulty, 3);
    }
    
    function testGetSceneClues() public {
        // Add multiple clues to the same scene
        vm.startPrank(owner);
        uint256 clueId1 = clueNFT.addClue("study", "Clue 1", "Description 1", 2, "uri1");
        uint256 clueId2 = clueNFT.addClue("study", "Clue 2", "Description 2", 3, "uri2");
        uint256 clueId3 = clueNFT.addClue("library", "Clue 3", "Description 3", 4, "uri3");
        vm.stopPrank();
        
        // Get clues for the study scene
        uint256[] memory studyClues = clueNFT.getSceneClues("study");
        
        // Verify the clues
        assertEq(studyClues.length, 2);
        assertEq(studyClues[0], clueId1);
        assertEq(studyClues[1], clueId2);
        
        // Get clues for the library scene
        uint256[] memory libraryClues = clueNFT.getSceneClues("library");
        
        // Verify the clues
        assertEq(libraryClues.length, 1);
        assertEq(libraryClues[0], clueId3);
    }
    
    function testMintClue() public {
        // Add a clue
        vm.prank(owner);
        uint256 clueId = clueNFT.addClue("study", "Test Clue", "Description", 2, "uri");
        
        // Set game logic contract
        vm.prank(owner);
        clueNFT.setGameLogicContract(gameLogic);
        
        // Mint the clue to a player
        vm.prank(gameLogic);
        clueNFT.mintClue(player, clueId);
        
        // Verify the player owns the clue
        assertEq(clueNFT.balanceOf(player, clueId), 1);
        assertTrue(clueNFT.hasClue(player, clueId));
    }
    
    function testOnlyGameLogicCanMint() public {
        // Add a clue
        vm.prank(owner);
        uint256 clueId = clueNFT.addClue("study", "Test Clue", "Description", 2, "uri");
        
        // Set game logic contract
        vm.prank(owner);
        clueNFT.setGameLogicContract(gameLogic);
        
        // Try to mint from non-game-logic address
        vm.prank(owner);
        vm.expectRevert("ClueNFT: caller is not the game logic contract");
        clueNFT.mintClue(player, clueId);
    }
    
    function testCannotMintNonExistentClue() public {
        // Set game logic contract
        vm.prank(owner);
        clueNFT.setGameLogicContract(gameLogic);
        
        // Try to mint a non-existent clue
        vm.prank(gameLogic);
        vm.expectRevert("ClueNFT: clue does not exist");
        clueNFT.mintClue(player, 999);
    }
    
    function testGetPlayerClueCount() public {
        // Add multiple clues
        vm.startPrank(owner);
        uint256 clueId1 = clueNFT.addClue("study", "Clue 1", "Description 1", 2, "uri1");
        uint256 clueId2 = clueNFT.addClue("study", "Clue 2", "Description 2", 3, "uri2");
        uint256 clueId3 = clueNFT.addClue("library", "Clue 3", "Description 3", 4, "uri3");
        
        // Set game logic contract
        clueNFT.setGameLogicContract(gameLogic);
        vm.stopPrank();
        
        // Mint some clues to the player
        vm.startPrank(gameLogic);
        clueNFT.mintClue(player, clueId1);
        clueNFT.mintClue(address(9), clueId2);
        clueNFT.mintClue(player, clueId3);
        vm.stopPrank();
        
        // Check the player's clue count
        assertEq(clueNFT.getPlayerClueCount(player), 2);
        assertEq(clueNFT.getPlayerClueCount(address(9)), 1);
    }
    
    function testPause() public {
        // Add a clue
        vm.prank(owner);
        uint256 clueId = clueNFT.addClue("study", "Test Clue", "Description", 2, "uri");
        
        // Set game logic contract
        vm.startPrank(owner);
        clueNFT.setGameLogicContract(gameLogic);
        
        // Pause the contract
        clueNFT.pause();
        vm.stopPrank();
        
        // Try to mint while paused
        vm.prank(gameLogic);
        vm.expectRevert();
        clueNFT.mintClue(player, clueId);
        
        // Unpause
        vm.prank(owner);
        clueNFT.unpause();
        
        // Should be able to mint now
        vm.prank(gameLogic);
        clueNFT.mintClue(player, clueId);
        
        assertEq(clueNFT.balanceOf(player, clueId), 1);
    }
} 