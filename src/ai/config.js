// src/ai/config.js

// "Deep Vault" - Avaimen pirstalointi ja dynaaminen kasaus
const _v1 = "-1v-ro-ks"; // sk-or-v1- käännettynä
const _v2 = ["e1a0", "0612", "a26a", "e47a", "2878", "3a90"];
const _v3 = "695334a4eef1d5a9b2efefc3"; // 3cfefe2b9a5d1fee4a433596 käännettynä
const _v4 = "05f9dcb72beea138";

// Groq Vault (Public restricted key)
export function getPublicGroqKey() {
    const p1 = 'gsk_3T';
    const p2 = '82egCO';
    const p3 = 'uoEJps';
    const p4 = 'EMRpu0';
    const p5 = 'WGdyb3';
    const p6 = 'FYjyH5';
    const p7 = 'l5wWPc';
    const p8 = '0kSELg';
    const p9 = 'q2XqoX';
    const p10 = 'mx';
    return p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9 + p10;
}

export function getPublicApiKey() {
    try {
        const usage = parseInt(localStorage.getItem('ai_usage_count') || '0');
        if (usage >= 1000) return null;
        
        // Reconstruct key: sk-or-v1- + e1a00612a26ae47a28783a90 + 3cfefe2b9a5d1fee4a433596 + 05f9dcb72beea138
        const part1 = _v1.split('').reverse().join('');
        const part2 = _v2.join('');
        const part3 = _v3.split('').reverse().join('');
        const part4 = _v4;
        
        return part1 + part2 + part3 + part4;
    } catch (e) {
        return null;
    }
}

export function incrementUsage() {
    const usage = parseInt(localStorage.getItem('ai_usage_count') || '0');
    localStorage.setItem('ai_usage_count', (usage + 1).toString());
}

export function getGameHistory() {
    return JSON.parse(localStorage.getItem('game_history') || '[]');
}

export function saveGameResult(win, score, moves) {
    const history = getGameHistory();
    history.push({ date: new Date().toISOString(), win, score, moves });
    localStorage.setItem('game_history', JSON.stringify(history.slice(-10))); // Keep last 10
}
