const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0].includes('Error fetching') || args[0].includes('Error creating') || args[0].includes('Error updating') || args[0].includes('Error deleting') || args[0].includes('TypeError: Value is not JSON serializable')) {
    return;
  }
  originalConsoleError(...args);
};