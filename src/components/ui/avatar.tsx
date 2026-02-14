import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'full' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-xl',
};

// Request 2x resolution for sharp rendering on retina displays
const imageSizes = { sm: 64, md: 80, lg: 96, xl: 160 };

const roundedStyles = { full: 'rounded-full', lg: 'rounded-lg' };

export function Avatar({
  src,
  name,
  size = 'md',
  rounded = 'full',
  className,
}: AvatarProps) {
  const rounding = roundedStyles[rounded];

  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? 'Avatar'}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={cn('object-cover', rounding, sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-primary text-primary-foreground font-medium',
        rounding,
        sizeStyles[size],
        className,
      )}
    >
      {name ? getInitials(name) : '?'}
    </div>
  );
}
