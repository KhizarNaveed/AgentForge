import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Rewritten for Tailwind v3 + the AgentForge palette.
// (The shadcn-generated version imported the removed `cn` package and used v4-only syntax.)
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border text-sm font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#a1a1aa] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#ededed] text-[#0e0e10] hover:bg-white',
        outline: 'border-[#27272a] bg-[#0e0e10] text-[#ededed] hover:border-[#3f3f46] hover:bg-[#1c1c1f]',
        secondary: 'border-[#27272a] bg-[#161618] text-[#ededed] hover:bg-[#1c1c1f]',
        ghost: 'border-transparent bg-transparent text-[#a1a1aa] hover:bg-[#1c1c1f] hover:text-[#ededed]',
        destructive: 'border-transparent bg-red-500/10 text-red-400 hover:bg-red-500/20',
        link: 'border-transparent text-[#ededed] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-7 px-2.5 text-xs',
        lg: 'h-9 px-4',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = forwardRef(function Button({ className, variant, size, type = 'button', ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

export { Button, buttonVariants }
