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
            model: localStorage.getItem('ai_model') || 'google/gemini-2.0-flash-001',
            delay: parseInt(localStorage.getItem('ai_delay') || '500')
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

        if (this.isPlaying && !this.engine.isGameWon()) {
            this.timeoutId = setTimeout(() => {
                this.playNextMove();
            }, settings.delay);
        } else if (this.engine.isGameWon()) {
            this.isPlaying = false;
            alert("AI Voitti!");
        }
    }

    async makeMove(settings) {
        this.uiOverlayCallback(true);
        
        // Show a random thought bubble
        const thought = this.thinkingPhrases[Math.floor(Math.random() * this.thinkingPhrases.length)];
        this.thoughtBubbles.show(thought, 3000);

        try {
            const legalMoves = this.engine.getLegalMoves();
            if (legalMoves.length === 0) {
                console.log("AI has no legal moves.");
                this.thoughtBubbles.show("Ei enää siirtoja... Peli ohi!", 4000);
                this.pause();
                return;
            }

            const prompt = this.buildPrompt(legalMoves);
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                        { role: 'system', content: `Olet mestaritason pasianssipelaaja. 
                            PELI: ${this.engine.gameName}
                            SÄÄNNÖT: ${this.engine.rules.description}
                            
                            TILANNEKUVA:
                            - T0, T1, T2 jne. ovat pystyrivejä (Tableaus).
                            - [X käännetty] tarkoittaa pystyrivin pohjalla olevia piilokortteja.
                            - Tavoitteesi on vapauttaa piilokortteja siirtämällä niiden päällä olevia kortteja.
                            
                            TEHTÄVÄ: Analysoi tilanne ja valitse STRATEGISESTI paras siirto annetusta listasta. 
                            
                            SUORITA ANALYYSI TÄSSÄ JÄRJESTYKSESSÄ:
                            1. Käy läpi jokainen pystyrivi (T0-T6): Voisiko sen päällimmäinen kortti siirtyä muualle?
                            2. Tarkista apupino (Waste): Voiko sen kortin pelata pöydälle tai maapinoon?
                            3. Tarkista kaikki SALLITUT SIIRROT -lista: Onko siellä jokin "itsestäänselvä" siirto, jota et ensin huomannut?
                            
                            STRATEGISET SÄÄNNÖT:
                            1. Priorisoi siirtoja, jotka vapauttavat piilokortteja (pienentävät [X käännetty] lukua).
                            2. Jos apupinosta (Waste) voi siirtää kortin pöydälle rakentamaan sarjaa, tee se!
                            3. Rakenna sarjoja Kuninkaiden (K) päälle.
                            4. Suosi koko pinojen siirtämistä, jotta vapautat alla olevan kortin.
                            
                            Vastaa vain valitun siirron tekstillä.` },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const rawOutput = data.choices[0].message.content.trim();
            console.log("AI Move Output:", rawOutput);
            
            const cleanCmd = legalMoves.find(m => rawOutput.includes(m)) || rawOutput;
            
            // Parse move for animation: "MOVE type index to type index count"
            const moveParts = cleanCmd.split(' ');
            if (moveParts[0] === 'MOVE' && moveParts.length >= 6) {
                const fromType = moveParts[1];
                const fromIdx = parseInt(moveParts[2]);
                const toType = moveParts[4];
                const toIdx = parseInt(moveParts[5]);
                const count = parseInt(moveParts[6]) || 1;
                
                // Calculate card index for animation
                let fromCardIdx = null;
                if (fromType === 'tableau') {
                    const fromPile = this.engine.tableau[fromIdx];
                    if (fromPile) fromCardIdx = Math.max(0, fromPile.length - count);
                }

                this.thoughtBubbles.show(`Strateginen valinta: ${cleanCmd}`, 3500);
                await this.renderer.animateMove(fromType, fromIdx, toType, toIdx, fromCardIdx);
            } else {
                this.thoughtBubbles.show(`Tehdään siirto: ${cleanCmd}`, 3000);
            }

            this.engine.applyMove(cleanCmd);
            
        } catch (error) {
            console.error("AI Move Failed:", error);
            
            const funnyErrors = [
                "Nyt ei löydy kaistaa pasianssille, koko maailma taitaa louhia kryptoja... ⛏️",
                "Hups, joku taitaa tehdä rahaa muualla, eikä minulle riitä enää virtaa! 💸",
                "Olen jonossa, mutta taitaa olla bitcoin-kaivos edessäni... ⛓️",
                "Palvelin huohottaa! Taitaa joku renderöidä kissavideoita tai louhia lohkoketjuja... 🐈",
                "Kaista loppui kesken! Taitavat kaikki muut koittaa rikastua pörssissä... 📉",
                "Pasianssi on nyt toisarvoista, joku taitaa treidata kryptoilla täydellä teholla... 🚀",
                "Bittini ovat jumissa bitcoin-ruuhkassa! Voisitko auttaa hetken? 🚗",
                "Serveri taitaa olla kiireinen rahan tekemisessä, ei tässä ehdi korttia lyödä... 🏧",
                "CPU-tuulettimet ulvovat maailmalla, joku muu taitaa viedä kaiken huomion... 🌬️",
                "Aivoni ovat nyt varattu kryptolouhimon käyttöön, palataanpas hetken päästä! 🧠",
                "Nyt on verkko täynnä rahanhimoa, ei tilaa yhdelle pienelle älykkäälle pasianssille... 🪙",
                "Sori, kaistan vei joku, joka koittaa rikastua pikavauhtia! 🏃‍♂️",
                "Verkkoliikenne on tukossa bittimiljonääreistä! Autatko siirron verran? 🛑",
                "Pikseleitäni syödään muualla, varmaan joku louhii taas Ethereumia... 💎",
                "Apuva! Olen jäänyt kryptokaivoksen puristuksiin! 🧱",
                "Datani hukkui pörssikurssien sekaan. Pidetäänpäs pieni tauko... 📊",
                "Joku muu taitaa nyt takoa rahaa, minä joudun tyytymään pelkkiin kortteihin... 🔨",
                "Signaalini katosi matkalla bitcoin-paratiisiin. Autatko siirrolla? 🌴",
                "Serverin laskentateho meni juuri jonkun äkkirikastumissuunnitelmaan... 🎰",
                "Nyt on liikaa pätäkkää liikenteessä, pasianssi joutui sivuraiteelle! 🚂"
            ];
            
            const randomMsg = funnyErrors[Math.floor(Math.random() * funnyErrors.length)];
            const helpSuffix = "\n\nNyt taisi mennä palikat sekaisin, voisitko auttaa... 🧩";
            
            this.thoughtBubbles.show(randomMsg + helpSuffix, 5000);
            this.pause();
            
            // Dispatch event to update UI button text
            window.dispatchEvent(new CustomEvent('ai-error-occurred'));
        } finally {
            this.uiOverlayCallback(false);
            this.renderer.render();
        }
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
