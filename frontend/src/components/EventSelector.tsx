import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/types/api";

interface EventSelectorProps {
    currentEvent?: Event;
    onEventChange: (eventId: string) => void;
}

export function EventSelector({ currentEvent, onEventChange }: EventSelectorProps) {
    const { data: events, isLoading } = useEvents();

    return (
        <div className="w-[200px]">
            <Select value={currentEvent?.id} onValueChange={onEventChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                    {isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                        events?.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                                {event.name}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}

