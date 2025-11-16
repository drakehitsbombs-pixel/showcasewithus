import { useNavigate } from "react-router-dom";
import { STYLE_OPTIONS } from "@/lib/constants";

export const BrowseByStyle = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Browse by Style</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find photographers who specialize in what you need
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              onClick={() => navigate(`/discover?styles=${style.id}`)}
              className="px-6 py-3 rounded-full bg-card border-2 border-border hover:border-primary hover:bg-primary/5 transition-all font-medium text-sm"
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
