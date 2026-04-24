// src/engine/games/registry.js

// Import implemented games
import { KlondikeRules } from './klondike.js';
import { FreeCellRules } from './freecell.js';
import { SpiderRules } from './spider.js';

class StubGameRules {
    constructor() {
        this.name = "Coming Soon";
        this.isStub = true;
        this.description = "This game variant is currently under development. Please choose a game that is already implemented (e.g., Klondike, FreeCell, Spider) to play or watch the AI.";
    }
    initialize(engine) {
        engine.tableau = [[]]; // Just to not break renderer
        engine.foundations = [];
        engine.stock = [];
        engine.waste = [];
        engine.cells = [];
    }
    getLegalMoves(engine) { return []; }
    applyMove(engine, move) { return false; }
    isGameWon(engine) { return false; }
}

export const GameRegistry = {
    // Implemented
    "Klondike": KlondikeRules,
    "FreeCell": FreeCellRules,
    "Spider": SpiderRules,
    
    // Stubbed (47 more)
    "Klondike Turn 3": StubGameRules,
    "Spider (2 Suits)": StubGameRules,
    "Spider (1 Suit)": StubGameRules,
    "Pyramid": StubGameRules,
    "TriPeaks": StubGameRules,
    "Yukon": StubGameRules,
    "Russian Solitaire": StubGameRules,
    "Golf": StubGameRules,
    "Canfield": StubGameRules,
    "Forty Thieves": StubGameRules,
    "Scorpion": StubGameRules,
    "Accordion": StubGameRules,
    "Aces Up": StubGameRules,
    "Alhambra": StubGameRules,
    "Alternations": StubGameRules,
    "Australian Patience": StubGameRules,
    "Baker's Dozen": StubGameRules,
    "Baker's Game": StubGameRules,
    "Batsford": StubGameRules,
    "Beleaguered Castle": StubGameRules,
    "Blind Alleys": StubGameRules,
    "Block Ten": StubGameRules,
    "Bristol": StubGameRules,
    "Calculation": StubGameRules,
    "Carpet": StubGameRules,
    "Clock": StubGameRules,
    "Colorado": StubGameRules,
    "Crescent": StubGameRules,
    "Cruel": StubGameRules,
    "Diplomat": StubGameRules,
    "Double Klondike": StubGameRules,
    "Duchess": StubGameRules,
    "Eagle": StubGameRules,
    "Easthaven": StubGameRules,
    "Eight Off": StubGameRules,
    "Emperor": StubGameRules,
    "Flower Garden": StubGameRules,
    "Gargantua": StubGameRules,
    "Grandfather's Clock": StubGameRules,
    "Josephine": StubGameRules,
    "King Albert": StubGameRules,
    "Miss Milligan": StubGameRules,
    "Penguin": StubGameRules,
    "Sea Towers": StubGameRules,
    "Wasp": StubGameRules,
    "Whitehead": StubGameRules,
    "Osmosis": StubGameRules
};

export const GameCategories = {
    "Popular": ["Klondike", "FreeCell", "Spider", "Pyramid", "TriPeaks"],
    "Builders": ["Klondike Turn 3", "Yukon", "Russian Solitaire", "Canfield", "Forty Thieves", "Scorpion"],
    "Pairing": ["Golf", "Aces Up", "Block Ten"],
    "Others": Object.keys(GameRegistry).filter(k => !["Klondike", "FreeCell", "Spider", "Pyramid", "TriPeaks", "Klondike Turn 3", "Yukon", "Russian Solitaire", "Canfield", "Forty Thieves", "Scorpion", "Golf", "Aces Up", "Block Ten"].includes(k))
};
