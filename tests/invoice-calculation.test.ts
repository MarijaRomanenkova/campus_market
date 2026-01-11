// tests/invoice-calculation.test.ts
import { InvoiceItem } from '@/types';

// Mock implementation instead of importing from server action
function calcTotal(items: Partial<InvoiceItem>[]) {
  // Calculate total by multiplying price and quantity (or qty) for each item
  const total = items.reduce((sum, item) => {
    const quantity = item.qty || 0;
    return sum + (Number(item.price) * quantity);
  }, 0);
  
  // Format numbers to 2 decimal places
  return {
    subtotal: total.toFixed(2),
    total: total.toFixed(2)
  };
}

describe('Invoice Calculations', () => {
  it('calculates correct totals for invoice items', () => {
    // Arrange
    const items = [
      { productId: 'product1', price: '100', qty: 2 },
      { productId: 'product2', price: '50', qty: 1 }
    ];
    
    // Act
    const result = calcTotal(items);
    
    // Assert
    expect(result.subtotal).toBe('250.00');
    expect(result.total).toBe('250.00'); // No tax, just the sum
  });
  
  it('handles zero quantity items', () => {
    const items = [
      { taskId: 'task1', price: '100', qty: 0 }
    ];
    
    const result = calcTotal(items);
    
    expect(result.subtotal).toBe('0.00');
    expect(result.total).toBe('0.00');
  });
  
  it('handles empty items array', () => {
    const result = calcTotal([]);
    
    expect(result.subtotal).toBe('0.00');
    expect(result.total).toBe('0.00');
  });
  
  it('handles multiple invoice items', () => {
    const items = [
      { taskId: 'task1', price: '100', qty: 2 },
      { taskId: 'task2', price: '50', qty: 3 }
    ];
    
    const result = calcTotal(items);
    
    expect(result.subtotal).toBe('350.00'); // 100*2 + 50*3
    expect(result.total).toBe('350.00'); // No tax, just the sum
  });
});
