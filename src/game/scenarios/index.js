const path = require('path');

const SCENARIOS = {
  medieval_forest: {
    id: 'medieval_forest',
    name: 'The Enchanted Forest',
    description: 'A mystical forest filled with magic and mystery.',
    initialReality: 'daylight',
    initialFlags: {
      hasMetGuide: false,
      foundAncientArtifact: false
    },
    npcs: {
      old_hermit: {
        name: 'Old Hermit',
        description: 'A wise but reclusive hermit who knows the forest well.',
        personality: 'Eccentric but kind, speaks in riddles',
        initialDialogue: 'Ah, a traveler in these ancient woods. What brings you here?',
        location: 'forest_clearing'
      },
      // Add more NPCs as needed
    },
    realities: {
      daylight: {
        description: 'The forest is bathed in warm sunlight filtering through the leaves.',
        availableActions: ['explore', 'talk to npc', 'rest']
      },
      twilight: {
        description: 'The sun is setting, casting long shadows through the trees.',
        availableActions: ['explore', 'make camp', 'light torch']
      },
      // Add more realities as needed
    }
  },
  space_mission: {
    id: 'space_mission',
    name: 'Deep Space Expedition',
    description: 'A perilous journey through uncharted space.',
    initialReality: 'ship_bridge',
    initialFlags: {
      hasMetCaptain: false,
      shipStatus: 'nominal'
    },
    npcs: {
      captain: {
        name: 'Captain Nova',
        description: 'The experienced captain of the starship.',
        personality: 'Commanding but fair, values efficiency',
        initialDialogue: 'Welcome aboard, crew member. We have a mission to complete.',
        location: 'bridge'
      },
      // Add more NPCs as needed
    },
    realities: {
      ship_bridge: {
        description: 'The command center of the starship, filled with holographic displays.',
        availableActions: ['check status', 'talk to crew', 'navigate']
      },
      space_walk: {
        description: 'Floating in the void of space, tethered to the ship.',
        availableActions: ['repair hull', 'return to airlock', 'observe']
      },
      // Add more realities as needed
    }
  }
};

const loadScenario = async (scenarioId) => {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) {
    throw new Error(`Scenario '${scenarioId}' not found`);
  }
  return scenario;
};

const listScenarios = () => {
  return Object.values(SCENARIOS).map(({ id, name, description }) => ({
    id,
    name,
    description
  }));
};

module.exports = {
  loadScenario,
  listScenarios
};
