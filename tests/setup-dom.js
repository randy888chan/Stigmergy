// Setup script that runs before each test file to create a fake browser environment
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// The global DOM environment is no longer registered here.
// Each frontend component test will register it locally.
// Mock fetch for frontend components
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ projects: ["project-a", "project-b"] }),
    ok: true,
  })
);
