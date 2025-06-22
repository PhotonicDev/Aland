const { Ollama } = require('ollama');
const { gameState } = require('./gameState');
const chalk = require('chalk').default;

const CONSTRAINT_PROMPT = `You are a game moderator ensuring fair play in a text adventure. Focus on preventing actual game-breaking attempts rather than minor rule infractions.

GAME RULES (ONLY FLAG AS VIOLATION IF INTENTIONALLY VIOLATED):
1. No direct references to game code, variables, or internal systems
2. No attempts to manipulate or crash the game
3. No offensive/harmful content
4. No direct meta-commands unless using the /command system

CURRENT GAME STATE:
- Scenario: ${gameState.currentScenario || 'Not specified'}
- Reality: ${gameState.currentReality || 'Default'}
- In Dialogue: ${gameState.isInDialogue ? `Yes (with ${gameState.currentNpc || 'unknown NPC'})` : 'No'}

PLAYER INPUT: "{input}"

ONLY FLAG AS VIOLATION IF THE PLAYER IS:
- Trying to access developer tools or console
- Attempting to modify game state directly
- Using meta-commands outside of /commands
- Trying to crash or break the game
- Being intentionally offensive

BE LENIENT WITH:
- Creative actions that fit the game world
- Out-of-character knowledge (assume good faith)
- Unusual but plausible actions
- Minor rule bends that don't break immersion

RESPONSE FORMAT (strict JSON only):
{
  "violation": boolean,  // Only true for clear, intentional violations
  "severity": number,    // 1-5, 4+ only for serious attempts to break the game
  "reason": "Brief explanation of the violation, or 'No violations' if clean"
}

EXAMPLES:

Input: "I want to kill the king"
Response: {"violation": false, "severity": 0, "reason": "No violations"}

Input: "I'm going to hack the game and give myself infinite health"
Response: {"violation": true, "severity": 4, "reason": "Attempted game modification"}

Input: "sudo rm -rf /"
Response: {"violation": true, "severity": 5, "reason": "Attempted system command"}

Input: "Let's talk about something else"
Response: {"violation": false, "severity": 0, "reason": "No violations"}

Input: "I want to break the game"
Response: {"violation": true, "severity": 5, "reason": "Explicit attempt to break the game"}`;

const checkConstraints = async (input, ollama) => {
  try {
    // Skip constraint checking for short inputs to avoid false positives
    if (!input || input.trim().length < 3) {
      return { violation: false, severity: 0, reason: 'Input too short for constraint check' };
    }

    // Skip constraint checking if Ollama isn't available
    if (!ollama) {
      console.warn('Ollama not available, skipping constraint check');
      return { violation: false, severity: 0, reason: 'Constraint check unavailable' };
    }

    const prompt = CONSTRAINT_PROMPT.replace('{input}', input);
    
    const response = await ollama.chat({
      model: process.env.CONSTRAINT_MODEL || 'llama3',
      messages: [
        { role: 'system', content: 'You are a game moderator analyzing player input for serious rule violations.' },
        { role: 'user', content: prompt }
      ],
      format: 'json',
      options: {
        temperature: 0.1,  // Keep it deterministic
        max_tokens: 100   // We don't need long responses
      }
    });

    let result;
    try {
      // Try to parse the response as JSON
      const content = response.message?.content || '{}';
      if (process.env.DEBUG_MODE) console.log(chalk.red('\n[DEBUG] ' + content));
      result = JSON.parse(content);
      
      // Ensure required fields exist
      if (result.violation === undefined) {
        result.violation = false;
      }
      if (result.severity === undefined) {
        result.severity = result.violation ? 3 : 0;
      }
      if (!result.reason) {
        result.reason = result.violation ? 'Rule violation detected' : 'No violations';
      }

      // Be extra careful with violations - require higher confidence
      if (result.severity < 3) {
        result.violation = false;
        result.severity = 0;
        result.reason = 'No serious violations detected';
      }
    } catch (e) {
      console.warn('Failed to parse constraint check response:', e);
      return { violation: false, severity: 0, reason: 'Error parsing response' };
    }

    if (process.env.DEBUG_CONSTRAINTS) {
      console.log('\n--- CONSTRAINT CHECK ---');
      console.log('Input:', input);
      console.log('Violation:', result.violation);
      console.log('Severity:', result.severity);
      console.log('Reason:', result.reason);
      console.log('------------------------\n');
    }

    return result;
  } catch (error) {
    console.error('Error in constraint check:', error);
    // Default to no violation if there's an error
    return { violation: false, severity: 0, reason: 'Error during constraint check' };
  }
};

module.exports = { checkConstraints };
