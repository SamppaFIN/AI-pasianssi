// src/ai/agent.js

export class AIAgent {
    constructor(engine, renderer, uiOverlayCallback) {
        this.engine = engine;
        this.renderer = renderer;
        this.uiOverlayCallback = uiOverlayCallback;
        this.isPlaying = false;
        this.timeoutId = null;
    }

    getSettings() {
        return {
            apiKey: localStorage.getItem('ai_apiKey') || '',
            model: localStorage.getItem('ai_model') || 'openai/gpt-4o-mini',
            delay: parseInt(localStorage.getItem('ai_delay') || '1000')
        };
    }

    start() {
        if (this.isPlaying) return;
        const settings = this.getSettings();
        if (!settings.apiKey) {
            alert('Please configure your OpenRouter API Key in Settings first.');
            return;
        }
        this.isPlaying = true;
        this.playNextMove();
    }

    pause() {
        this.isPlaying = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    async step() {
        const settings = this.getSettings();
        if (!settings.apiKey) {
            alert('Please configure your OpenRouter API Key in Settings first.');
            return;
        }
        await this.makeMove(settings);
    }

    async playNextMove() {
        if (!this.isPlaying) return;
        
        const settings = this.getSettings();
        await this.makeMove(settings);

        if (this.isPlaying && !this.engine.isGameWon()) {
            this.timeoutId = setTimeout(() => {
                this.playNextMove();
            }, settings.delay);
        } else if (this.engine.isGameWon()) {
            this.isPlaying = false;
        }
    }

    async makeMove(settings) {
        this.uiOverlayCallback(true); // Show thinking

        try {
            const prompt = this.buildPrompt();
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.apiKey}`,
                    'HTTP-Referer': 'http://localhost:5173', // Adjust as needed
                    'X-Title': 'AI Solitaire Infinite',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: [
                        { role: 'system', content: 'You are an AI playing Klondike Solitaire. Respond ONLY with a single valid action command. Do not add any text, markdown, or explanation.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const rawOutput = data.choices[0].message.content.trim();
            console.log("AI Move Output:", rawOutput);
            
            this.executeCommand(rawOutput);
            
        } catch (error) {
            console.error("AI Move Failed:", error);
            this.pause();
            alert(`AI Move Failed: ${error.message}`);
        } finally {
            this.uiOverlayCallback(false); // Hide thinking
            this.renderer.render();
        }
    }

    buildPrompt() {
        let prompt = "Current Board State:\n" + this.engine.getStateString() + "\n";
        prompt += `
Choose your next move to progress the game.
Valid command formats:
- DRAW_STOCK
- MOVE_WASTE_TO_FOUNDATION <fIndex>
- MOVE_WASTE_TO_TABLEAU <tIndex>
- MOVE_TABLEAU_TO_FOUNDATION <tIndex> <fIndex>
- MOVE_TABLEAU_TO_TABLEAU <fromIndex> <toIndex> <count>

Example valid response:
MOVE_TABLEAU_TO_TABLEAU 0 1 1

Respond with exactly ONE command and nothing else.
`;
        return prompt;
    }

    executeCommand(cmdStr) {
        const parts = cmdStr.split(/\s+/);
        const action = parts[0];

        let success = false;
        try {
            switch(action) {
                case 'DRAW_STOCK':
                    success = this.engine.drawStock();
                    break;
                case 'MOVE_WASTE_TO_FOUNDATION':
                    success = this.engine.moveWasteToFoundation(parseInt(parts[1]));
                    break;
                case 'MOVE_WASTE_TO_TABLEAU':
                    success = this.engine.moveWasteToTableau(parseInt(parts[1]));
                    break;
                case 'MOVE_TABLEAU_TO_FOUNDATION':
                    success = this.engine.moveTableauToFoundation(parseInt(parts[1]), parseInt(parts[2]));
                    break;
                case 'MOVE_TABLEAU_TO_TABLEAU':
                    success = this.engine.moveTableauToTableau(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]));
                    break;
                default:
                    console.warn("Unknown AI command:", cmdStr);
            }
        } catch (e) {
            console.error("Error executing AI command:", e);
        }

        if (!success) {
            console.warn("AI attempted an invalid move:", cmdStr);
            // In a real scenario we might tell AI it failed and try again, 
            // but for now we just skip the turn and let it try again on next loop.
        }
    }
}
