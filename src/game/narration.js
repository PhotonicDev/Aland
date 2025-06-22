const { Ollama } = require('ollama');
const { streamOllamaResponse } = require('../utils/streaming');

/**
 * Generates a prompt for the narrator based on the current scenario, reality, and player's last action.
 * 
 * @param {string} scenario The current scenario.
 * @param {string} reality The current reality.
 * @param {string} input The player's last action.
 * @returns {string} The prompt for the narrator.
 */
const getNarrationPrompt = (scenario, reality, input) => {
  return `You are the narrator of an interactive story. Respond to the player's actions in a way that advances the narrative while maintaining the tone and setting of the current scenario.

Current Scenario: ${scenario || 'Unknown'}
Current Reality: ${reality || 'Default'}
Player's Last Action: "${input}"

Guidelines:
1. Stay in character as the game's narrator
2. Be descriptive but concise
3. React to the player's actions appropriately
4. Maintain consistency with the current scenario and reality
5. If the player's action is unclear, ask for clarification
6. If the action is impossible, explain why in a narrative way
7. If the action advances the story, describe the outcome

Respond with a JSON object containing:
{
  "narration": "Your narrative response to the player's action",
  "suggestedActions": ["suggested action 1", "suggested action 2", "..."],
  "gameStateChanges": {
    // Any changes to the game state (optional)
  }
}`;
};

/**
 * Applies changes to the game state.
 * 
 * @param {object} changes The changes to apply to the game state.
 * @param {object} gameState The current game state.
 */
const applyGameStateChanges = (changes, gameState) => {
  if (!gameState) {
    console.warn('No game state provided to apply changes to');
    return;
  }
  
  // Apply any changes to the game state
  // This is a simplified version - you'd want to add validation
  Object.entries(changes).forEach(([key, value]) => {
    // Simple deep merge for nested objects
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      gameState[key] = { ...(gameState[key] || {}), ...value };
    } else {
      gameState[key] = value;
    }
  });
};

/**
 * Generates narration based on the player's input and the current scenario and reality.
 * 
 * @param {string} input The player's input.
 * @param {Ollama} ollama The Ollama instance.
 * @param {string} scenario The current scenario.
 * @param {string} reality The current reality.
 * @param {object} gameState The current game state.
 * @returns {object} The generated narration.
 */
const generateNarration = async (input, ollama, scenario = null, reality = null, gameState = null) => {
  // If Ollama is not available, return a default response
  if (!ollama) {
    console.warn('Ollama not available, using default narration');
    return {
      type: 'NARRATION',
      narration: 'The narrator seems to be lost in thought... (Ollama service not available)',
      suggestedActions: ['Try again later', 'Check Ollama service'],
      timestamp: new Date().toISOString()
    };
  }

  // Validate input
  if (!input || typeof input !== 'string' || input.trim() === '') {
    return {
      type: 'NARRATION',
      narration: 'The narrator waits patiently for your input...',
      suggestedActions: ['Look around', 'Check inventory', 'Ask for help'],
      timestamp: new Date().toISOString()
    };
  }

  try {
    const prompt = getNarrationPrompt(scenario, reality, input);
    
    // Stream the response with real-time output
    console.log('\n'); // Add a newline before the narration starts
    const response = await streamOllamaResponse(
      ollama,
      {
        model: process.env.NARRATION_MODEL,
        messages: [
          { role: 'system', content: 'You are the narrator of an interactive story.' },
          { role: 'user', content: prompt }
        ],
        format: 'json',
        options: {
          temperature: 0.7,
          max_tokens: 300
        }
      },
    );

    // The response might be the message object or just the content
    let result = response;
    if (response.content && !response.narration) {
      // If we got a simple content response, convert it to our expected format
      try {
        result = JSON.parse(response.content);
      } catch (e) {
        // If it's not JSON, use it as the narration
        result = { narration: response.content };
      }
    }
    
    // Apply any game state changes if they exist and are valid
    if (result && typeof result === 'object' && result.gameStateChanges) {
      try {
        applyGameStateChanges(result.gameStateChanges, gameState);
      } catch (error) {
        console.error('Error applying game state changes:', error);
        // Continue with the response even if state changes fail
      }
    }

    return {
      type: 'NARRATION',
      narration: result.narration || 'The narrator pauses, considering your words...',
      suggestedActions: result.suggestedActions || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating narration:', error);
    return {
      type: 'ERROR',
      message: 'The narrator seems to be at a loss for words...',
      details: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = { generateNarration };
