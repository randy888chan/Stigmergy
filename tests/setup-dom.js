// DEFINITIVE FIX: Replace happy-dom with jsdom for a stable, feature-complete environment.
import { JSDOM } from "jsdom";
import { TextEncoder, TextDecoder } from "util";

// Create a new JSDOM instance.
const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
  url: "http://localhost:3010", // Set a base URL for fetch requests
  pretendToBeVisual: true, // Allow requestAnimationFrame
});

// Expose the JSDOM window object and its properties globally
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;

// Polyfill missing APIs
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.getComputedStyle = window.getComputedStyle;
global.fetch = () =>
  Promise.resolve({
    json: () => Promise.resolve({ projects: ["project-a", "project-b"] }),
    ok: true,
  });
