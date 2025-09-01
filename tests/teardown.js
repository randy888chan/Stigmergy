// Jest global teardown function
// This restores the original Stigmergy configuration after all tests complete

export default async function globalTeardown() {
  if (typeof global.restoreStigmergyConfig === 'function') {
    console.log('Restoring Stigmergy configuration after tests...');
    global.restoreStigmergyConfig();
  }
}