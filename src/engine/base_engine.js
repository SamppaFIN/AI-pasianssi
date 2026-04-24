// src/engine/base_engine.js
import { Card, Suits, Values } from './card.js';
import { GameRegistry } from './games/registry.js';

export class BaseEngine {
    constructor() {
        this.stock = [];
        this.waste = [];
        this.foundations = []; 
        this.tableau = []; 
        this.cells = []; // For FreeCell
        this.history = [];
        this.rules = null;
        this.gameName = "";
        this.score = 0;
    }

    loadGame(gameName) {
        this.gameName = gameName;
        const RuleClass = GameRegistry[gameName];
        if (!RuleClass) throw new Error(`Game ${gameName} not found.`);
        this.rules = new RuleClass();
        this.initialize();
    }

    initialize() {
        this.stock = [];
        this.waste = [];
        this.foundations = [];
        this.tableau = [];
        this.cells = [];
        this.history = [];
        this.score = 0;
        
        // Delegate to specific game rules
        if (this.rules) {
            this.rules.initialize(this);
        }
    }

    createDeck(decks = 1) {
        const deck = [];
        const suits = [Suits.HEARTS, Suits.DIAMONDS, Suits.CLUBS, Suits.SPADES];
        for (let d = 0; d < decks; d++) {
            for (const suit of suits) {
                for (let value = 1; value <= 13; value++) {
                    deck.push(new Card(suit, value));
                }
            }
        }
        return deck;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getLegalMoves() {
        if (!this.rules) return [];
        return this.rules.getLegalMoves(this);
    }

    applyMove(moveStr) {
        if (!this.rules) return false;
        
        // Save state for undo
        const snapshot = JSON.stringify({
            stock: this.stock,
            waste: this.waste,
            foundations: this.foundations,
            tableau: this.tableau,
            cells: this.cells
        });

        const success = this.rules.applyMove(this, moveStr);
        if (success) {
            this.history.push(snapshot);
        }
        return success;
    }

    undo() {
        if (this.history.length === 0) return;
        const snapshot = JSON.parse(this.history.pop());
        this.stock = snapshot.stock.map(data => Card.fromJSON(data));
        this.waste = snapshot.waste.map(data => Card.fromJSON(data));
        this.foundations = snapshot.foundations.map(p => p.map(data => Card.fromJSON(data)));
        this.tableau = snapshot.tableau.map(p => p.map(data => Card.fromJSON(data)));
        this.cells = snapshot.cells.map(data => data ? Card.fromJSON(data) : null);
    }

    isGameWon() {
        if (!this.rules) return false;
        return this.rules.isGameWon(this);
    }

    getStateString() {
        if (!this.rules) return "No game loaded.";
        let state = `Game: ${this.gameName}\n`;
        state += `Stock: ${this.stock.length} cards\n`;
        
        if (this.waste.length > 0) {
            state += `Waste (apupino) TOP: ${this.waste[this.waste.length - 1].toShortString()}\n`;
        } else {
            state += `Waste (apupino): Tyhjä\n`;
        }

        if (this.cells.length > 0) {
            state += `Cells:\n`;
            for (let i = 0; i < this.cells.length; i++) {
                const c = this.cells[i];
                state += `C${i}: ${c ? c.toShortString() : "Empty"}\n`;
            }
        }

        state += `Foundations:\n`;
        for (let i = 0; i < this.foundations.length; i++) {
            const f = this.foundations[i];
            const top = f.length > 0 ? f[f.length - 1].toShortString() : "Empty";
            state += `F${i}: ${top}\n`;
        }
        
        state += `Pystyrivit (Tableaus):\n`;
        for (let i = 0; i < this.tableau.length; i++) {
            const t = this.tableau[i];
            if (t.length === 0) {
                state += `T${i}: Tyhjä\n`;
            } else {
                let pileStr = `T${i}: `;
                const downCount = t.filter(c => !c.faceUp).length;
                if (downCount > 0) pileStr += `[${downCount} käännetty] `;
                const upCards = t.filter(c => c.faceUp).map(c => {
                    const colorLabel = c.color === 'red' ? '(P)' : '(M)';
                    return `${c.toShortString()}${colorLabel}`;
                }).join(" -> ");
                pileStr += upCards;
                state += pileStr + `\n`;
            }
        }

        return state;
    }
}
