import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const categories = [
  { id: "wedding", label: "Wedding" },
  { id: "portrait", label: "Portrait" },
  { id: "product", label: "Product" },
  { id: "event", label: "Event" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "real-estate", label: "Real Estate" },
  { id: "sports", label: "Sports" },
  { id: "surfing", label: "Surfing" },
  { id: "graduation", label: "Graduation" },
];

export function CategoryChips() {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/client/discover?tab=search&styles=${categoryId}`);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 p-1">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.label}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
