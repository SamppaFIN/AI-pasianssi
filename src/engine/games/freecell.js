// src/engine/games/freecell.js
import { Values } from '../card.js';

export class FreeCellRules {
    constructor() {
        this.description = "SÄÄNNÖT: FREECELL\n\n1. TAVOITE: Siirrä kaikki kortit neljään maapinoon oikealla, Ässästä Kuninkaaseen maittain.\n\n2. VAPAAT SOLUT (Cells): Vasemmalla on 4 tyhjää solua. Voit siirtää mihin tahansa tyhjään soluun väliaikaisesti yhden kortin.\n\n3. LAUTA (Tableau): Kortteja rakennetaan alaspäin vuorovärein (esim. musta 7 punaisen 8 päälle). Voit siirtää kerrallaan vain yhden kortin, ellei sinulla ole tarpeeksi vapaita soluja apuna pinojen siirtämiseen (Peli tekee tämän automaattisesti, jos sallittua).\n\n4. TYHJÄT SARAKKEET: Voit siirtää minkä tahansa vapaan kortin tyhjään taulusarakkeeseen.";
    }
    initialize(engine) {
        engine.foundations = [[], [], [], []];
        engine.tableau = [[], [], [], [], [], [], [], []]; // 8 tableaus
        engine.cells = [null, null, null, null]; // 4 free cells
        engine.stock = [];
        engine.waste = [];
        
        const deck = engine.createDeck(1);
        engine.shuffle(deck);

        // Deal all cards face up
        let t = 0;
        while (deck.length > 0) {
            const card = deck.pop();
            card.faceUp = true;
            engine.tableau[t].push(card);
            t = (t + 1) % 8;
        }
    }

    getLegalMoves(engine) {
        const moves = [];
        // Moves are similar, but we have cells.
        // We will just do a basic implementation for now.
        // For brevity and AI, let's keep it simple: no auto-multi-card moves, only single card moves.
        // To move multiple cards, the user/AI must move them one by one through free cells.

        const getTopCards = () => {
            const tops = [];
            for(let i=0; i<8; i++) if(engine.tableau[i].length > 0) tops.push({loc: 't', i, c: engine.tableau[i][engine.tableau[i].length - 1]});
            for(let i=0; i<4; i++) if(engine.cells[i]) tops.push({loc: 'c', i, c: engine.cells[i]});
            return tops;
        };

        const tops = getTopCards();

        for (const {loc, i, c} of tops) {
            // To foundation
            for (let f = 0; f < 4; f++) {
                if (this.isValidFoundationMove(c, engine.foundations[f])) {
                    moves.push(`MOVE_${loc.toUpperCase()}_TO_F ${i} ${f}`);
                }
            }
            // To tableau
            for (let t = 0; t < 8; t++) {
                if (loc === 't' && t === i) continue;
                if (this.isValidTableauMove(c, engine.tableau[t])) {
                    moves.push(`MOVE_${loc.toUpperCase()}_TO_T ${i} ${t}`);
                }
            }
            // To free cell
            if (loc === 't') {
                for (let ci = 0; ci < 4; ci++) {
                    if (!engine.cells[ci]) {
                        moves.push(`MOVE_T_TO_C ${i} ${ci}`);
                        break; // Just need one free cell move
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
            if (action === "MOVE_T_TO_F") {
                engine.foundations[parseInt(parts[2])].push(engine.tableau[parseInt(parts[1])].pop());
                return true;
            }
            if (action === "MOVE_C_TO_F") {
                engine.foundations[parseInt(parts[2])].push(engine.cells[parseInt(parts[1])]);
                engine.cells[parseInt(parts[1])] = null;
                return true;
            }
            if (action === "MOVE_T_TO_T") {
                engine.tableau[parseInt(parts[2])].push(engine.tableau[parseInt(parts[1])].pop());
                return true;
            }
            if (action === "MOVE_C_TO_T") {
                engine.tableau[parseInt(parts[2])].push(engine.cells[parseInt(parts[1])]);
                engine.cells[parseInt(parts[1])] = null;
                return true;
            }
            if (action === "MOVE_T_TO_C") {
                engine.cells[parseInt(parts[2])] = engine.tableau[parseInt(parts[1])].pop();
                return true;
            }
        } catch (e) { return false; }
        return false;
    }

    isValidFoundationMove(card, foundation) {
        if (foundation.length === 0) return card.value === Values.ACE;
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.value === topCard.value + 1;
    }

    isValidTableauMove(card, tableau) {
        if (tableau.length === 0) return true; // FreeCell allows any card to empty tableau
        const topCard = tableau[tableau.length - 1];
        return card.color !== topCard.color && card.value === topCard.value - 1;
    }

    isGameWon(engine) {
        return engine.foundations.every(f => f.length === 13);
    }
}
