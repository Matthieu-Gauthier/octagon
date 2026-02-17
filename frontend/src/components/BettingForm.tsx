import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBets } from "@/store/useBets";
import { Fight } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"; // Assuming sonner is installed, or we use standard alert for now

const betSchema = z.object({
    winnerId: z.string().min(1, "Pick a winner"),
    method: z.enum(["KO/TKO", "SUBMISSION", "DECISION"]).optional(),
    round: z.string().optional(), // Select returns string, we'll parse to int
});

interface BettingFormProps {
    fight: Fight;
    onClose?: () => void;
}

export function BettingForm({ fight, onClose }: BettingFormProps) {
    const { placeBet, getBet } = useBets();
    const existingBet = getBet(fight.id);

    const form = useForm<z.infer<typeof betSchema>>({
        resolver: zodResolver(betSchema),
        defaultValues: {
            winnerId: existingBet?.winnerId || "",
            method: existingBet?.method,
            round: existingBet?.round?.toString(),
        },
    });

    function onSubmit(values: z.infer<typeof betSchema>) {
        placeBet({
            fightId: fight.id,
            winnerId: values.winnerId,
            method: values.method,
            round: values.round ? parseInt(values.round) : undefined,
        });
        // Use sonner toast
        toast.success("Bet Placed!", {
            description: `You picked ${fight.fighterA.id === values.winnerId ? fight.fighterA.name : fight.fighterB.name}${values.method ? ` via ${values.method}` : ""}`
        });
        if (onClose) onClose();
    }

    const selectedWinner = form.watch("winnerId");
    const isMethodSelected = !!form.watch("method");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-md bg-card/50">

                {/* WINNER SELECTION */}
                <FormField
                    control={form.control}
                    name="winnerId"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-base font-semibold">Who wins?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value={fight.fighterA.id} id={fight.fighterA.id} className="peer sr-only" />
                                        </FormControl>
                                        <FormLabel
                                            htmlFor={fight.fighterA.id}
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer text-center"
                                        >
                                            <span className="font-bold text-lg">{fight.fighterA.name}</span>
                                            <span className="text-xs text-muted-foreground">{fight.fighterA.record}</span>
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value={fight.fighterB.id} id={fight.fighterB.id} className="peer sr-only" />
                                        </FormControl>
                                        <FormLabel
                                            htmlFor={fight.fighterB.id}
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer text-center"
                                        >
                                            <span className="font-bold text-lg">{fight.fighterB.name}</span>
                                            <span className="text-xs text-muted-foreground">{fight.fighterB.record}</span>
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* METHOD SELECTION (Optional) */}
                {selectedWinner && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Method (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="How?" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="KO/TKO">KO / TKO</SelectItem>
                                            <SelectItem value="SUBMISSION">Submission</SelectItem>
                                            <SelectItem value="DECISION">Decision</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* ROUND SELECTION (Optional) */}
                        <FormField
                            control={form.control}
                            name="round"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Round (Optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={!isMethodSelected || form.getValues("method") === "DECISION"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="When?" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: fight.rounds }).map((_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                    Round {i + 1}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <Button type="submit" className="w-full text-lg py-6 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
                    {existingBet ? "Update Bet" : "Place Bet"}
                </Button>
            </form>
        </Form>
    );
}
