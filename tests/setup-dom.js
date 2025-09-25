import { GlobalRegistrator } from '@happy-dom/global-registrator';

// This single line creates a fake browser environment (DOM) for any
// test file that needs to render React components.
GlobalRegistrator.register();
