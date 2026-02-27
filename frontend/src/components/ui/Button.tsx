import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none active:scale-95",
    {
        variants: {
            variant: {
                default: "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20",
                secondary: "bg-secondary hover:bg-secondary/90 text-white",
                outline: "border border-white/20 hover:bg-white/10 text-slate-200",
                ghost: "hover:bg-white/10 text-slate-400 hover:text-white",
                glow: "bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]",
            },
            size: {
                default: "h-10 py-2 px-4",
                sm: "h-9 px-3",
                lg: "h-12 px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
