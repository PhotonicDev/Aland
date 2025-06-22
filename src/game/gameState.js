const { loadScenario } = require('./scenarios');
const { generateNarration } = require('./narration');

const gameState = {
  currentScenario: null,
  currentReality: null,
  player: {
    name: 'Adventurer',
    inventory: [],
    health: 100,
    position: { x: 0, y: 0 }
  },
  npcs: {},
  flags: {},
  history: [],
  isInDialogue: false,
  currentNpc: null
};

const initializeGame = async (initialScenario = null, ollama = null) => {
  try {
    // Load initial scenario
    const scenarioName = initialScenario || process.env.INITIAL_SCENARIO || 'medieval_forest';
    await switchScenario(scenarioName);
    console.log(`Game initialized with scenario: ${scenarioName}`);
    
    // Generate and return initial narration if Ollama is available
    if (ollama) {
      try {
        const scenario = await loadScenario(scenarioName);
        const initialNarration = await generateNarration(
          `Begin the story with a short, mysterious narration setting up the ${scenario.name} scenario. ` +
          `Describe the environment in an intriguing way that makes the player want to explore. ` +
          `Keep it under 100 words.`,
          ollama,
          scenario.name,
          scenario.initialReality,
          gameState  // Pass the game state for any potential modifications
        );
        
        // Ensure we have a valid narration object
        if (initialNarration && typeof initialNarration === 'object') {
          return { 
            type: 'NARRATION',
            narration: initialNarration.narration || 'You find yourself in an unknown place...',
            suggestedActions: Array.isArray(initialNarration.suggestedActions) 
              ? initialNarration.suggestedActions 
              : []
          };
        }
      } catch (error) {
        console.error('Error generating initial narration:', error);
        // Fall through to default narration
      }
    }
    return null;
  } catch (error) {
    console.error('Error initializing game:', error);
    throw error;
  }
};

const switchScenario = async (scenarioId) => {
  try {
    const scenario = await loadScenario(scenarioId);
    gameState.currentScenario = scenarioId;
    gameState.currentReality = scenario.initialReality;
    gameState.npcs = scenario.npcs || {};
    gameState.flags = scenario.initialFlags || {};
    gameState.history = [];
    return scenario;
  } catch (error) {
    console.error(`Error loading scenario ${scenarioId}:`, error);
    throw error;
  }
};

const switchReality = (realityId) => {
  if (!gameState.currentScenario) {
    throw new Error('No active scenario to switch realities in');
  }
  
  // Check if the requested reality exists in the current scenario
  const scenario = require(`../scenarios/${gameState.currentScenario}.js`);
  if (!scenario.realities || !scenario.realities[realityId]) {
    throw new Error(`Reality '${realityId}' not found in current scenario`);
  }
  
  gameState.currentReality = realityId;
  return {
    success: true,
    message: `Reality shifted to ${realityId}`,
    reality: realityId
  };
};

module.exports = {
  gameState,
  switchScenario,
  switchReality,
  initializeGame
};
