// Definitive Frontend Test Setup Script
// This script provides a stable, isolated, and correctly ordered environment for all frontend component tests.

// 1. Create the DOM Environment
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3010',
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.getComputedStyle = window.getComputedStyle;

// 2. Mock Browser-Specific APIs
// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Canvas API for swarm visualizer
if (window.HTMLCanvasElement) {
    window.HTMLCanvasElement.prototype.getContext = () => {
        return {
            fillRect: () => {},
            clearRect: () => {},
            getImageData: (x, y, w, h) => {
                return {
                    data: new Array(w * h * 4),
                };
            },
            putImageData: () => {},
            createImageData: () => [],
            setTransform: () => {},
            drawImage: () => {},
            save: () => {},
            fillText: () => {},
            restore: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            stroke: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            arc: () => {},
            fill: () => {},
            measureText: () => {
                return { width: 0 };
            },
            transform: () => {},
            rect: () => {},
            clip: () => {},
        };
    };
}


// 3. Extend the DOM with Testing Library Matchers
import '@testing-library/jest-dom';
