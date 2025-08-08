/**
 * Advanced Natural Language Processing System
 * Handles context-aware interpretation across all system states
 */

import natural from "natural";
const sentiment = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");
const tokenizer = new natural.WordTokenizer();
import nlp from "node-nlp";
import fs from "fs-extra";
import path from "path";

class NLPProcessor {
  constructor() {
    this.intentManager = new nlp.NlpManager({ languages: ["en"], forceNER: true });
    this.contextMemory = new Map();
    this.memoryPath = path.join(process.cwd(), ".ai", "nlp_memory.json");
    this.loadMemory();
    this.setupIntents();
  }

  async loadMemory() {
    try {
      if (await fs.pathExists(this.memoryPath)) {
        const memoryData = await fs.readJson(this.memoryPath);
        this.contextMemory = new Map(Object.entries(memoryData));
      }
    } catch (error) {
      console.error("Error loading NLP memory:", error);
    }
  }

  async saveMemory() {
    try {
      await fs.writeJson(this.memoryPath, Object.fromEntries(this.contextMemory));
    } catch (error) {
      console.error("Error saving NLP memory:", error);
    }
  }

  /**
   * Setup intent recognition system
   */
  async setupIntents() {
    // Add common development intents
    this.intentManager.addDocument("en", "create a new feature", "feature.create");
    this.intentManager.addDocument("en", "add a new feature", "feature.create");
    this.intentManager.addDocument("en", "build a new feature", "feature.create");

    this.intentManager.addDocument("en", "fix the bug", "bug.fix");
    this.intentManager.addDocument("en", "resolve the issue", "bug.fix");
    this.intentManager.addDocument("en", "address the problem", "bug.fix");

    this.intentManager.addDocument("en", "improve performance", "optimization");
    this.intentManager.addDocument("en", "make it faster", "optimization");

    this.intentManager.addDocument("en", "change the design", "design.update");
    this.intentManager.addDocument("en", "update the UI", "design.update");

    this.intentManager.addDocument("en", "run the tests", "test.run");
    this.intentManager.addDocument("en", "test the application", "test.run");

    this.intentManager.addDocument("en", "deploy the application", "deploy.start");
    this.intentManager.addDocument("en", "push to production", "deploy.start");

    // Train the model
    await this.intentManager.train();
  }

  /**
   * Process user input with full context awareness
   */
  async processInput(userInput, context) {
    // Parse complex natural language commands
    const { intent, entities } = await this.classifyIntent(userInput);

    // Maintain context across conversations
    this.contextMemory.set(context.sessionId, {
      lastIntent: intent,
      entities,
    });

    await this.saveMemory();

    return this.generateAction(intent, entities);
  }

  async classifyIntent(userInput) {
    // This is a placeholder.
    // The user did not provide the implementation for this function.
    console.log(`Classifying intent for userInput ${userInput}`);
    return { intent: "test-intent", entities: [] };
  }

  generateAction(intent, entities) {
    // This is a placeholder.
    // The user did not provide the implementation for this function.
    console.log(`Generating action for intent ${intent} with entities ${JSON.stringify(entities)}`);
    return { action: "test-action" };
  }

  /**
   * Get or create context for a user
   */
  _getContext(userId) {
    if (!this.contextMemory.has(userId)) {
      this.contextMemory.set(userId, {
        conversationHistory: [],
        lastState: null,
        preferences: {},
      });
    }
    return this.contextMemory.get(userId);
  }

  /**
   * Detect intent from user input
   */
  async _detectIntent(text) {
    const result = await this.intentManager.process("en", text);
    return {
      intent: result.intent,
      score: result.score,
      entities: result.entities,
    };
  }

