import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "glass-card rounded-xl border border-white/5 p-6",
                className
            )}
            {...props}
        />
    )
);
Card.displayName = "Card";

export { Card };
