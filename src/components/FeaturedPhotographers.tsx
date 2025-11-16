import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getStyleLabel } from "@/lib/constants";

export const FeaturedPhotographers = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const navigate = useNavigate();
  const containerRef = useState<HTMLDivElement | null>(null)[0];

  useEffect(() => {
    loadFeaturedCreators();
  }, []);

  const loadFeaturedCreators = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: viewsData } = await supabase
        .from('creator_views_daily')
        .select('creator_user_id, unique_views')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('unique_views', { ascending: false })
        .limit(10);

      if (viewsData && viewsData.length > 0) {
        const creatorIds = viewsData.map(v => v.creator_user_id);
        
        const { data: creatorsData } = await supabase
          .from('creator_profiles')
          .select('*')
          .in('user_id', creatorIds)
          .eq('status', 'published')
          .eq('public_profile', true);

        if (creatorsData) {
          setCreators(creatorsData);
        }
      } else {
        // Fallback: get top creators by showcase score
        const { data } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('status', 'published')
          .eq('public_profile', true)
          .order('showcase_score', { ascending: false })
          .limit(10);
        
        if (data) setCreators(data);
      }
    } catch (error) {
      console.error('Error loading featured creators:', error);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('featured-scroll');
    if (container) {
      const scrollAmount = 320;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (creators.length === 0) return null;

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">Featured Photographers</h2>
            <p className="text-muted-foreground">Top-rated professionals in your area</p>
          </div>
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div 
          id="featured-scroll"
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {creators.map((creator) => (
            <Card
              key={creator.id}
              className="flex-none w-72 p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/creator/${creator.slug || `id/${creator.user_id}`}`)}
            >
              <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                <img
                  src={creator.avatar_url || '/placeholder.svg'}
                  alt={creator.display_name || 'Photographer'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="font-semibold text-lg mb-2 truncate">
                {creator.display_name || 'Photographer'}
              </h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {(creator.styles || []).slice(0, 3).map((style: string) => (
                  <span
                    key={style}
                    className="text-xs px-2 py-1 bg-secondary rounded-full"
                  >
                    {getStyleLabel(style)}
                  </span>
                ))}
              </div>
              {creator.min_project_budget_usd > 0 && (
                <p className="text-sm font-medium text-primary">
                  Minimum project ${creator.min_project_budget_usd.toLocaleString()}
                </p>
              )}
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/discover')}
            className="bg-primary hover:brightness-90 text-primary-foreground"
          >
            View All Photographers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
