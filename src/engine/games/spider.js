// src/engine/games/spider.js
import { Values, Suits } from '../card.js';

export class SpiderRules {
    constructor() {
        this.description = "SÄÄNNÖT: SPIDER\n\n1. TAVOITE: Kerää kaikki pöydän kortit kuninkaasta ässään (K, Q, J... 2, A) samaa maata oleviin pinoihin. Valmis pino poistuu pöydältä. Voitat, kun olet rakentanut 8 täyttä sarjaa.\n\n2. LAUTA: Voit siirtää minkä tahansa ylöspäin olevan kortin yhden arvon pienemmän päälle (esim. 5 -> 6 päälle) maasta riippumatta. Kuitenkin KAIKKIEN kerralla siirrettävien pinojen muiden korttien on oltava SAMAA MAATA ja oikeassa järjestyksessä.\n\n3. PAKKA: Kun siirtoja ei ole, klikkaa pakkaa jakaaksesi yhden uuden kortin JOKAISEEN kymmeneen pinoon. Huom: Pakasta ei voi jakaa, jos yksikään pöydän 10 sarakkeesta on täysin tyhjä.\n\n4. TYHJÄT SARAKKEET: Voit siirtää tyhjään sarakkeeseen minkä tahansa yksittäisen kortin tai oikein rakennetun saman maan pinon.";
    }
    initialize(engine) {
        engine.foundations = []; // Foundations in spider are completed sets
        engine.tableau = [[], [], [], [], [], [], [], [], [], []]; // 10 tableaus
        engine.stock = [];
        engine.waste = [];
        engine.completedSets = 0;
        
        // Spider uses 2 decks (104 cards). Standard is 4 suits, but often played with 1 or 2.
        // Let's implement standard 4-suit spider for now.
        const deck = engine.createDeck(2);
        engine.shuffle(deck);

        // Deal 54 cards: 6 to first 4 piles, 5 to last 6 piles
        for (let i = 0; i < 10; i++) {
            const count = i < 4 ? 6 : 5;
            for (let j = 0; j < count; j++) {
                const card = deck.pop();
                if (j === count - 1) card.faceUp = true;
                engine.tableau[i].push(card);
            }
        }
        engine.stock = deck; // 50 cards left, 5 deals of 10
    }

    getLegalMoves(engine) {
        const moves = [];
        
        // 1. Deal from stock
        if (engine.stock.length >= 10) {
            // Can only deal if no empty tableaus (standard rule)
            if (engine.tableau.every(t => t.length > 0)) {
                moves.push("DEAL_STOCK");
            }
        }

        // 2. Move between tableaus
        for (let i = 0; i < 10; i++) {
            const fromPile = engine.tableau[i];
            if (fromPile.length === 0) continue;

            // Find valid sequences to move
            let seqLength = 1;
            const validSequences = [1];
            for (let j = fromPile.length - 2; j >= 0; j--) {
                const upper = fromPile[j];
                const lower = fromPile[j+1];
                if (upper.faceUp && lower.faceUp && upper.suit === lower.suit && upper.value === lower.value + 1) {
                    seqLength++;
                    validSequences.push(seqLength);
                } else {
                    break;
                }
            }

            for (const count of validSequences) {
                const bottomCard = fromPile[fromPile.length - count];
                for (let t = 0; t < 10; t++) {
                    if (t === i) continue;
                    if (this.isValidTableauMove(bottomCard, engine.tableau[t])) {
                        moves.push(`MOVE_T_TO_T ${i} ${t} ${count}`);
                    }
                }
            }
        }

        // Spider completes sets automatically usually, but we could make it a move
        return moves;
    }

    applyMove(engine, moveStr) {
        const parts = moveStr.split(/\s+/);
        const action = parts[0];
        try {
            if (action === "DEAL_STOCK") {
                for (let i = 0; i < 10; i++) {
                    const card = engine.stock.pop();
                    card.faceUp = true;
                    engine.tableau[i].push(card);
                }
                this.checkCompletedSets(engine);
                return true;
            }
            if (action === "MOVE_T_TO_T") {
                const fromT = parseInt(parts[1]);
                const toT = parseInt(parts[2]);
                const count = parseInt(parts[3]);
                const pile = engine.tableau[fromT];
                const cards = pile.splice(pile.length - count, count);
                engine.tableau[toT].push(...cards);
                this.revealTableauTop(engine.tableau[fromT]);
                this.checkCompletedSets(engine);
                return true;
            }
        } catch(e) { return false; }
        return false;
    }

    isValidTableauMove(card, tableau) {
        if (tableau.length === 0) return true;
        const topCard = tableau[tableau.length - 1];
        return topCard.faceUp && card.value === topCard.value - 1; // Suit doesn't matter for placing
    }

    revealTableauTop(pile) {
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
            pile[pile.length - 1].faceUp = true;
        }
    }

    checkCompletedSets(engine) {
        for (let i = 0; i < 10; i++) {
            const pile = engine.tableau[i];
            if (pile.length >= 13) {
                // Check top 13 cards
                let isComplete = true;
                let suit = pile[pile.length - 1].suit;
                for (let j = 0; j < 13; j++) {
                    const card = pile[pile.length - 1 - j];
                    if (!card.faceUp || card.suit !== suit || card.value !== j + 1) {
                        isComplete = false;
                        break;
                    }
                }
                if (isComplete) {
                    pile.splice(pile.length - 13, 13);
                    engine.completedSets = (engine.completedSets || 0) + 1;
                    this.revealTableauTop(pile);
                }
            }
        }
    }

    isGameWon(engine) {
        return engine.completedSets === 8;
    }
}
