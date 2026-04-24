// src/engine/card.js

export const Suits = {
    HEARTS: 'hearts',
    DIAMONDS: 'diamonds',
    CLUBS: 'clubs',
    SPADES: 'spades'
};

export const Values = {
    ACE: 1,
    TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9, TEN: 10,
    JACK: 11,
    QUEEN: 12,
    KING: 13
};

export class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.faceUp = false;
    }

    flip() {
        this.faceUp = !this.faceUp;
    }

    get color() {
        return (this.suit === Suits.HEARTS || this.suit === Suits.DIAMONDS) ? 'red' : 'black';
    }

    get valueString() {
        switch (this.value) {
            case Values.ACE: return 'A';
            case Values.JACK: return 'J';
            case Values.QUEEN: return 'Q';
            case Values.KING: return 'K';
            default: return this.value.toString();
        }
    }

    get suitSymbol() {
        switch (this.suit) {
            case Suits.HEARTS: return '♥';
            case Suits.DIAMONDS: return '♦';
            case Suits.CLUBS: return '♣';
            case Suits.SPADES: return '♠';
            default: return '';
        }
    }

    toString() {
        if (!this.faceUp) return "[Face Down]";
        return `${this.valueString} of ${this.suit}`;
    }

    toShortString() {
        if (!this.faceUp) return "XX";
        const suitInitial = this.suit.charAt(0).toUpperCase();
        return `${this.valueString}${suitInitial}`;
    }
}
