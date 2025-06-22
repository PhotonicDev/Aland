/**
 * Streams the response from Ollama with real-time output
 * @param {Object} ollama - The Ollama instance
 * @param {Object} options - Options for the chat completion
 * @param {Function} onChunk - Callback for each chunk of data
 * @returns {Promise<Object>} The complete response
 */
const streamOllamaResponse = async (ollama, options, onChunk = () => {}) => {
  let fullResponse = '';
  const messages = [];
  
  try {
    // Ollama's chat returns a promise that resolves to the full response
    const response = await ollama.chat({
      ...options,
      stream: true
    });

    // If the response is a stream (for future compatibility)
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      for await (const chunk of response) {
        try {
          const content = chunk.message?.content || '';
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
        } catch (error) {
          console.error('Error processing chunk:', error);
        }
      }
      
      // Try to parse the full response as JSON if it looks like JSON
      try {
        return JSON.parse(fullResponse);
      } catch (e) {
        // If it's not JSON, use it as plain text
        return { content: fullResponse };
      }
    } 
    // If the response is already the full response (non-streaming)
    else if (response && response.message) {
      const content = response.message.content || '';
      if (content) {
        onChunk(content);
      }
      return response.message;
    }
    
    // If we get here, the response format is unexpected
    console.warn('Unexpected response format from Ollama:', response);
    return { content: fullResponse };
    
  } catch (error) {
    console.error('Error in streamOllamaResponse:', error);
    throw error;
  }
};

module.exports = { streamOllamaResponse };
