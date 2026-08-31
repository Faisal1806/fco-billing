
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StarProps extends React.SVGProps<SVGSVGElement> {
  isFilled: boolean;
  isHalf: boolean;
  isHovered: boolean;
}

const StarIcon = ({ isFilled, isHovered, ...props }: StarProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={cn('rating_star', {
        'filled': isFilled,
        'hovered': isHovered,
    })}
    {...props}
  >
    <defs>
        <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" style={{ stopColor: 'currentColor' }} />
            <stop offset="50%" style={{ stopColor: 'var(--star-background)', stopOpacity: 1 }} />
        </linearGradient>
    </defs>
    <path
      className="rating_star-stroke"
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
     <path
      className="rating_star-fill"
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </svg>
);


interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  totalStars?: number;
}

export function StarRating({
  rating = 0,
  onRatingChange,
  totalStars = 5,
}: StarRatingProps) {
  const [hover, setHover] = React.useState<number | null>(null);

  const labels: { [key: number]: string } = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const currentLabel = labels[hover || rating] || '';

  return (
    <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-1">
        {[...Array(totalStars)].map((_, index) => {
            const starValue = index + 1;
            return (
            <label key={starValue} className="cursor-pointer">
                <input
                type="radio"
                name="rating"
                value={starValue}
                className="sr-only"
                onClick={() => onRatingChange(starValue)}
                />
                <StarIcon
                    width="2.5em"
                    height="2.5em"
                    isFilled={starValue <= (hover || rating)}
                    isHovered={hover !== null}
                    isHalf={false}
                    onMouseEnter={() => setHover(starValue)}
                    onMouseLeave={() => setHover(null)}
                    className="text-yellow-400"
                />
            </label>
            );
        })}
        </div>
         {currentLabel && (
            <p className="text-lg font-semibold text-gray-400 min-h-[28px]">{currentLabel}</p>
        )}
    </div>
  );
}

    



