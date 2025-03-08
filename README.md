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
