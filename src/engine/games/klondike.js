// src/engine/games/klondike.js
import { Values } from '../card.js';

export class KlondikeRules {
    constructor() {
        this.description = "SÄÄNNÖT: KLONDIKE\n\n1. TAVOITE: Siirrä kaikki kortit neljään maapinoon (Foundations) oikeassa yläkulmassa, Ässästä (A) Kuninkaaseen (K) maittain.\n\n2. LAUTA (Tableau): Voit rakentaa pinoja alaspäin vuorovärein (esim. musta 7 punaisen 8 päälle). Voit siirtää kokonaisia oikein rakennettuja pinoja. Tyhjään sarakkeeseen voi laittaa vain Kuninkaan (K).\n\n3. PAKKA (Stock): Voit kääntää kortteja pakasta (vasen yläkulma) apupinoon (Waste). Kun pakka on tyhjä, voit kääntää apupinon uudelleen pakaksi.\n\n4. VOITTO: Peli päättyy, kun kaikki 52 korttia on siirretty maapinoihin.";
    }
    initialize(engine) {
        engine.foundations = [[], [], [], []];
        engine.tableau = [[], [], [], [], [], [], []];
        
        const deck = engine.createDeck(1);
        engine.shuffle(deck);

        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = deck.pop();
                if (i === j) card.faceUp = true;
                engine.tableau[j].push(card);
            }
        }
        engine.stock = deck;
    }

    getLegalMoves(engine) {
        const moves = [];
        
        // 1. Draw Stock
        if (engine.stock.length > 0 || engine.waste.length > 0) {
            moves.push("DRAW_STOCK");
        }

        // 2. Waste to Foundation/Tableau
        if (engine.waste.length > 0) {
            const card = engine.waste[engine.waste.length - 1];
            for (let f = 0; f < 4; f++) {
                if (this.isValidFoundationMove(card, engine.foundations[f])) {
                    moves.push(`MOVE waste 0 to foundation ${f} 1`);
                }
            }
            for (let t = 0; t < 7; t++) {
                if (this.isValidTableauMove(card, engine.tableau[t])) {
                    moves.push(`MOVE waste 0 to tableau ${t} 1`);
                }
            }
        }

        // 3. Tableau to Foundation / Tableau to Tableau
        for (let i = 0; i < 7; i++) {
            const fromPile = engine.tableau[i];
            if (fromPile.length === 0) continue;

            // To foundation (only top card)
            const topCard = fromPile[fromPile.length - 1];
            if (topCard.faceUp) {
                for (let f = 0; f < 4; f++) {
                    if (this.isValidFoundationMove(topCard, engine.foundations[f])) {
                        moves.push(`MOVE tableau ${i} to foundation ${f} 1`);
                    }
                }
            }

            // To other tableau
            // OPTION A: Move the WHOLE face-up stack (Best for revealing cards)
            const firstFaceUpIdx = fromPile.findIndex(c => c.faceUp);
            if (firstFaceUpIdx !== -1) {
                const cardToMove = fromPile[firstFaceUpIdx];
                const count = fromPile.length - firstFaceUpIdx;
                for (let t = 0; t < 7; t++) {
                    if (t === i) continue;
                    if (this.isValidTableauMove(cardToMove, engine.tableau[t])) {
                        if (cardToMove.value === Values.KING && firstFaceUpIdx === 0) continue;
                        moves.push(`MOVE tableau ${i} to tableau ${t} ${count}`);
                    }
                }
            }

            // OPTION B: Move ONLY the top card (Sometimes needed to build foundation chains)
            if (fromPile.length > 1 && fromPile[fromPile.length - 1].faceUp) {
                const topCard = fromPile[fromPile.length - 1];
                // Only suggest if it's not the same as the full stack move
                if (fromPile.length - 1 !== firstFaceUpIdx) {
                    for (let t = 0; t < 7; t++) {
                        if (t === i) continue;
                        if (this.isValidTableauMove(topCard, engine.tableau[t])) {
                            moves.push(`MOVE tableau ${i} to tableau ${t} 1`);
                        }
                    }
                }
            }
        }

        return moves;
    }

    applyMove(engine, moveStr) {
        const parts = moveStr.split(/\s+/);
        const action = parts[0];

        try {
            // New unified format: "MOVE stock 0 to waste 0"
            if (action === "MOVE") {
                const fromType = parts[1];
                const fromIdx = parseInt(parts[2]);
                const toType = parts[4];
                const toIdx = parseInt(parts[5]);
                const count = parseInt(parts[6]) || 1; 
                
                if (fromType === 'stock' && toType === 'waste') return this.applyMove(engine, "DRAW_STOCK");
                if (fromType === 'waste' && toType === 'foundation') return this.applyMove(engine, `MOVE_WASTE_TO_FOUNDATION ${toIdx}`);
                if (fromType === 'waste' && toType === 'tableau') return this.applyMove(engine, `MOVE_WASTE_TO_TABLEAU ${toIdx}`);
                if (fromType === 'tableau' && toType === 'foundation') return this.applyMove(engine, `MOVE_TABLEAU_TO_FOUNDATION ${fromIdx} ${toIdx}`);
                if (fromType === 'tableau' && toType === 'tableau') {
                    return this.applyMove(engine, `MOVE_TABLEAU_TO_TABLEAU ${fromIdx} ${toIdx} ${count}`);
                }
            }

            if (action === "DRAW_STOCK") {
                if (engine.stock.length > 0) {
                    const card = engine.stock.pop();
                    card.faceUp = true;
                    engine.waste.push(card);
                } else if (engine.waste.length > 0) {
                    while (engine.waste.length > 0) {
                        const card = engine.waste.pop();
                        card.faceUp = false;
                        engine.stock.push(card);
                    }
                }
                return true;
            }
            if (action === "MOVE_WASTE_TO_FOUNDATION") {
                const f = parseInt(parts[1]);
                const card = engine.waste[engine.waste.length - 1];
                if (this.isValidFoundationMove(card, engine.foundations[f])) {
                    engine.foundations[f].push(engine.waste.pop());
                    return true;
                }
                return false;
            }
            if (action === "MOVE_WASTE_TO_TABLEAU") {
                const t = parseInt(parts[1]);
                const card = engine.waste[engine.waste.length - 1];
                if (this.isValidTableauMove(card, engine.tableau[t])) {
                    engine.tableau[t].push(engine.waste.pop());
                    return true;
                }
                return false;
            }
            if (action === "MOVE_TABLEAU_TO_FOUNDATION") {
                const t = parseInt(parts[1]);
                const f = parseInt(parts[2]);
                const card = engine.tableau[t][engine.tableau[t].length - 1];
                if (this.isValidFoundationMove(card, engine.foundations[f])) {
                    engine.foundations[f].push(engine.tableau[t].pop());
                    this.revealTableauTop(engine.tableau[t]);
                    return true;
                }
                return false;
            }
            if (action === "MOVE_TABLEAU_TO_TABLEAU") {
                const fromT = parseInt(parts[1]);
                const toT = parseInt(parts[2]);
                const count = parseInt(parts[3]);
                const pile = engine.tableau[fromT];
                const card = pile[pile.length - count];
                if (this.isValidTableauMove(card, engine.tableau[toT])) {
                    const cards = pile.splice(pile.length - count, count);
                    engine.tableau[toT].push(...cards);
                    this.revealTableauTop(engine.tableau[fromT]);
                    return true;
                }
                return false;
            }
        } catch (e) {
            console.error("Move execution error:", e);
            return false;
        }
        return false;
    }

    isValidFoundationMove(card, foundation) {
        if (foundation.length === 0) return card.value === Values.ACE;
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.value === topCard.value + 1;
    }

    isValidTableauMove(card, tableau) {
        if (tableau.length === 0) return card.value === Values.KING;
        const topCard = tableau[tableau.length - 1];
        return topCard.faceUp && card.color !== topCard.color && card.value === topCard.value - 1;
    }

    revealTableauTop(pile) {
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
            pile[pile.length - 1].faceUp = true;
        }
    }

    isGameWon(engine) {
        return engine.foundations.every(f => f.length === 13);
    }
}
