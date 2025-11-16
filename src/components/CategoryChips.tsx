import { useSearchParams } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { STYLE_OPTIONS } from "@/lib/constants";

export function CategoryChips() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentStyles = searchParams.get("styles")?.split(',').filter(Boolean) || [];

  const handleCategoryClick = (styleId: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Toggle the style
    const newStyles = currentStyles.includes(styleId)
      ? currentStyles.filter(s => s !== styleId)
      : [...currentStyles, styleId];
    
    // Update URL
    if (newStyles.length > 0) {
      newParams.set('styles', newStyles.join(','));
    } else {
      newParams.delete('styles');
    }
    
    // Ensure we're on the search tab
    newParams.set('tab', 'search');
    
    setSearchParams(newParams);
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="chips justify-center p-2" data-style-pills>
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              className={`chip cursor-pointer hover:shadow-sm transition-all ${
                currentStyles.includes(style.id) ? 'is-active' : ''
              }`}
              data-style-chip
              data-style={style.id}
              aria-pressed={currentStyles.includes(style.id)}
              onClick={() => handleCategoryClick(style.id)}
            >
              {style.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
