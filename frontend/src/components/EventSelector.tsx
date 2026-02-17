import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_EVENTS } from "@/data/mock-data";
import { UfcEvent } from "@/data/mock-data";

interface EventSelectorProps {
    currentEvent: UfcEvent;
    onEventChange: (eventId: string) => void;
}

export function EventSelector({ currentEvent, onEventChange }: EventSelectorProps) {
    return (
        <div className="w-[200px]">
            <Select value={currentEvent.id} onValueChange={onEventChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                    {MOCK_EVENTS.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                            {event.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
