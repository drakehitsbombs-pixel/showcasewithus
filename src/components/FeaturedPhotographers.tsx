import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getStyleLabel } from "@/lib/constants";

export const FeaturedPhotographers = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

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
        
        const { data: creatorsData, error } = await supabase
          .from('creator_profiles')
          .select('*, users_extended!creator_profiles_user_id_fkey(username, name)')
          .in('user_id', creatorIds)
          .eq('status', 'published')
          .eq('public_profile', true);

        if (error) {
          console.error('Error fetching creators:', error);
        }

        if (creatorsData) {
          setCreators(creatorsData);
        }
      } else {
        // Fallback: get top creators by showcase score
        const { data, error } = await supabase
          .from('creator_profiles')
          .select('*, users_extended!creator_profiles_user_id_fkey(username, name)')
          .eq('status', 'published')
          .eq('public_profile', true)
          .order('showcase_score', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('Error fetching fallback creators:', error);
        }
        
        if (data) setCreators(data);
      }
    } catch (error) {
      console.error('Error loading featured creators:', error);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 320;
      const newPosition = direction === 'left' 
        ? containerRef.current.scrollLeft - scrollAmount
        : containerRef.current.scrollLeft + scrollAmount;
      
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
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
              aria-label="Scroll left to view previous photographers"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              aria-label="Scroll right to view more photographers"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {creators.map((creator) => (
            <Card
              key={creator.id}
              className="flex-none w-72 p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/creator/${creator.users_extended?.username || `id/${creator.user_id}`}`)}
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
                  Project rates from ${creator.min_project_budget_usd.toLocaleString()}
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
