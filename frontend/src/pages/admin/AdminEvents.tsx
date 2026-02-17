import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AdminEvents() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
                    <p className="text-muted-foreground">Create and edit UFC events.</p>
                </div>
                <Button onClick={() => toast.info("Create Event functionality coming soon!")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                </Button>
            </div>

            <div className="grid gap-4">
                <Card className="border-dashed border-2 shadow-none bg-muted/10 flex items-center justify-center p-10">
                    <div className="text-center space-y-2">
                        <div className="bg-primary/20 p-3 rounded-full w-fit mx-auto">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">No events created yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Start by creating a new event, adding fights, and setting the schedule.
                        </p>
                        <Button variant="outline" className="mt-4">
                            Create First Event
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
