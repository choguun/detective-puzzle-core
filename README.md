# Mystery Room: The Detective's Case

An interactive narrative detective puzzle game powered by AI. Explore mysterious scenes, discover clues, and solve cases using your detective skills.

## Features

- **Dynamic Narrative**: AI-generated storylines and descriptions that create a unique experience each time
- **Interactive Investigation**: Explore scenes, discover clues, and examine evidence with intuitive UI
- **Detective's Notebook**: Take notes and track your progress as you solve the mystery
- **Branching Storylines**: Your choices influence the narrative and lead to different outcomes
- **Evidence Board**: Visualize connections between discovered clues
- **Adaptive Difficulty**: Game adjusts challenge level based on your progress
- **Atmospheric Design**: Immersive UI with detective-themed visual elements

## Tech Stack

- **Next.js**: React framework for building the web application
- **TypeScript**: Type-safe JavaScript for better development experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn UI**: Component library for beautiful UI elements
- **OpenAI API**: For generating dynamic narrative content
- **React Markdown**: For rendering formatted text content

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/detective-puzzle-core.git
   cd detective-puzzle-core
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   ./start-dev.sh
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Game Mechanics

- **Scene Exploration**: Navigate through different scenes with immersive visuals and descriptions
- **Clue Discovery**: Find and examine clues to uncover the truth with intuitive UI interactions
- **Note Taking**: Record your thoughts and theories in the detective's notebook
- **Evidence Board**: Visualize connections between discovered clues
- **Case Analysis**: Request AI-generated analysis of your discovered clues
- **Adaptive Hints**: Receive contextual hints based on your progress
- **Progress Tracking**: Monitor your investigation progress with visual indicators
- **Case Solving**: Piece together the evidence to solve the mystery

## Project Structure

- `src/app`: Next.js app router pages
- `src/components/game`: Game-specific components
- `src/components/ui`: Reusable UI components
- `src/lib`: Utility functions, game context providers, and custom hooks

## UI Features

- **Dark/Light Mode**: Toggle between light and dark themes for different atmospheres
- **Typewriter Effects**: Text appears gradually for an immersive reading experience
- **Parallax Effects**: Dynamic backgrounds that respond to mouse movement
- **Responsive Design**: Playable on desktop and mobile devices
- **Ambient UI Elements**: Detective-themed styling with paper textures and other thematic elements
- **Interactive Evidence Cards**: Visual representation of discovered clues with status indicators

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic detective fiction and mystery games
- Built with modern web technologies and AI capabilities

## Smart Contracts

This project includes a set of Ethereum smart contracts built with Foundry for managing game rewards and leaderboards:

- **DetectiveGameLeaderboard**: Tracks player progress, scores, and game completion status
- **MysteryToken**: ERC20 token awarded to players for completing scenes and the full game
- **GameLogic**: Manages game progression, scene completion, and token rewards

### Contract Features

- **Token Rewards**: Players earn MysteryTokens for completing scenes
- **Leaderboard**: Global leaderboard tracking top scores and completion times
- **Scene Management**: Game admins can add, update, and manage game scenes
- **Completion Bonuses**: Special rewards for completing the entire game
- **Score Calculation**: Scores calculated based on completion time and clues found

### Contract Development

The smart contracts are built using Foundry, a fast and flexible development framework for Ethereum.

1. Install Foundry:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. Build the contracts:
   ```bash
   cd contracts
   forge build
   ```

3. Run tests:
   ```bash
   forge test
   ```

4. Deploy the contracts:
   ```bash
   cp .env.example .env
   # Edit .env with your network details and private key
   forge script script/DeployGameContracts.s.sol --rpc-url <RPC_URL> --broadcast --verify
   ```

## Contract Architecture

- **MysteryToken**: ERC20 token with minting capabilities restricted to the GameLogic contract
- **GameLogic**: Central contract managing game progression, scene completion, and token rewards
- **DetectiveGameLeaderboard**: Stores player scores and game completion status
