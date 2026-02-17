import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
    value?: string
    onValueChange: (value: string) => void
} | null>(null)

const AccordionItemContext = React.createContext<{
    value: string
    isOpen: boolean
} | null>(null)

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        type?: "single" | "multiple"
        collapsible?: boolean
        defaultValue?: string
        onValueChange?: (value: string) => void
    }
>(({ className, type = "single", collapsible = false, defaultValue, children, ...props }, ref) => {
    const [value, setValue] = React.useState<string | undefined>(defaultValue)

    const handleValueChange = (newValue: string) => {
        if (type === "single") {
            setValue(prev => (collapsible && prev === newValue ? undefined : newValue))
        }
    }

    return (
        <AccordionContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div ref={ref} className={className} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value: itemValue, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const isOpen = context?.value === itemValue

    return (
        <AccordionItemContext.Provider value={{ value: itemValue, isOpen }}>
            <div ref={ref} className={cn("border-b", className)} {...props}>
                {children}
            </div>
        </AccordionItemContext.Provider>
    )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const itemContext = React.useContext(AccordionItemContext)

    if (!context || !itemContext) return null

    return (
        <h3 className="flex">
            <button
                ref={ref}
                onClick={() => context.onValueChange(itemContext.value)}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={itemContext.isOpen ? "open" : "closed"}
                {...props}
            >
                {children}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        itemContext.isOpen && "rotate-180"
                    )}
                />
            </button>
        </h3>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const itemContext = React.useContext(AccordionItemContext)

    if (!itemContext) return null
    if (!itemContext.isOpen) return null

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all animate-accordion-down",
                className
            )}
            {...props}
        >
            <div className="pb-4 pt-0">{children}</div>
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
