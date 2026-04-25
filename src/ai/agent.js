// src/ai/agent.js

import { incrementUsage, getPublicApiKey, getGameHistory } from './config.js';

export class AIAgent {
    constructor(engine, renderer, uiOverlayCallback, thoughtBubbles) {
        this.engine = engine;
        this.renderer = renderer;
        this.uiOverlayCallback = uiOverlayCallback;
        this.thoughtBubbles = thoughtBubbles;
        this.isPlaying = false;
        this.timeoutId = null;
        
        this.thinkingPhrases = [
            "Mietitäänpä...", "Mitä jos siirretään tuo?", "Tämä näyttää hyvältä.",
            "Katson vaihtoehtoja...", "Strategisoin...", "Optimoidaan siirtoja.",
            "Älykästä menoa.", "Katsotaanpa tätä pinoa."
        ];
    }

    getSettings() {
        let apiKey = localStorage.getItem('ai_apiKey');
        if (!apiKey) {
            apiKey = getPublicApiKey(); // Fallback to public key
        }
        return {
            apiKey: apiKey || '',
            provider: localStorage.getItem('ai_provider') || 'openrouter',
            customApiUrl: localStorage.getItem('ai_customApiUrl') || '',
            model: localStorage.getItem('ai_model') || 'google/gemini-2.0-flash-001',
            delay: parseInt(localStorage.getItem('ai_delay') || '2000') // Default to 2s
        };
    }

    start() {
        console.log("AIAgent: start() called. isPlaying:", this.isPlaying);
        if (this.isPlaying) return;
        const settings = this.getSettings();
        console.log("AIAgent settings:", { ...settings, apiKey: settings.apiKey ? '***' : 'MISSING' });
        
        if (!settings.apiKey) {
            const usage = parseInt(localStorage.getItem('ai_usage_count') || '0');
            if (usage >= 1000) {
                const wantOwnKey = confirm('Julkinen kokeilujakso on päättynyt (1000 kutsua täynnä).\n\nHaluatko luoda oman ilmaisen OpenRouter API-avaimen ja jatkaa pelaamista?\n\nKlikkaa OK siirtyäksesi OpenRouterin sivuille.');
                if (wantOwnKey) {
                    window.open('https://openrouter.ai/keys', '_blank');
                }
            } else {
                alert('Määritä OpenRouter API-avain asetuksista ensin.');
            }
            return;
        }

        // Track usage if using public key
        if (settings.apiKey === getPublicApiKey()) {
            incrementUsage();
        }

        this.isPlaying = true;
        this.playNextMove().catch(err => {
            console.error("AIAgent: playNextMove failed:", err);
            this.pause();
        });
    }

    pause() {
        console.log("AIAgent: pause() called.");
        this.isPlaying = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    async playNextMove() {
        if (!this.isPlaying) return;
        
        const settings = this.getSettings();
        console.log("AIAgent: Attempting next move...");
        await this.makeMove(settings);

    }

    async makeMove(settings) {
        this.uiOverlayCallback(true);
        
        const phrase = this.thinkingPhrases[Math.floor(Math.random() * this.thinkingPhrases.length)];
        this.thoughtBubbles.show(phrase, 3000);

        const legalMoves = this.engine.getLegalMoves();
        if (legalMoves.length === 0) {
            this.thoughtBubbles.show("Ei enää siirtoja... Peli ohi!", 4000);
            this.pause();
            this.uiOverlayCallback(false);
            return;
        }

        try {
            const prompt = this.buildPrompt(legalMoves);
            let response;

            if (settings.provider === 'groq') {
                // Groq API (Lightning fast)
                response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${settings.apiKey}`,
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        model: settings.model || 'llama3-70b-8192',
                        messages: [
                            { role: 'system', content: `Olet mestaritason pasianssipelaaja. PELI: ${this.engine.gameName}. SÄÄNNÖT: ${this.engine.rules.description}. Vastaa vain valitun siirron tekstillä.` },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.1
                    })
                });
            } else if (settings.provider === 'custom') {
                // Hosted Ollama / Custom (OpenAI compatible endpoint)
                const url = settings.customApiUrl || 'http://localhost:11434/v1/chat/completions';
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: settings.model || 'llama3',
                        messages: [
                            { role: 'system', content: `Olet mestaritason pasianssipelaaja. PELI: ${this.engine.gameName}. SÄÄNNÖT: ${this.engine.rules.description}. Vastaa vain valitun siirron tekstillä.` },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.1
                    })
                });
            } else if (settings.provider === 'google') {
                // Direct Google Gemini API call
                const geminiModel = settings.model.replace('google/', '');
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${settings.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.1 }
                    })
                });
            } else {
                // OpenRouter call
                response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${settings.apiKey}`,
                        'HTTP-Referer': window.location.href,
                        'X-Title': 'AI Solitaire Infinite',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: settings.model,
                        messages: [
                            { role: 'system', content: `Olet mestaritason pasianssipelaaja. PELI: ${this.engine.gameName}. SÄÄNNÖT: ${this.engine.rules.description}. Vastaa vain valitun siirron tekstillä.` },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.1
                    })
                });
            }

