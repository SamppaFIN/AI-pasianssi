// src/ui/board.js

export class BoardRenderer {
    constructor(engine) {
        this.engine = engine;
        this.selectedCardInfo = null; // { pileType, pileIndex, cardIndex }
    }

    render() {
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.renderTableaus();
    }

    createCardElement(card, pileType, pileIndex, cardIndex, isTopCard) {
        const el = document.createElement('div');
        el.className = `card ${card.faceUp ? '' : 'face-down'} ${card.faceUp ? card.color : ''}`;
        
        if (card.faceUp) {
            const topDiv = document.createElement('div');
            topDiv.className = 'suit-top';
            topDiv.innerHTML = `<span>${card.valueString}</span><span>${card.suitSymbol}</span>`;
            
            const centerDiv = document.createElement('div');
            centerDiv.className = 'suit-center';
            centerDiv.innerText = card.suitSymbol;
            
            const bottomDiv = document.createElement('div');
            bottomDiv.className = 'suit-bottom';
            bottomDiv.innerHTML = `<span>${card.valueString}</span><span>${card.suitSymbol}</span>`;
            
            el.appendChild(topDiv);
            el.appendChild(centerDiv);
            el.appendChild(bottomDiv);
        }

        // Selection highlight
        if (this.selectedCardInfo && 
            this.selectedCardInfo.pileType === pileType && 
            this.selectedCardInfo.pileIndex === pileIndex &&
            this.selectedCardInfo.cardIndex === cardIndex) {
            el.classList.add('dragging'); // Reuse drag style for selection
        }

        // Interactivity
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCardClick(pileType, pileIndex, cardIndex, card, isTopCard);
        });

        return el;
    }

    renderStock() {
        const stockEl = document.getElementById('stock');
        stockEl.innerHTML = '';
        stockEl.onclick = () => {
            this.engine.drawStock();
            this.clearSelection();
            this.render();
        };

        if (this.engine.stock.length > 0) {
            const el = document.createElement('div');
            el.className = 'card face-down';
            stockEl.appendChild(el);
        } else {
            // Empty stock visual
            const el = document.createElement('div');
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.innerHTML = '🔄';
            el.style.fontSize = '2rem';
            el.style.opacity = '0.5';
            stockEl.appendChild(el);
        }
    }

    renderWaste() {
        const wasteEl = document.getElementById('waste');
        wasteEl.innerHTML = '';
        wasteEl.onclick = () => this.handlePileClick('waste', 0);

        if (this.engine.waste.length > 0) {
            // Only show top 3 max for visual neatness, but let's just show top 1 for now
            const topCard = this.engine.waste[this.engine.waste.length - 1];
            const el = this.createCardElement(topCard, 'waste', 0, this.engine.waste.length - 1, true);
            wasteEl.appendChild(el);
        }
    }

    renderFoundations() {
        for (let i = 0; i < 4; i++) {
            const fEl = document.getElementById(`foundation-${i}`);
            fEl.innerHTML = '';
            fEl.onclick = () => this.handlePileClick('foundation', i);

            const pile = this.engine.foundations[i];
            if (pile.length > 0) {
                const topCard = pile[pile.length - 1];
                const el = this.createCardElement(topCard, 'foundation', i, pile.length - 1, true);
                fEl.appendChild(el);
            }
        }
    }

    renderTableaus() {
        for (let i = 0; i < 7; i++) {
            const tEl = document.getElementById(`tableau-${i}`);
            tEl.innerHTML = '';
            tEl.onclick = () => this.handlePileClick('tableau', i);

            const pile = this.engine.tableau[i];
            pile.forEach((card, index) => {
                const el = this.createCardElement(card, 'tableau', i, index, index === pile.length - 1);
                // Stack cards with offset
                const offset = index * 25; // 25px offset
                el.style.top = `${offset}px`;
                tEl.appendChild(el);
            });
        }
    }

    clearSelection() {
        this.selectedCardInfo = null;
    }

    handleCardClick(pileType, pileIndex, cardIndex, card, isTopCard) {
        if (!card.faceUp) return;

        if (!this.selectedCardInfo) {
            // Select card
            this.selectedCardInfo = { pileType, pileIndex, cardIndex, count: this.engine.tableau[pileIndex]?.length - cardIndex || 1 };
            this.render();
        } else {
            // We have a selection, try to move it here (treat clicking top card same as clicking pile)
            this.handlePileClick(pileType, pileIndex);
        }
    }

    handlePileClick(targetPileType, targetPileIndex) {
        if (!this.selectedCardInfo) {
            // Can't select empty pile
            return;
        }

        const { pileType: srcType, pileIndex: srcIndex, count } = this.selectedCardInfo;
        let success = false;

        if (srcType === 'waste') {
            if (targetPileType === 'foundation') {
                success = this.engine.moveWasteToFoundation(targetPileIndex);
            } else if (targetPileType === 'tableau') {
                success = this.engine.moveWasteToTableau(targetPileIndex);
            }
        } else if (srcType === 'tableau') {
            if (targetPileType === 'foundation' && count === 1) {
                success = this.engine.moveTableauToFoundation(srcIndex, targetPileIndex);
            } else if (targetPileType === 'tableau') {
                success = this.engine.moveTableauToTableau(srcIndex, targetPileIndex, count);
            }
        }

        this.clearSelection();
        this.render();

        if (success && this.engine.isGameWon()) {
            setTimeout(() => alert("You win!"), 100);
        }
    }
}
