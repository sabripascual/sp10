import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-bold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // amarillo: usar UNA sola vez por pantalla
        primary: "bg-accent text-accent-fg",
        secondary: "bg-surface text-fg",
        outline: "border border-muted text-fg bg-transparent",
        ghost: "text-fg hover:bg-surface",
      },
      size: {
        default: "h-12 px-5 text-base",
        lg: "h-14 px-6 text-lg",
        sm: "h-9 px-3 text-sm",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
