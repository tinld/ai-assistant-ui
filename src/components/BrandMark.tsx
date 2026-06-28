import React from 'react';
import { Orbit, Sparkles } from 'lucide-react';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-11 w-11 rounded-2xl',
  lg: 'h-14 w-14 rounded-2xl',
} as const;

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 'md', className = '' }) => (
  <div className={`brand-mark ${sizeClasses[size]} ${className}`} aria-hidden="true">
    <Orbit className={`brand-mark__orbit ${iconSizeClasses[size]}`} />
    <Sparkles className="brand-mark__spark h-3 w-3" />
  </div>
);
