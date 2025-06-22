# AI Narrative Game

An interactive storytelling game where the AI serves as both narrator and NPCs, with dynamic scenarios and reality-switching mechanics.

## Features

- AI-powered narration using Ollama with different models for narration and constraint checking
- Multiple interactive scenarios (Medieval Forest, Space Mission)
- Dynamic reality switching within scenarios
- Constraint checking to prevent game-breaking inputs
- WebSocket-based real-time interaction

## Prerequisites

- Node.js (v16+)
- Ollama installed and running locally (https://ollama.ai/)
- Ollama models: `llama3:8b` (for narration) and `llama3:3b` (for constraint checking)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file (see `.env.example`)
4. Make sure Ollama is running and the required models are downloaded:
   ```bash
   ollama pull llama3:8b
   ollama pull llama3:3b
   ```

## Running the Game

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Connect to the game using a WebSocket client at `ws://localhost:3000`

## Gameplay

- Type your actions and the AI will respond as the narrator
- Use `/help` to see available commands
- Type `/reality [name]` to switch between realities
- Interact with NPCs by typing `/talk [npc_name]`

## Project Structure

- `src/` - Main source code
  - `game/` - Game logic and state management
  - `scenarios/` - Game scenarios and content
  - `index.js` - Main server entry point

## License

ISC
