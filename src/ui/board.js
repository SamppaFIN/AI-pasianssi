// src/ui/board.js

export class BoardRenderer {
    constructor(engine, effects, thoughtBubbles) {
        this.engine = engine;
        this.effects = effects;
        this.thoughtBubbles = thoughtBubbles;
        this.selectedCardInfo = null;
        console.log("BoardRenderer initialized. thoughtBubbles:", !!this.thoughtBubbles);
    }

    render() {
        this.renderTop();
        this.renderBottom();
        this.updateScore();
    }

    updateScore() {
        const scoreEl = document.getElementById('score-display');
        if (scoreEl) scoreEl.innerText = this.engine.score;
    }

    createCardElement(card, pileType, pileIndex, cardIndex, isTopCard) {
        const wrapper = document.createElement('div');
        wrapper.className = `card-wrapper`;
        wrapper.dataset.pileType = pileType;
        wrapper.dataset.pileIndex = pileIndex;
        wrapper.dataset.cardIndex = cardIndex;
        
        const inner = document.createElement('div');
        inner.className = `card-inner ${card.faceUp ? '' : 'is-flipped'}`;
        
        // Front side
        const front = document.createElement('div');
        front.className = `card-face card-front ${card.color}`;
        front.innerHTML = `
            <div class="suit-top"><span>${card.valueString}</span><span>${card.suitSymbol}</span></div>
            <div class="suit-center">${card.suitSymbol}</div>
            <div class="suit-bottom"><span>${card.valueString}</span><span>${card.suitSymbol}</span></div>
        `;
        
        // Back side
        const back = document.createElement('div');
        back.className = `card-face card-back`;

        inner.appendChild(front);
        inner.appendChild(back);
        wrapper.appendChild(inner);

        // Drag and Drop
        if (card.faceUp) {
            wrapper.draggable = true;
            wrapper.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    pileType, pileIndex, cardIndex
                }));
                wrapper.classList.add('is-being-dragged');
            });
            wrapper.addEventListener('dragend', () => {
                wrapper.classList.remove('is-being-dragged');
            });
            
            // Allow dropping on top of face-up cards
            wrapper.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                wrapper.classList.add('highlight');
            });
            wrapper.addEventListener('dragleave', () => wrapper.classList.remove('highlight'));
            wrapper.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                wrapper.classList.remove('highlight');
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    this.handlePileClick(data.pileType, data.pileIndex, data.cardIndex, pileType, pileIndex);
                } catch(err) { console.error("Drop failed", err); }
            });
        }

        if (this.selectedCardInfo && 
            this.selectedCardInfo.pileType === pileType && 
            this.selectedCardInfo.pileIndex === pileIndex &&
            this.selectedCardInfo.cardIndex === cardIndex) {
            wrapper.classList.add('dragging');
        }

        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCardClick(pileType, pileIndex, cardIndex, card, isTopCard);
        });

        return wrapper;
    }

    async animateMove(fromType, fromIdx, toType, toIdx, fromCardIdx = null) {
        // Find all card elements in this stack starting from fromCardIdx
        let selector = `.card-wrapper[data-pile-type="${fromType}"][data-pile-index="${fromIdx}"]`;
        let cardEls = Array.from(document.querySelectorAll(selector));
        
        if (fromCardIdx !== null) {
            cardEls = cardEls.filter(el => parseInt(el.dataset.cardIndex) >= fromCardIdx);
        } else {
            // Default to top card if no index provided
            cardEls = [cardEls[cardEls.length - 1]];
        }

        if (cardEls.length === 0) return;

        // Find target position
        const targetPile = document.querySelector(`.${toType}-pile[data-pile-index="${toIdx}"]`) 
                        || document.querySelector(`.card-wrapper[data-pile-type="${toType}"][data-pile-index="${toIdx}"]:last-child`);
        
        if (!targetPile) return;

        const endRect = targetPile.getBoundingClientRect();
        
        const animations = cardEls.map((el, i) => {
            const startRect = el.getBoundingClientRect();
            const deltaX = endRect.left - startRect.left;
            // For tableau targets, we might want to offset them, but for now simple target top is fine
            const deltaY = (endRect.top - startRect.top) + (toType === 'tableau' ? i * 20 : 0);

            el.style.zIndex = (10000 + i).toString();
            el.style.transition = "transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)";
            el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            return new Promise(resolve => setTimeout(resolve, 400));
        });

        await Promise.all(animations);
    }

    createEmptyPile(pileType, pileIndex, clickHandler, label = '') {
        const el = document.createElement('div');
        el.className = `pile ${pileType}-pile`;
        el.dataset.suit = label;
        el.dataset.pileIndex = pileIndex;
        el.dataset.pileType = pileType;
        
        // Drop handling for empty piles
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.classList.add('highlight');
        });
        el.addEventListener('dragleave', () => el.classList.remove('highlight'));
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            el.classList.remove('highlight');
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.handlePileClick(data.pileType, data.pileIndex, data.cardIndex, pileType, pileIndex);
        });

        el.addEventListener('click', () => clickHandler(pileIndex));
        return el;
    }

    renderTop() {
        const boardTop = document.getElementById('board-top');
        boardTop.innerHTML = '';

        // Left Group (Stock & Waste)
        if (this.engine.gameName !== 'FreeCell') { // Freecell doesn't have stock/waste usually
            const leftGroup = document.createElement('div');
            leftGroup.className = 'section-group';
            
            // Stock Button (Nosta kortti)
            const isStockEmpty = this.engine.stock.length === 0;
            const canReset = this.engine.waste.length > 0;
            let stockText = "Nosta kortti";
            if (isStockEmpty) {
                stockText = canReset ? "Sekoita pakka" : "Tyhjä";
            }

            const stockPile = this.createEmptyPile('stock', 0, () => {
                const success = this.engine.applyMove("DRAW_STOCK");
                if (success && this.engine.waste.length > 0) {
                    const newCard = this.engine.waste[this.engine.waste.length - 1];
                    this.thoughtBubbles?.show(`Nostetaan pakasta: ${newCard.toShortString()}`);
                }
                this.clearSelection();
                this.render();
            });
            stockPile.classList.add('stock');
            if (isStockEmpty && !canReset) stockPile.classList.add('empty');
            stockPile.innerText = stockText;
            leftGroup.appendChild(stockPile);

            // Waste
            const wastePile = this.createEmptyPile('waste', 0, () => this.handlePileClick('waste', 0));
            if (this.engine.waste.length > 0) {
                const topCard = this.engine.waste[this.engine.waste.length - 1];
                wastePile.appendChild(this.createCardElement(topCard, 'waste', 0, this.engine.waste.length - 1, true));
            }
            leftGroup.appendChild(wastePile);

            boardTop.appendChild(leftGroup);
        }

        // Center Group (Cells for FreeCell)
        if (this.engine.cells.length > 0) {
            const centerGroup = document.createElement('div');
            centerGroup.className = 'section-group';
            for (let i = 0; i < this.engine.cells.length; i++) {
                const cellPile = this.createEmptyPile('cell', i, () => this.handlePileClick('cell', i));
                if (this.engine.cells[i]) {
                    cellPile.appendChild(this.createCardElement(this.engine.cells[i], 'cell', i, 0, true));
                }
                centerGroup.appendChild(cellPile);
            }
            boardTop.appendChild(centerGroup);
        }

        // Right Group (Foundations)
        if (this.engine.foundations.length > 0) {
            const rightGroup = document.createElement('div');
            rightGroup.className = 'section-group';
            const suits = ['♥', '♦', '♣', '♠']; // Generic labels
            for (let i = 0; i < this.engine.foundations.length; i++) {
                const fPile = this.createEmptyPile('foundation', i, () => this.handlePileClick('foundation', i), suits[i%4]);
                const pile = this.engine.foundations[i];
                if (pile.length > 0) {
                    const topCard = pile[pile.length - 1];
                    fPile.appendChild(this.createCardElement(topCard, 'foundation', i, pile.length - 1, true));
                }
                rightGroup.appendChild(fPile);
            }
            boardTop.appendChild(rightGroup);
        }
    }

    renderBottom() {
        const boardBottom = document.getElementById('board-bottom');
        boardBottom.innerHTML = '';

        for (let i = 0; i < this.engine.tableau.length; i++) {
            const tPile = this.createEmptyPile('tableau', i, () => this.handlePileClick('tableau', i));
            
            const pile = this.engine.tableau[i];
            pile.forEach((card, index) => {
                const el = this.createCardElement(card, 'tableau', i, index, index === pile.length - 1);
                // Dynamically offset cards. Less offset if too many cards.
                const offsetAmount = pile.length > 15 ? 15 : 25;
                el.style.top = `${index * offsetAmount}px`;
                tPile.appendChild(el);
            });
            boardBottom.appendChild(tPile);
        }
    }

    clearSelection() {
        this.selectedCardInfo = null;
    }

    handleCardClick(pileType, pileIndex, cardIndex, card, isTopCard) {
        if (!card.faceUp) return;

        if (!this.selectedCardInfo) {
            this.selectedCardInfo = { pileType, pileIndex, cardIndex };
            this.render();
        } else {
            this.handlePileClick(
                this.selectedCardInfo.pileType, 
                this.selectedCardInfo.pileIndex, 
                this.selectedCardInfo.cardIndex,
                pileType, 
                pileIndex
            );
        }
    }

    async handlePileClick(fromType, fromIdx, cardIdx, targetType, targetIdx) {
        // If we only got target info (from a click on empty space), use selection
        if (arguments.length === 2 && this.selectedCardInfo) {
            targetType = arguments[0];
            targetIdx = arguments[1];
            fromType = this.selectedCardInfo.pileType;
            fromIdx = this.selectedCardInfo.pileIndex;
            cardIdx = this.selectedCardInfo.cardIndex;
        }

        if (!fromType) return;

        // Calculate count for stack moves
        let count = 1;
        if (fromType === 'tableau') {
            const pile = this.engine.tableau[fromIdx];
            count = pile.length - cardIdx;
        }

        const cmd = `MOVE ${fromType} ${fromIdx} to ${targetType} ${targetIdx} ${count}`;
        console.log("Executing move command:", cmd);
        
        const success = this.engine.applyMove(cmd);
        
        if (success) {
            // Scoring
            if (targetType === 'foundation') this.engine.score += 10;
            if (targetType === 'tableau' && fromType === 'waste') this.engine.score += 5;

            // Check if move revealed a new card in tableau
            const pile = this.engine.tableau[fromIdx];
            if (fromType === 'tableau' && pile.length > 0 && pile[pile.length - 1].faceUp) {
                // If the top card is now faceUp but it was hidden before (handled by engine)
                // we can assume it was revealed. 
                this.engine.score += 5;
            }

            // Animation loop
            this.engine.undo(); 
            await this.animateMove(fromType, fromIdx, targetType, targetIdx, cardIdx);
            this.engine.applyMove(cmd); 
            
            const targetEl = document.querySelector(`[data-pile-type="${targetType}"][data-pile-index="${targetIdx}"]`);
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                this.effects.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, '#60a5fa');
            }

            if (this.engine.isGameWon()) {
                this.effects.celebrate();
                import('./ai/config.js').then(m => m.saveGameResult(true, this.engine.score, this.engine.history.length));
                setTimeout(() => alert("Voitit pelin!"), 500);
            }
        }

        this.clearSelection();
        this.render();
    }
}
