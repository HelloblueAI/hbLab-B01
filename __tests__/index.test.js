const { add, subtract, Calculator } = require('../index');

describe('Utility Functions', () => {
  describe('add()', () => {
    test('should correctly add two numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    test('should handle floating-point precision', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3, 5);
    });

    test('should handle large numbers and overflow scenarios', () => {
      const result = add(Number.MAX_VALUE, Number.MAX_VALUE);
      expect(result).toBe(Infinity);
    });

    test('should be used with higher-order functions', () => {
      const nums = [1, 2, 3, 4];
      const sum = nums.reduce((acc, val) => add(acc, val), 0);
      expect(sum).toBe(10);
    });

    test('should correctly integrate with mocks', () => {
      const mockCallback = jest.fn((a, b) => add(a, b));
      expect(mockCallback(3, 7)).toBe(10);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(3, 7);
    });
  });

  describe('subtract()', () => {
    test('should correctly subtract two numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    test('should handle negative results', () => {
      expect(subtract(3, 5)).toBe(-2);
    });

    test('should handle floating-point precision', () => {
      expect(subtract(0.3, 0.2)).toBeCloseTo(0.1, 5);
    });

    test('should integrate with higher-order functions', () => {
      const nums = [10, 3, 2];
      const result = nums.reduce((acc, val) => subtract(acc, val), 20);
      expect(result).toBe(5);
    });
  });

  describe('Integration Tests', () => {
    test('add() and subtract() together maintain consistency', () => {
      const sum = add(10, 20);
      const difference = subtract(sum, 10);
      expect(difference).toBe(20);
    });

    test('Chaining multiple operations with dynamic inputs', () => {
      const result = subtract(add(10, 15), subtract(20, 5));
      expect(result).toBe(10);
    });
  });
});

describe('Calculator Class', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  test('should initialize with result as 0', () => {
    expect(calculator.result).toBe(0);
  });

  describe('add()', () => {
    test('should handle multiple chained operations', () => {
      calculator.add(10).add(20).add(-5);
      expect(calculator.result).toBe(25);
    });

    test('should integrate with spies for debugging', () => {
      const addSpy = jest.spyOn(calculator, 'add');
      calculator.add(50);
      expect(addSpy).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(50);
      addSpy.mockRestore();
    });
  });

  describe('subtract()', () => {
    test('should handle chaining with mixed operations', () => {
      calculator.add(50).subtract(20).subtract(10);
      expect(calculator.result).toBe(20);
    });

    test('should correctly integrate with mocks for external dependencies', () => {
      const mockDependency = jest.fn((a, b) => subtract(a, b));
      expect(mockDependency(100, 40)).toBe(60);
      expect(mockDependency).toHaveBeenCalledTimes(1);
      expect(mockDependency).toHaveBeenCalledWith(100, 40);
    });
  });

  describe('reset()', () => {
    test('should maintain class integrity after reset', () => {
      calculator.add(50).reset().add(30);
      expect(calculator.result).toBe(30);
    });
  });

  describe('Advanced Scenarios', () => {
    test('Simultaneous chaining with different instances', () => {
      const calc1 = new Calculator();
      const calc2 = new Calculator();

      calc1.add(100).subtract(50);
      calc2.add(200).subtract(100);

      expect(calc1.result).toBe(50);
      expect(calc2.result).toBe(100);
    });
  });

  describe('Performance and Memory Tests', () => {
    test('should handle extremely large numbers without crashing', () => {
      calculator.add(Number.MAX_SAFE_INTEGER).add(Number.MAX_SAFE_INTEGER);
      expect(calculator.result).toBe(Number.MAX_SAFE_INTEGER * 2);
    });

    test('should maintain memory integrity during high usage', () => {
      const iterations = 1000000;
      for (let i = 0; i < iterations; i++) {
        calculator.add(1);
      }
      expect(calculator.result).toBe(iterations);
    });
  });

  describe('Property-Based Testing', () => {
    test('result should match a derived formula', () => {
      calculator.add(50).subtract(20).add(10).subtract(30);
      const operations = [50, -20, 10, -30];
      const derivedResult = operations.reduce((a, b) => a + b, 0);
      expect(calculator.result).toBe(derivedResult);
    });

    test('result should be zero after adding and subtracting the same value', () => {
      calculator.add(100).subtract(100);
      expect(calculator.result).toBe(0);
    });

    test('result should handle a series of random operations', () => {
      const operations = Array.from({ length: 100 }, () => Math.floor(Math.random() * 200) - 100);
      operations.forEach(op => {
        if (op >= 0) {
          calculator.add(op);
        } else {
          calculator.subtract(-op);
        }
      });
      const derivedResult = operations.reduce((a, b) => a + b, 0);
      expect(calculator.result).toBe(derivedResult);
    });
  });

  describe('Edge Cases', () => {
    test('should handle adding zero', () => {
      calculator.add(0);
      expect(calculator.result).toBe(0);
    });

    test('should handle subtracting zero', () => {
      calculator.subtract(0);
      expect(calculator.result).toBe(0);
    });

    test('should handle adding and subtracting large numbers', () => {
      calculator.add(Number.MAX_SAFE_INTEGER).subtract(Number.MAX_SAFE_INTEGER);
      expect(calculator.result).toBe(0);
    });

    test('should handle adding and subtracting negative numbers', () => {
      calculator.add(-50).subtract(-50);
      expect(calculator.result).toBe(0);
    });
  });
});
