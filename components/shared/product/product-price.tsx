/**
 * @module ProductPrice
 * @description A component that formats and displays price values in a stylized manner,
 * with proper currency symbol and decimal formatting. This component ensures consistent
 * price display across the application.
 */

import { cn } from '@/lib/utils';

/**
 * ProductPrice component for displaying formatted price values with Euro currency symbol.
 * The component splits the price into integer and decimal parts for stylized rendering.
 * 
 * @param {Object} props - Component props
 * @param {number} props.value - The price value to display
 * @param {string} [props.className] - Optional additional CSS classes for styling
 * @returns {JSX.Element} A formatted price display with currency symbol
 */
const ProductPrice = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  // Ensures two decimal places
  const stringValue = value.toFixed(2); 
  // Split into integer and decimal parts
  const [intValue, floatValue] = stringValue.split('.'); 

  return (
    <p className={cn('text-2xl', className)}>
      <span className='text-xs align-super'>€</span>
      {intValue}
      <span className='text-xs align-super'>.{floatValue}</span>
    </p>
  );
};

export default ProductPrice;
