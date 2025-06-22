const readline = require('readline');
const { Ollama } = require('ollama');
const dotenv = require('dotenv');
const { gameState, initializeGame } = require('./game/gameState');
const { handleUserInput } = require('./game/inputHandler');

dotenv.config();

// Initialize Ollama with error handling
let ollama;
try {
  ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL });
  console.log('Ollama initialized successfully');
} catch (error) {
  console.error('Failed to initialize Ollama:', error.message);
  console.log('Running in limited mode - AI features will be disabled');
}

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

// Initialize the game and get initial narration
initializeGame(null, ollama)
  .then(initialNarration => {
    console.log('Welcome to the AI Narrative Game!');
    console.log('Type /help for available commands.\n');
    
    if (initialNarration) {
      console.log(initialNarration.narration);
      if (initialNarration.suggestedActions && initialNarration.suggestedActions.length > 0) {
        console.log('\nYou could try:');
        initialNarration.suggestedActions.forEach((action, index) => {
          console.log(`${index + 1}. ${action}`);
        });
      }
      console.log('');
    } else {
      console.log('You find yourself in an unknown place...\n');
    }
    
    // Start the game loop
    rl.prompt();
    
    // Handle user input
    rl.on('line', async (input) => {
      try {
        const response = await handleUserInput(input.trim(), ollama);
        
        // Display the response
        if (response && response.type === 'NARRATION') {
          console.log('\n' + response.narration);
          if (response.suggestedActions && response.suggestedActions.length > 0) {
            console.log('\nYou can try:');
            response.suggestedActions.forEach(action => console.log(`- ${action}`));
          }
        } else if (response && response.type === 'ERROR') {
          console.error('\nError:', response.message);
          if (response.details) {
            console.error('Details:', response.details);
          }
        } else if (response) {
          console.log('\n', response);
        }
        
        console.log('');
      } catch (error) {
        console.error('\nAn error occurred:', error.message);
      }
      
      rl.prompt();
    });
  })
  .catch(error => {
    console.error('Failed to initialize game:', error);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nThanks for playing! Goodbye!');
  process.exit(0);
});
