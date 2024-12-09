const { add, subtract, Calculator } = require('../index');

describe('Utility Functions', () => {
  test('add() should correctly add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('add() should throw an error for non-number arguments', () => {
    expect(() => add('2', 3)).toThrow(TypeError);
    expect(() => add(2, '3')).toThrow(TypeError);
  });

  test('subtract() should correctly subtract two numbers', () => {
    expect(subtract(5, 3)).toBe(2);
  });

  test('subtract() should throw an error for non-number arguments', () => {
    expect(() => subtract('5', 3)).toThrow(TypeError);
    expect(() => subtract(5, '3')).toThrow(TypeError);
  });
});

describe('Calculator Class', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  test('should initialize result to 0', () => {
    expect(calculator.result).toBe(0);
  });

  test('add() should update the result', () => {
    expect(calculator.add(5)).toBe(5);
    expect(calculator.add(3)).toBe(8);
  });

  test('subtract() should update the result', () => {
    calculator.add(10);
    expect(calculator.subtract(5)).toBe(5);
  });

  test('reset() should reset the result to 0', () => {
    calculator.add(10);
    expect(calculator.reset()).toBe(0);
  });
});
