// Setup script that runs before each test file to create a fake browser environment
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register the global DOM environment
GlobalRegistrator.register();