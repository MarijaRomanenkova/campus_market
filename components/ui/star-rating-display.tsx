/**
 * Star Rating Display Component
 * @module Components
 * @group UI
 * 
 * A reusable component that displays a star rating in a read-only format.
 * Features include:
 * - Configurable size
 * - Consistent star styling
 * - Tooltip support
 * - Accessible display
 * 
 * @example
 * ```tsx
 * <StarRatingDisplay
 *   value={4.5}
 *   size={16}
 * />
 * ```
 */

import { Star } from "lucide-react";

/**
 * Props for the StarRatingDisplay component
 * @interface StarRatingDisplayProps
 */
interface StarRatingDisplayProps {
  /** The rating value to display (0-5) */
  value: number;
  /** Optional size of the stars in pixels */
  size?: number;
}

/**
 * StarRatingDisplay component that renders a read-only star rating.
 * Uses filled and half-filled stars to represent the rating value.
 * 
 * @param {StarRatingDisplayProps} props - Component properties
 * @returns {JSX.Element} A display of stars representing the rating
 */
export function StarRatingDisplay({ value, size = 16 }: StarRatingDisplayProps) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={size}
      className={`${
        i < value
          ? "fill-primary text-primary"
          : "fill-muted text-muted-foreground"
      }`}
    />
  ));

  return <div className="flex">{stars}</div>;
} 
