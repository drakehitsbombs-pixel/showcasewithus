import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface InsightItem {
  id: string;
  user?: {
    name: string;
    avatar_url?: string;
    city?: string;
  };
  created_at: string;
}

interface InsightsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  items: InsightItem[];
  emptyMessage?: string;
}

export const InsightsDrawer = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  items,
  emptyMessage = "No activity yet"
}: InsightsDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.user?.avatar_url} />
                  <AvatarFallback>
                    {item.user?.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {item.user?.name || "Anonymous"}
                  </p>
                  {item.user?.city && (
                    <p className="text-sm text-muted-foreground truncate">
                      {item.user.city}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