            if (!response.ok) {
                if (settings.provider === 'custom') {
                    throw new Error("Oma palvelin ei vastaa. Varmista että URL on oikein ja CORS-asetukset (OLLAMA_ORIGINS=\"*\") ovat kunnossa.");
                }
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            let rawOutput = (settings.provider === 'google') 
                ? data.candidates[0].content.parts[0].text.trim()
                : data.choices[0].message.content.trim();
            
            const cleanCmd = legalMoves.find(m => rawOutput.includes(m)) || rawOutput;
            await this.executeMove(cleanCmd);
            
        } catch (error) {
            console.error("AI API Failed, falling back to local logic:", error);
            
            this.thoughtBubbles.show("Serveri huohottaa... Käytetään paikallista vaistoa! 🧠⚡", 4000);
            
            // Wait a bit to simulate "thinking" or just to slow down a bit
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const localMove = this.pickLocalMove(legalMoves);
            await this.executeMove(localMove);
        } finally {
            this.uiOverlayCallback(false);
            if (this.isPlaying) {
                if (this.engine.isGameWon()) {
                    this.isPlaying = false;
                    alert("AI Voitti!");
                } else {
                    this.timeoutId = setTimeout(() => this.makeMove(settings), settings.delay);
                }
            }
        }
    }

    pickLocalMove(legalMoves) {
        // Heuristic 1: Foundation moves are top priority
        const foundationMove = legalMoves.find(m => m.includes('to foundation'));
        if (foundationMove) return foundationMove;

        // Heuristic 2: Tableau moves that reveal cards
        const revealMove = legalMoves.find(m => {
            if (!m.includes('from tableau')) return false;
            const parts = m.split(' ');
            const idx = parseInt(parts[2]);
            const pile = this.engine.tableau[idx];
            const count = parseInt(parts[parts.length-1]) || 1;
            return pile && pile.length > count && !pile[pile.length - count - 1].faceUp;
        });
        if (revealMove) return revealMove;

        // Heuristic 3: King to empty slot
        const kingToEmpty = legalMoves.find(m => m.includes('to tableau') && m.includes('K'));
        if (kingToEmpty) return kingToEmpty;

        // Fallback: Just take the first one
        return legalMoves[0];
    }

    async executeMove(cleanCmd) {
        const moveParts = cleanCmd.split(' ');
        if (moveParts[0] === 'MOVE' && moveParts.length >= 6) {
            const fromType = moveParts[1];
            const fromIdx = parseInt(moveParts[2]);
            const toType = moveParts[4];
            const toIdx = parseInt(moveParts[5]);
            const count = parseInt(moveParts[6]) || 1;
            
            let fromCardIdx = null;
            if (fromType === 'tableau') {
                const fromPile = this.engine.tableau[fromIdx];
                if (fromPile) fromCardIdx = Math.max(0, fromPile.length - count);
            }

            this.thoughtBubbles.show(`Tehdään siirto: ${cleanCmd}`, 3000);
            await this.renderer.animateMove(fromType, fromIdx, toType, toIdx, fromCardIdx);
        } else {
            this.thoughtBubbles.show(`Tehdään siirto: ${cleanCmd}`, 3000);
        }

        this.engine.applyMove(cleanCmd);
        this.renderer.render();
    }

    buildPrompt(legalMoves) {
        const history = getGameHistory();
        const historySummary = history.length > 0 
            ? `AI Oppiminen: Viimeiset ${history.length} peliä. Voittoja: ${history.filter(h => h.win).length}. Keskiarvopisteet: ${Math.round(history.reduce((a, b) => a + b.score, 0) / history.length)}.`
            : "AI Oppiminen: Ei aiempia pelejä.";

        let prompt = `Tila: ${this.engine.gameName}\n`;
        prompt += `${historySummary}\n`;
        prompt += "Nykyinen pelilauta:\n" + this.engine.getStateString() + "\n";
        prompt += `
SALLITUT SIIRROT:
${legalMoves.join('\n')}

Valitse TÄSMÄLLEEN YKSI siirto yllä olevasta listasta.
`;
        return prompt;
    }
}
