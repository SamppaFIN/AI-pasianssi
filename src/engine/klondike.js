// src/engine/klondike.js
import { Card, Suits, Values } from './card.js';

export class KlondikeEngine {
    constructor() {
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []]; // 4 piles
        this.tableau = [[], [], [], [], [], [], []]; // 7 piles
        this.history = [];
    }

    initialize() {
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.history = [];

        // Create deck
        const deck = [];
        const suits = [Suits.HEARTS, Suits.DIAMONDS, Suits.CLUBS, Suits.SPADES];
        for (const suit of suits) {
            for (let value = 1; value <= 13; value++) {
                deck.push(new Card(suit, value));
            }
        }

        // Shuffle deck
        this.shuffle(deck);

        // Deal to tableau
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = deck.pop();
                if (i === j) card.faceUp = true;
                this.tableau[j].push(card);
            }
        }

        // Remaining to stock
        this.stock = deck;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Move Actions
    drawStock() {
        this.saveState();
        if (this.stock.length > 0) {
            const card = this.stock.pop();
            card.faceUp = true;
            this.waste.push(card);
            return true;
        } else if (this.waste.length > 0) {
            // Reset waste to stock
            while (this.waste.length > 0) {
                const card = this.waste.pop();
                card.faceUp = false;
                this.stock.push(card);
            }
            return true;
        }
        return false;
    }

    isValidFoundationMove(card, fIndex) {
        const foundation = this.foundations[fIndex];
        if (foundation.length === 0) {
            return card.value === Values.ACE;
        }
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.value === topCard.value + 1;
    }

    isValidTableauMove(card, tIndex) {
        const tableau = this.tableau[tIndex];
        if (tableau.length === 0) {
            return card.value === Values.KING;
        }
        const topCard = tableau[tableau.length - 1];
        return topCard.faceUp && card.color !== topCard.color && card.value === topCard.value - 1;
    }

    moveWasteToFoundation(fIndex) {
        if (this.waste.length === 0) return false;
        const card = this.waste[this.waste.length - 1];
        if (this.isValidFoundationMove(card, fIndex)) {
            this.saveState();
            this.foundations[fIndex].push(this.waste.pop());
            return true;
        }
        return false;
    }

    moveWasteToTableau(tIndex) {
        if (this.waste.length === 0) return false;
        const card = this.waste[this.waste.length - 1];
        if (this.isValidTableauMove(card, tIndex)) {
            this.saveState();
            this.tableau[tIndex].push(this.waste.pop());
            return true;
        }
        return false;
    }

    moveTableauToFoundation(tIndex, fIndex) {
        const tableau = this.tableau[tIndex];
        if (tableau.length === 0) return false;
        const card = tableau[tableau.length - 1];
        if (card.faceUp && this.isValidFoundationMove(card, fIndex)) {
            this.saveState();
            this.foundations[fIndex].push(tableau.pop());
            this.revealTableauTop(tIndex);
            return true;
        }
        return false;
    }

    moveTableauToTableau(fromIndex, toIndex, count) {
        const fromPile = this.tableau[fromIndex];
        if (fromPile.length < count) return false;

        const cardsToMove = fromPile.slice(fromPile.length - count);
        const bottomCardToMove = cardsToMove[0];

        if (!bottomCardToMove.faceUp) return false;

        if (this.isValidTableauMove(bottomCardToMove, toIndex)) {
            this.saveState();
            this.tableau[fromIndex] = fromPile.slice(0, fromPile.length - count);
            this.tableau[toIndex] = this.tableau[toIndex].concat(cardsToMove);
            this.revealTableauTop(fromIndex);
            return true;
        }
        return false;
    }

    revealTableauTop(tIndex) {
        const pile = this.tableau[tIndex];
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
            pile[pile.length - 1].faceUp = true;
        }
    }

    saveState() {
        // Deep copy not strictly needed for history unless undo is implemented,
        // but good for tracking if needed. We'll skip deep copy for now to save memory,
        // just a stub.
    }

    isGameWon() {
        return this.foundations.every(f => f.length === 13);
    }

    // For AI to understand the state
    getStateString() {
        let state = "Current Solitaire Board State:\n";
        
        state += `Stock: ${this.stock.length} cards\n`;
        
        const wasteTop = this.waste.length > 0 ? this.waste[this.waste.length - 1].toShortString() : "Empty";
        state += `Waste Top: ${wasteTop}\n\n`;

        state += `Foundations:\n`;
        for (let i = 0; i < 4; i++) {
            const f = this.foundations[i];
            const top = f.length > 0 ? f[f.length - 1].toShortString() : "Empty";
            state += `F${i}: ${top}\n`;
        }
        state += `\n`;

        state += `Tableaus:\n`;
        for (let i = 0; i < 7; i++) {
            const t = this.tableau[i];
            if (t.length === 0) {
                state += `T${i}: Empty\n`;
            } else {
                let pileStr = `T${i}: `;
                const downCount = t.filter(c => !c.faceUp).length;
                if (downCount > 0) pileStr += `[${downCount} down] `;
                const upCards = t.filter(c => c.faceUp).map(c => c.toShortString()).join(" -> ");
                pileStr += upCards;
                state += pileStr + `\n`;
            }
        }

        return state;
    }
}