  /**
   * Extract meaningful entities from text
   */
  _extractEntities(text) {
    // Simple entity extraction for now (would be enhanced with NER)
    const entities = [];

    // Feature names
    const featureRegex = /feature\s+['"]?([\w\s-]+)['"]?/i;
    const featureMatch = text.match(featureRegex);
    if (featureMatch) {
      entities.push({ type: "FEATURE", value: featureMatch[1] });
    }

    // Component names
    const componentRegex = /(component|page|module)\s+['"]?([\w\s-]+)['"]?/i;
    const componentMatch = text.match(componentRegex);
    if (componentMatch) {
      entities.push({ type: "COMPONENT", value: componentMatch[2] });
    }

    // Priority indicators
    if (/urgent|immediately|asap|critical/i.test(text)) {
      entities.push({ type: "PRIORITY", value: "URGENT" });
    }

    return entities;
  }

  /**
   * Assess how context-aware the input is
   */
  _assessContextAwareness(text, context) {
    // Check if user is referencing previous conversation
    const hasReference = /(previous|earlier|before|that|it|this)/i.test(text);

    // Check if user is aware of current state
    const stateAware =
      context.lastState && text.toLowerCase().includes(context.lastState.toLowerCase());

    return {
      hasReference,
      stateAware,
      needsClarification: !hasReference && !stateAware,
    };
  }

  /**
   * Determine urgency from sentiment and keywords
   */
  _determineUrgency(text, context) {
    // Check explicit urgency indicators
    const explicitUrgency = /(urgent|immediately|asap|critical|emergency)/i.test(text);

    // Check sentiment intensity
    const tokens = tokenizer.tokenize(text);
    const sentimentScore = sentiment.getSentiment(tokens);
    const sentimentUrgency = sentimentScore < -0.5; // Strong negative sentiment

    // Check if following up on previous urgent request
    const followupUrgency =
      context.lastUrgency &&
      context.conversationHistory.length > 0 &&
      !/(completed|done|fixed)/i.test(text);

    return {
      isUrgent: explicitUrgency || sentimentUrgency || followupUrgency,
      explicit: explicitUrgency,
      sentiment: sentimentUrgency,
      followup: followupUrgency,
      priorityLevel: explicitUrgency ? 1 : sentimentUrgency ? 2 : 3,
    };
  }

  /**
   * Update conversation history for context retention
   */
  _updateContextHistory(userId, input, analysis) {
    const context = this._getContext(userId);

    // Add to history (limit to last 10 exchanges)
    context.conversationHistory.push({
      input,
      analysis,
      timestamp: Date.now(),
    });

    if (context.conversationHistory.length > 10) {
      context.conversationHistory.shift();
    }

    // Update urgency tracking
    context.lastUrgency = analysis.urgency.isUrgent;
  }

  /**
   * Generate clarification request when needed
   */
  generateClarificationRequest(userId, input) {
    const context = this._getContext(userId);
    const analysis = this.processInput(userId, input, context.lastState);

    if (!analysis.contextAwareness.needsClarification) {
      return null;
    }

    // Generate appropriate clarification based on missing context
    const missingElements = [];

    if (!analysis.contextAwareness.hasReference && context.conversationHistory.length > 0) {
      missingElements.push("reference to previous discussion");
    }

    if (!analysis.contextAwareness.stateAware && context.lastState) {
      missingElements.push(`awareness of current project state (${context.lastState})`);
    }

    if (analysis.intent.score < 0.6) {
      missingElements.push("clear intent");
    }

    return {
      message: `I need clarification: ${missingElements.join(" and ")}. Could you please provide more context?`,
      options: this._suggestedClarifications(analysis, context),
    };
  }

  /**
   * Provide suggested clarification options
   */
  _suggestedClarifications(analysis, context) {
    const suggestions = [];

    // Suggest state-specific options
    if (context.lastState) {
      switch (context.lastState) {
        case "AWAITING_EXECUTION_APPROVAL":
          suggestions.push("Are you approving the execution plan?");
          suggestions.push("Do you want to modify the plan before execution?");
          break;
        case "CODE_IMPLEMENTATION":
          suggestions.push("Which specific part of the implementation needs attention?");
          suggestions.push("Are you reporting an issue with the current implementation?");
          break;
        // Add other state-specific suggestions
      }
    }

    // Add intent-based suggestions
    if (analysis.intent.intent === "None" || analysis.intent.score < 0.4) {
      suggestions.push("What specific action would you like me to take?");
      suggestions.push("Could you rephrase your request more specifically?");
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Get conversation history for audit purposes
   */
  getConversationHistory(userId) {
    const context = this._getContext(userId);
    return [...context.conversationHistory]; // Return copy
  }

  _interpretComplexCommand(command) {
    // Parse multi-step instructions
    return command.split(/(then|after that|next)/i).map((step) => this.parseStep(step.trim()));
  }

  parseStep(step) {
    // This is a placeholder.
    // The user did not provide the implementation for this function.
    console.log(`Parsing step: ${step}`);
    return { step };
  }
}

// Export singleton instance
export default new NLPProcessor();
