// Utility functions
function add(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new TypeError('Both arguments must be numbers');
    }
    return a + b;
  }
  
  function subtract(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new TypeError('Both arguments must be numbers');
    }
    return a - b;
  }
  
  // A simple class for demonstration
  class Calculator {
    constructor() {
      this.result = 0;
    }
  
    add(value) {
      this.result += value;
      return this.result;
    }
  
    subtract(value) {
      this.result -= value;
      return this.result;
    }
  
    reset() {
      this.result = 0;
      return this.result;
    }
  }
  
  // Exporting functions and classes
  module.exports = {
    add,
    subtract,
    Calculator,
  };
  