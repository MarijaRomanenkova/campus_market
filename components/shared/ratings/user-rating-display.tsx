'use client';

import { StarRatingDisplay } from '@/components/ui/star-rating-display';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserRatingDisplayProps {
  rating: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  tooltipText?: string;
}

/**
 * User Rating Display Component
 * 
 * A compact component for displaying user ratings with stars and optional decimal value
 * 
 * @param {UserRatingDisplayProps} props - Component properties
 * @returns {JSX.Element} The rendered rating display
 */
export default function UserRatingDisplay({ 
  rating, 
  size = 'sm',
  tooltipText
}: UserRatingDisplayProps) {
  // Convert rating to number and check if it's valid
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating === 0) return null;
  
  const starSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24;
  const textClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';
  
  const content = (
    <div className="flex items-center gap-1.5">
      <StarRatingDisplay value={numericRating} size={starSize} />
      <span className={`text-muted-foreground ${textClass}`}>
        {numericRating.toFixed(1)}
      </span>
    </div>
  );
  
  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return content;
} 
