// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MysteryToken.sol";

contract MysteryTokenTest is Test {
    MysteryToken token;
    address owner = address(1);
    address gameLogic = address(2);
    address player = address(3);

    function setUp() public {
        // Deploy the contract with owner as the owner
        vm.prank(owner);
        token = new MysteryToken(owner);
    }

    function testInitialState() public view {
        assertEq(token.name(), "Mystery Token");
        assertEq(token.symbol(), "MSTY");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0);
        assertEq(token.maxSupply(), 1_000_000 * 10**18);
        assertEq(token.owner(), owner);
    }

    function testSetGameLogicContract() public {
        // Only owner can set game logic contract
        vm.prank(owner);
        token.setGameLogicContract(gameLogic);
        
        assertEq(token.getGameLogicContract(), gameLogic);
    }

    function testNonOwnerCannotSetGameLogic() public {
        // Non-owner should not be able to set game logic contract
        vm.prank(player);
        vm.expectRevert();
        token.setGameLogicContract(gameLogic);
    }

    function testCannotSetZeroAddressAsGameLogic() public {
        // Cannot set zero address as game logic
        vm.prank(owner);
        vm.expectRevert("MysteryToken: zero address");
        token.setGameLogicContract(address(0));
    }

    function testMinting() public {
        // Set up game logic contract
        vm.prank(owner);
        token.setGameLogicContract(gameLogic);
        
        // Mint tokens as game logic
        vm.prank(gameLogic);
        token.mint(player, 100 * 10**18);
        
        assertEq(token.balanceOf(player), 100 * 10**18);
        assertEq(token.totalSupply(), 100 * 10**18);
    }

    function testOnlyGameLogicCanMint() public {
        // Set up game logic contract
        vm.prank(owner);
        token.setGameLogicContract(gameLogic);
        
        // Try to mint as non-game-logic
        vm.prank(player);
        vm.expectRevert("MysteryToken: caller is not the game logic contract");
        token.mint(player, 100 * 10**18);
    }

    function testCannotMintToZeroAddress() public {
        // Set up game logic contract
        vm.prank(owner);
        token.setGameLogicContract(gameLogic);
        
        // Try to mint to zero address
        vm.prank(gameLogic);
        vm.expectRevert("MysteryToken: mint to the zero address");
        token.mint(address(0), 100 * 10**18);
    }

    function testCannotExceedMaxSupply() public {
        // Set up game logic contract
        vm.prank(owner);
        token.setGameLogicContract(gameLogic);
        
        // Try to mint more than max supply
        vm.prank(gameLogic);
        vm.expectRevert("MysteryToken: max supply exceeded");
        token.mint(player, 1_000_001 * 10**18);
    }

    function testPause() public {
        // Set game logic contract
        vm.startPrank(owner);
        token.setGameLogicContract(gameLogic);
        
        // Pause the token
        token.pause();
        
        vm.stopPrank();
        
        // Try to mint while paused
        vm.prank(gameLogic);
        vm.expectRevert();
        token.mint(player, 100 * 10**18);
        
        // Unpause
        vm.prank(owner);
        token.unpause();
        
        // Should be able to mint now
        vm.prank(gameLogic);
        token.mint(player, 100 * 10**18);
        
        assertEq(token.balanceOf(player), 100 * 10**18);
    }
} 