const { gameState, switchReality } = require('./gameState');
const { checkConstraints } = require('./constraintChecker');
const { generateNarration } = require('./narration');

const handleUserInput = async (input, ollama) => {
  try {
    // Check if Ollama is available (only for narration, not for simple commands)
    if (!ollama && !input.trim().startsWith('/')) {
      return {
        type: 'ERROR',
        message: 'Ollama service is not available. Some features may be limited.'
      };
    }

    // If input is empty, show help
    if (!input || input.trim() === '') {
      return handleCommand({ command: 'help' }, ollama);
    }

    // Check if input might be trying to break constraints (only for non-command input)
    if (!input.trim().startsWith('/')) {
      const constraintCheck = await checkConstraints(input, ollama);
      if (constraintCheck.violation) {
        return {
          type: 'WARNING',
          message: `⚠️ ${constraintCheck.message}`,
          originalInput: input
        };
      }
    }
    
    // Process the input (this will handle both commands and narration)
    return await processNarration(input, ollama);
  } catch (error) {
    console.error('Error handling user input:', error);
    return {
      type: 'ERROR',
      message: 'An error occurred while processing your input.',
      details: error.message
    };
  }
};

// Helper function to handle commands
const handleCommand = async ({ command, args = [] }, ollama) => {
  switch (command) {
    case 'reality':
      if (!args.length) {
        return { type: 'INFO', message: `Current reality: ${gameState.currentReality}` };
      }
      try {
        const result = switchReality(args[0]);
        return { type: 'SUCCESS', ...result };
      } catch (error) {
        return { type: 'ERROR', message: error.message };
      }
    
    case 'help':
      return {
        type: 'HELP',
        commands: [
          { command: '/reality [name]', description: 'Switch to a different reality' },
          { command: '/help', description: 'Show this help message' },
          { command: '/inventory', description: 'Show your inventory' },
          { command: '/talk [npc]', description: 'Start talking to an NPC' }
        ]
      };

    case 'inventory':
      return {
        type: 'INVENTORY',
        items: [...gameState.player.inventory]
      };

    default:
      return { type: 'ERROR', message: `Unknown command: ${command}. Type /help for a list of commands.` };
  }
};

module.exports = { handleUserInput, handleCommand };

const parseCommand = (input) => {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const [command, ...args] = trimmed.slice(1).split(' ');
  return { command: command.toLowerCase(), args };
};

const processNarration = async (input, ollama) => {
  // Check for commands first
  const command = parseCommand(input);
  if (command) {
    return await handleCommand(command, ollama);
  }

  // If in dialogue with an NPC, handle that
  if (gameState.isInDialogue && gameState.currentNpc) {
    return handleNpcDialogue(input, ollama);
  }

  // Otherwise, generate regular narration
  return await generateNarration(
    input, 
    ollama, 
    gameState.currentScenario, 
    gameState.currentReality, 
    gameState
  );
};

const handleNpcDialogue = async (input, ollama) => {
  // Implementation for NPC dialogue handling
  // This would use the NPC's specific prompt and personality
  return {
    type: 'DIALOGUE',
    npc: gameState.currentNpc,
    message: 'NPC dialogue response will be implemented here.'
  };
};
