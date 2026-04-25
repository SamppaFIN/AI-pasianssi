// src/app.js
import { BaseEngine } from './engine/base_engine.js';
import { BoardRenderer } from './ui/board.js';
import { AIAgent } from './ai/agent.js';
import { GameRegistry, GameCategories } from './engine/games/registry.js';
import { SpatialBackground } from './ui/background.js';
import { EffectEngine } from './ui/effects.js';
import { ThoughtBubbles } from './ui/thought_bubbles.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D Background & Effects
    new SpatialBackground();
    const effects = new EffectEngine();
    const thoughtBubbles = new ThoughtBubbles();

    const engine = new BaseEngine();
    const renderer = new BoardRenderer(engine, effects, thoughtBubbles);
    
    const setAIThinking = (isThinking) => {
        const overlay = document.getElementById('ai-thinking-overlay');
        isThinking ? overlay.classList.remove('hidden') : overlay.classList.add('hidden');
    };
    
    const aiAgent = new AIAgent(engine, renderer, setAIThinking, thoughtBubbles);

    // Undo Button
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            engine.undo();
            renderer.render();
            thoughtBubbles.show("Peruutetaan siirto... ↩️");
        });
    }

    // Initial Load
    const savedGame = localStorage.getItem('ai_last_game') || 'Klondike';
    engine.loadGame(savedGame);
    const rulesText = engine.rules.description || "Sääntöjä ei saatavilla.";
    document.getElementById('current-game-title').innerText = savedGame;
    renderer.render();

    // UI Elements for Rules Overlay
    const rulesOverlay = document.getElementById('rules-overlay');
    const rulesOverlayTitle = document.getElementById('rules-overlay-title');
    const rulesOverlayText = document.getElementById('rules-overlay-text');

    const showRules = (gameName, description) => {
        rulesOverlayTitle.innerText = gameName;
        rulesOverlayText.innerText = description;
        rulesOverlay.classList.remove('hidden');
    };

    const closeRules = () => {
        rulesOverlay.classList.add('hidden');
        // Resume AI if it was playing (optional, for now just hide)
    };

    rulesOverlay.addEventListener('click', closeRules);
    rulesOverlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        closeRules();
    }, { passive: false });

    // Initial Rules Display
    showRules(savedGame, engine.rules.description);

    // AI Controls
    const btnPlay = document.getElementById('btn-ai-play');
    const btnPause = document.getElementById('btn-ai-pause');

    // Onboarding UI
    const obStep1 = document.getElementById('onboarding-step1');
    const obStep2 = document.getElementById('onboarding-step2');
    const btnCancelOb = document.getElementById('btn-cancel-onboarding');
    const btnVerifyKey = document.getElementById('btn-verify-key');
    const btnFinishOb = document.getElementById('btn-finish-onboarding');
    const inpObKey = document.getElementById('onboarding-api-key');
    const selObModel = document.getElementById('onboarding-model');

    let hadError = false;

    const updatePlayUI = () => {
        const playBtnLabel = btnPlay.querySelector('span:not(.icon)') || btnPlay;
        if (aiAgent.isPlaying) {
            btnPlay.classList.add('hidden');
            btnPause.classList.remove('hidden');
        } else {
            btnPlay.classList.remove('hidden');
            btnPause.classList.add('hidden');
            if (hadError) {
                btnPlay.innerHTML = '<span class="icon">🤖</span> Jatka AI:lla';
            } else {
                btnPlay.innerHTML = '<span class="icon">🤖</span> Auto-Play';
            }
        }
    };

    window.addEventListener('ai-error-occurred', () => {
        console.log("AI Error Event received in app.js. Setting hadError = true");
        hadError = true;
        updatePlayUI();
    });

    btnPlay.addEventListener('click', () => {
        const settings = aiAgent.getSettings();
        if (!settings.apiKey) {
            obStep1.classList.remove('hidden');
        } else {
            console.log("Starting AI Agent...");
            hadError = false; // Reset error state on manual start
            aiAgent.start();
            updatePlayUI();
        }
    });

    btnCancelOb.addEventListener('click', () => obStep1.classList.add('hidden'));

    btnVerifyKey.addEventListener('click', async () => {
        const key = inpObKey.value.trim();
        if (!key) { alert("Syötä API-avain."); return; }
        
        // Auto-detect Groq keys
        if (key.startsWith('gsk_')) {
            localStorage.setItem('ai_apiKey', key);
            localStorage.setItem('ai_provider', 'groq');
            obStep1.classList.add('hidden');
            obStep2.classList.remove('hidden');
            return;
        }

        btnVerifyKey.innerText = "Varmistetaan...";
        btnVerifyKey.disabled = true;
        
        try {
            console.log("Verifying key with OpenRouter...");
            const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${key}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'AI Solitaire Infinite'
                }
            });
            
            if (!res.ok) {
                // If it's not a valid OpenRouter key, but user insists, we could let them through
                // but let's be safe and only allow if it looks like a key
                if (key.length < 20) throw new Error("Avain näyttää liian lyhyeltä.");
                console.warn("OpenRouter verification failed, but allowing anyway as it might be a different provider.");
            }
            
            localStorage.setItem('ai_apiKey', key);
            localStorage.setItem('ai_provider', 'openrouter');
            obStep1.classList.add('hidden');
            obStep2.classList.remove('hidden');
        } catch (e) {
            console.error("Verification error:", e);
            const force = confirm(`Varmistus epäonnistui: ${e.message}\n\nHaluatko jatkaa silti? (Valitse tämä jos käytät muuta kuin OpenRouter-avainta)`);
            if (force) {
                localStorage.setItem('ai_apiKey', key);
                obStep1.classList.add('hidden');
                obStep2.classList.remove('hidden');
            }
        } finally {
            btnVerifyKey.innerText = "Vahvista & Jatka";
            btnVerifyKey.disabled = false;
        }
    });

    btnFinishOb.addEventListener('click', () => {
        localStorage.setItem('ai_model', selObModel.value);
        obStep2.classList.add('hidden');
        console.log("Onboarding finished, starting game...");
        aiAgent.start();
        updatePlayUI();
    });

    btnPause.addEventListener('click', () => { aiAgent.pause(); updatePlayUI(); });

    // Modals & Bottom Sheets
    const gameSheet = document.getElementById('game-selector-sheet');
    const settingsSheet = document.getElementById('settings-sheet');
    const btnOpenGames = document.getElementById('btn-open-games');
    const btnSettings = document.getElementById('btn-settings');
    const btnRules = document.getElementById('btn-rules');
    
    const closeAllSheets = () => {
        gameSheet.classList.add('hidden');
        settingsSheet.classList.add('hidden');
    };

    document.querySelectorAll('.close-sheet, .sheet-backdrop').forEach(el => {
        el.addEventListener('click', closeAllSheets);
    });

    btnOpenGames.addEventListener('click', () => gameSheet.classList.remove('hidden'));
    
    if (btnRules) {
        btnRules.addEventListener('click', () => {
            showRules(engine.gameName, engine.rules.description);
        });
    }

    // Settings logic
    const inpApiKey = document.getElementById('api-key');
    const selProvider = document.getElementById('ai-provider');
    const inpCustomUrl = document.getElementById('custom-api-url');
    const selModel = document.getElementById('ai-model');
    const inpDelay = document.getElementById('ai-delay');
    
    btnSettings.addEventListener('click', () => {
        inpApiKey.value = localStorage.getItem('ai_apiKey') || '';
        selProvider.value = localStorage.getItem('ai_provider') || 'groq';
        inpCustomUrl.value = localStorage.getItem('ai_customApiUrl') || '';
        selModel.value = localStorage.getItem('ai_model') || 'llama3-70b-8192';
        inpDelay.value = localStorage.getItem('ai_delay') || '2000';
        settingsSheet.classList.remove('hidden');
    });

    selProvider.addEventListener('change', () => {
        if (selProvider.value === 'custom') {
            alert("Oma palvelin (kuten Ollama) vaatii CORS-asetukset:\n\n1. Sulje palvelin\n2. Aseta ympäristömuuttuja: OLLAMA_ORIGINS=\"*\"\n3. Käynnistä palvelin uudelleen\n\nWindows (PowerShell):\n$env:OLLAMA_ORIGINS=\"*\"; ollama serve");
        }
    });

    const btnSaveSettings = document.getElementById('btn-save-settings');
    btnSaveSettings.addEventListener('click', () => {
        localStorage.setItem('ai_apiKey', inpApiKey.value.trim());
        localStorage.setItem('ai_provider', selProvider.value);
        localStorage.setItem('ai_customApiUrl', inpCustomUrl.value.trim());
        localStorage.setItem('ai_model', selModel.value);
        localStorage.setItem('ai_delay', inpDelay.value);
        settingsSheet.classList.add('hidden');
        alert("Asetukset tallennettu!");
        if (aiAgent.isPlaying) aiAgent.start(); // Refresh if playing
    });

    // Populate Games List
    const gameListContainer = document.getElementById('game-list-container');
    for (const [category, games] of Object.entries(GameCategories)) {
        const catDiv = document.createElement('div');
        catDiv.className = 'game-category';
        catDiv.innerHTML = `<h3>${category}</h3><div class="game-list"></div>`;
        const listDiv = catDiv.querySelector('.game-list');
        
        games.forEach(gameName => {
            const btn = document.createElement('button');
            const RuleClass = GameRegistry[gameName];
            const isStub = new RuleClass().isStub;
            
            btn.className = `btn game-btn ${isStub ? 'stub' : ''}`;
            btn.innerText = gameName + (isStub ? ' (TBA)' : '');
            
            btn.addEventListener('click', () => {
                if (isStub) {
                    alert(`${gameName} tulossa pian!`);
                    return;
                }
                aiAgent.pause();
                updatePlayUI();
                engine.loadGame(gameName);
                localStorage.setItem('ai_last_game', gameName);
                
                document.getElementById('current-game-title').innerText = gameName;
                renderer.render();
                closeAllSheets();

                // Show Rules Overlay
                showRules(gameName, engine.rules.description);
            });
            listDiv.appendChild(btn);
        });
        gameListContainer.appendChild(catDiv);
    }
});
