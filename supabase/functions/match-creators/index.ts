import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchFilters {
  styles?: string[];
  budget_min?: number;
  budget_max?: number;
  distance_km?: number;
  date_start?: string;
  date_end?: string;
  client_lat?: number;
  client_lng?: number;
}

// Haversine distance calculation in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate Jaccard similarity for tag overlap
function jaccardSimilarity(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) return 0;
  const intersection = set1.filter(x => set2.includes(x)).length;
  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersection / union;
}

// Check if date ranges overlap
function dateRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 <= e2 && s2 <= e1;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { filters } = body as { filters: MatchFilters };

    // Input validation for filters - only validate if values are provided (not null/undefined)
    if (filters) {
      if (filters.budget_min !== undefined && filters.budget_min !== null && (typeof filters.budget_min !== 'number' || filters.budget_min < 0)) {
        return new Response(JSON.stringify({ error: 'budget_min must be a positive number' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (filters.budget_max !== undefined && filters.budget_max !== null && (typeof filters.budget_max !== 'number' || filters.budget_max < 0)) {
        return new Response(JSON.stringify({ error: 'budget_max must be a positive number' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (filters.distance_km !== undefined && filters.distance_km !== null && (typeof filters.distance_km !== 'number' || filters.distance_km < 0 || filters.distance_km > 10000)) {
        return new Response(JSON.stringify({ error: 'distance_km must be between 0 and 10000' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (filters.client_lat !== undefined && filters.client_lat !== null && (typeof filters.client_lat !== 'number' || filters.client_lat < -90 || filters.client_lat > 90)) {
        return new Response(JSON.stringify({ error: 'client_lat must be between -90 and 90' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (filters.client_lng !== undefined && filters.client_lng !== null && (typeof filters.client_lng !== 'number' || filters.client_lng < -180 || filters.client_lng > 180)) {
        return new Response(JSON.stringify({ error: 'client_lng must be between -180 and 180' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch all creators with their profiles
    const { data: creators, error: creatorsError } = await supabase
      .from('creator_profiles')
      .select(`
        *,
        users_extended!creator_profiles_user_id_fkey (
          name,
          city,
          bio,
          geo_lat,
          geo_lng
        )
      `);

    if (creatorsError) {
      console.error('Error fetching creators:', creatorsError);
      return new Response(JSON.stringify({ error: creatorsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!creators || creators.length === 0) {
      return new Response(JSON.stringify({ creators: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch portfolio images for all creators
    const creatorIds = creators.map((c: any) => c.user_id);
    const { data: portfolioImages } = await supabase
      .from('portfolio_images')
      .select('*')
      .in('creator_user_id', creatorIds);

    // Fetch projects and media for all creators
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        project_media (
          url,
          sort_order,
          is_cover
        )
      `)
      .in('creator_user_id', creatorIds);

    // Map images to creators
    const portfolioMap = new Map<string, any[]>();
    portfolioImages?.forEach((img: any) => {
      const existing = portfolioMap.get(img.creator_user_id) || [];
      portfolioMap.set(img.creator_user_id, [...existing, img]);
    });

    const projectsMap = new Map<string, any[]>();
    projects?.forEach((proj: any) => {
      const existing = projectsMap.get(proj.creator_user_id) || [];
      projectsMap.set(proj.creator_user_id, [...existing, proj]);
    });

    // Score and filter creators
    const scoredCreators = creators
      .map((creator: any) => {
        // Attach portfolio and project images
        const creatorPortfolioImages = portfolioMap.get(creator.user_id) || [];
        const creatorProjects = projectsMap.get(creator.user_id) || [];
        
        // Get cover images from projects first, then portfolio
        const projectCoverImages = creatorProjects
          .flatMap((proj: any) => proj.project_media?.filter((m: any) => m.is_cover) || [])
          .slice(0, 6);
        
        const projectAllImages = creatorProjects
          .flatMap((proj: any) => proj.project_media || [])
          .slice(0, 6);
        
        const allImages = projectCoverImages.length > 0 
          ? projectCoverImages 
          : (projectAllImages.length > 0 ? projectAllImages : creatorPortfolioImages);

        const creatorLat = creator.users_extended?.geo_lat;
        const creatorLng = creator.users_extended?.geo_lng;
        
        let score = 0;
        let passesHardFilters = true;

        // Hard Filter 1: Distance (if both locations available)
        let distance = null;
        if (filters.client_lat && filters.client_lng && creatorLat && creatorLng) {
          distance = calculateDistance(filters.client_lat, filters.client_lng, creatorLat, creatorLng);
          
          if (filters.distance_km && distance > filters.distance_km) {
            passesHardFilters = false;
          }
          
          // Distance score (0-10 points)
          if (creator.travel_radius_km && distance <= creator.travel_radius_km) {
            const distanceScore = Math.max(0, 1 - (distance / creator.travel_radius_km));
            score += distanceScore * 10;
          }
        }

        // Hard Filter 2: Budget - check if creator's minimum is within client's range
        let budgetFit = true; // Default to true if no budget filter
        if (filters.budget_min !== undefined && filters.budget_max !== undefined) {
          // Creator passes if their minimum project budget is within the client's budget range
          if (creator.min_project_budget_usd !== null) {
            budgetFit = creator.min_project_budget_usd <= filters.budget_max;
            
            if (!budgetFit) {
              passesHardFilters = false;
            }
            
            // Budget score (0-20 points)
            if (budgetFit) {
              // Better score if creator's minimum is closer to client's minimum
              const budgetScore = filters.budget_min > 0 
                ? Math.max(0, 1 - Math.abs(creator.min_project_budget_usd - filters.budget_min) / filters.budget_max)
                : 1;
              score += budgetScore * 20;
            }
          }
        } else if (creator.min_project_budget_usd !== null) {
          // No filter, give partial points if they have pricing
          score += 10;
        }

        // Hard Filter 3: Availability overlap (simplified - checking if blocks exist)
        let availabilityOverlap = false;
        if (filters.date_start && filters.date_end && creator.availability_blocks) {
          try {
            const blocks = Array.isArray(creator.availability_blocks) 
              ? creator.availability_blocks 
              : JSON.parse(creator.availability_blocks);
            
            availabilityOverlap = blocks.some((block: any) => 
              dateRangesOverlap(filters.date_start!, filters.date_end!, block.start, block.end)
            );
            
            if (!availabilityOverlap && blocks.length > 0) {
              passesHardFilters = false;
            }
          } catch (e) {
            console.error('Error parsing availability blocks:', e);
          }
          
          // Availability score (0-30 points)
          if (availabilityOverlap) {
            score += 30;
          }
        } else {
          // No date filter or no blocks, give base points
          score += 15;
        }

        // Soft Score: Tag/Style overlap (0-40 points)
        const creatorStyles = creator.styles || [];
        const filterStyles = filters.styles || [];
        
        // Aggregate all tags from portfolio and projects
        const portfolioTags = creatorPortfolioImages.flatMap((img: any) => img.tags || []);
        const projectTags = creatorProjects.flatMap((proj: any) => proj.tags || []);
        const allCreatorTags = [...new Set([...creatorStyles, ...portfolioTags, ...projectTags])];
        
        if (filterStyles.length > 0 && allCreatorTags.length > 0) {
          const tagOverlap = jaccardSimilarity(filterStyles, allCreatorTags);
          score += tagOverlap * 40;
        } else if (allCreatorTags.length > 0) {
          score += 20; // Has tags but no filter
        }

        return {
          ...creator,
          portfolio_images: allImages,
          projects: creatorProjects,
          match_score: Math.round(score),
          distance,
          passes_hard_filters: passesHardFilters,
        };
      })
      .filter((c: any) => c.passes_hard_filters)
      .sort((a: any, b: any) => b.match_score - a.match_score);

    console.log(`Matched ${scoredCreators.length} creators`);

    return new Response(JSON.stringify({ creators: scoredCreators }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Match creators error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
