// src/ui/thought_bubbles.js

export class ThoughtBubbles {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'thought-bubbles-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 8rem;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        `;
        document.body.appendChild(this.container);
    }

    show(text, duration = 2000) {
        const bubble = document.createElement('div');
        bubble.className = 'thought-bubble glass-panel';
        bubble.style.cssText = `
            padding: 0.75rem 1.25rem;
            border-radius: 1rem;
            border-bottom-left-radius: 0;
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid var(--accent-primary);
            color: var(--text-main);
            font-size: 0.9rem;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: bubble-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            max-width: 250px;
        `;
        bubble.innerText = text;
        
        this.container.appendChild(bubble);

        setTimeout(() => {
            bubble.style.animation = 'bubble-out 0.3s ease forwards';
            setTimeout(() => bubble.remove(), 300);
        }, duration);
    }
}

// Add animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes bubble-in {
        from { opacity: 0; transform: translateY(20px) scale(0.8); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes bubble-out {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-20px) scale(0.8); }
    }
`;
document.head.appendChild(style);
