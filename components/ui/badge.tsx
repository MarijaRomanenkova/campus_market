import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning:
          "border-transparent bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] shadow hover:bg-[hsl(var(--warning))]/80",
        paid:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        unpaid:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        pending:
          "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
        inProgress:
          "border-blue-500 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
        completed:
          "border-green-500 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
        cancelled:
          "border-red-500 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
        archived:
          "border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
