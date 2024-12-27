// Utility functions
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;

// A simple class for demonstration
class Calculator {
  constructor() {
    this.result = 0;
  }

  add(value) {
    this.result += value;
    return this; // Ensure chainability
  }

  subtract(value) {
    this.result -= value;
    return this; // Ensure chainability
  }

  reset() {
    this.result = 0;
    return this; // Ensure chainability
  }
}

// Exporting functions and classes
module.exports = {
  add,
  subtract,
  Calculator,
};
