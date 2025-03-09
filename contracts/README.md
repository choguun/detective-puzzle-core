# Detective Game Leaderboard Smart Contract

This directory contains a Solidity smart contract that implements a leaderboard system for the Detective Puzzle Game. The leaderboard tracks player scores, completion times, and rankings.

## Contract Features

- Track player scores, completion times, and number of clues found
- Keep track of whether players have completed the game
- Calculate player rankings based on scores
- Get the top player and their score
- Get a list of the top players for a leaderboard
- Get individual player statistics

## Project Structure

```
contracts/
├── src/                  # Contract source code
│   └── DetectiveGameLeaderboard.sol
├── script/               # Deployment scripts
│   └── DeployLeaderboard.s.sol
├── test/                 # Test scripts
│   └── LeaderboardTest.t.sol
└── README.md             # This file
```

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) (v14 or newer, for frontend integration)

## Setup

1. Install Foundry if you haven't already:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install OpenZeppelin contracts:

```bash
npm install @openzeppelin/contracts
```

3. Create a `.env` file in the root directory with the following variables (based on `.env.example`):

```
MAINNET_RPC_URL=your_mainnet_rpc_url
SEPOLIA_RPC_URL=your_sepolia_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
PRIVATE_KEY=your_wallet_private_key
```

## Compile the Contract

```bash
forge build
```

This will compile the contract and generate artifacts in the `contracts/out` directory.

## Run Tests

```bash
forge test
```

For more verbose output, add the `-v` flag (more v's for more verbosity):

```bash
forge test -vvv
```

## Deploy the Contract

### Local Development Network

First, start a local node:

```bash
anvil
```

Then deploy the contract:

```bash
forge script script/DeployLeaderboard.s.sol --fork-url http://localhost:8545 --broadcast
```

### Testnet (e.g., Sepolia)

```bash
forge script script/DeployLeaderboard.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

### Mainnet

```bash
forge script script/DeployLeaderboard.s.sol --rpc-url $MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

## Contract Interface

### Functions

- `updatePlayerScore(address player, uint256 score, uint256 timeCompleted, uint8 cluesFound, bool completedGame)`: Update a player's score
- `getPlayerScore(address player)`: Get a player's score and statistics
- `getTopScores(uint256 count)`: Get the top scores for the leaderboard
- `getTopPlayer()`: Get the top player and their score
- `getPlayerCount()`: Get the total number of registered players
- `pause()`: Pause the contract (owner only)
- `unpause()`: Unpause the contract (owner only)

### Events

- `ScoreUpdated(address indexed player, uint256 score, uint256 timeCompleted, uint8 cluesFound)`: Emitted when a player's score is updated
- `GameCompleted(address indexed player, uint256 finalScore, uint256 timeCompleted)`: Emitted when a player completes the game
- `NewTopScore(address indexed player, uint256 score)`: Emitted when a new top score is achieved

## Integration with Web Application

To interact with this contract from your web application, use the `leaderboard-contract.ts` file located in the `src/lib` directory. This file provides a React hook and component for interacting with the contract.

### Example Usage

```jsx
import { useLeaderboardContract, LeaderboardComponent } from '@/lib/leaderboard-contract';

function GameCompletionScreen({ score, timeCompleted, cluesFound }) {
  const { updatePlayerScore, isLoading, error } = useLeaderboardContract();
  
  const handleSubmitScore = async () => {
    await updatePlayerScore(score, timeCompleted, cluesFound, true);
  };
  
  return (
    <div>
      <h1>Congratulations!</h1>
      <p>Your score: {score}</p>
      <button onClick={handleSubmitScore} disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit Score to Leaderboard'}
      </button>
      {error && <p className="error">{error}</p>}
      
      <LeaderboardComponent />
    </div>
  );
}
```

## Security Considerations

- The contract uses OpenZeppelin's `Ownable` and `Pausable` contracts for security
- Only the contract owner can update player scores
- The contract can be paused in case of emergencies
- The contract uses simple sorting for rankings, which could be gas-intensive for large numbers of players
