// src/app.js
import { KlondikeEngine } from './engine/klondike.js';
import { BoardRenderer } from './ui/board.js';
import { AIAgent } from './ai/agent.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Init Engine
    const engine = new KlondikeEngine();
    engine.initialize();

    // 2. Init Renderer
    const renderer = new BoardRenderer(engine);

    // 3. Init AI
    const thinkingOverlay = document.getElementById('ai-thinking-overlay');
    const setAIThinking = (isThinking) => {
        if (isThinking) {
            thinkingOverlay.classList.remove('hidden');
        } else {
            thinkingOverlay.classList.add('hidden');
        }
    };
    const aiAgent = new AIAgent(engine, renderer, setAIThinking);

    // Initial render
    renderer.render();

    // 4. Bind UI Controls
    const btnPlay = document.getElementById('btn-ai-play');
    const btnPause = document.getElementById('btn-ai-pause');
    const btnStep = document.getElementById('btn-ai-step');
    const aiStatusText = document.getElementById('ai-status-text');
    const statusIndicator = document.querySelector('.status-indicator');

    const updateUIState = () => {
        if (aiAgent.isPlaying) {
            btnPlay.disabled = true;
            btnStep.disabled = true;
            btnPause.disabled = false;
            aiStatusText.innerText = "AI Playing";
            statusIndicator.classList.add('active');
        } else {
            btnPlay.disabled = false;
            btnStep.disabled = false;
            btnPause.disabled = true;
            aiStatusText.innerText = "AI Idle";
            statusIndicator.classList.remove('active');
        }
    };

    btnPlay.addEventListener('click', () => {
        aiAgent.start();
        updateUIState();
    });

    btnPause.addEventListener('click', () => {
        aiAgent.pause();
        updateUIState();
    });

    btnStep.addEventListener('click', async () => {
        btnStep.disabled = true;
        await aiAgent.step();
        btnStep.disabled = false;
    });

    // 5. Settings Modal
    const modal = document.getElementById('settings-modal');
    const btnSettings = document.getElementById('btn-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    
    const inpApiKey = document.getElementById('api-key');
    const selModel = document.getElementById('ai-model');
    const inpDelay = document.getElementById('ai-delay');

    // Load settings into modal
    const loadSettings = () => {
        inpApiKey.value = localStorage.getItem('ai_apiKey') || '';
        selModel.value = localStorage.getItem('ai_model') || 'openai/gpt-4o-mini';
        inpDelay.value = localStorage.getItem('ai_delay') || '1000';
    };

    btnSettings.addEventListener('click', () => {
        loadSettings();
        modal.classList.remove('hidden');
    });

    btnSaveSettings.addEventListener('click', () => {
        localStorage.setItem('ai_apiKey', inpApiKey.value);
        localStorage.setItem('ai_model', selModel.value);
        localStorage.setItem('ai_delay', inpDelay.value);
        modal.classList.add('hidden');
    });

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Initial setup
    updateUIState();
});
