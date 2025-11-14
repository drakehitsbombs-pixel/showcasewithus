import { useNavigate } from "react-router-dom";
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
        <div className="chips justify-center p-2">
          {categories.map((category) => (
            <button
              key={category.id}
              className="chip cursor-pointer hover:shadow-sm transition-all"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
