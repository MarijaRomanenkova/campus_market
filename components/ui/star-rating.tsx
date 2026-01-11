"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const handleMouseOver = (index: number) => {
    if (readOnly) return;
    setHoverValue(index);
  };
  
  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverValue(0);
  };
  
  const handleClick = (index: number) => {
    if (readOnly) return;
    onChange(index);
  };
  
  return (
    <div 
      className={cn("flex", className)}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const filled = (hoverValue || value) >= index;
        return (
          <Star
            key={index}
            size={size}
            className={cn(
              "cursor-pointer transition-colors",
              filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
              readOnly && "cursor-default"
            )}
            onMouseOver={() => handleMouseOver(index)}
            onClick={() => handleClick(index)}
          />
        );
      })}
    </div>
  );
} 
