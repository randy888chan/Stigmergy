import { mock } from 'bun:test';

// This is a mock of the INSTANCE that the class would create.
const mockStateManagerInstance = {
  initializeProject: mock().mockResolvedValue({}),
  updateStatus: mock().mockResolvedValue({}),
  updateState: mock().mockResolvedValue({}),
  getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
  on: mock(),
  emit: mock(),
};

// This is a mock of the CLASS itself. When constructed, it returns our mock instance.
// This solves the "is not a constructor" error.
const MockGraphStateManager = mock(() => mockStateManagerInstance);

export default MockGraphStateManager;