import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Heart, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Discover = () => {
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadCreators();
      }
    });
  }, []);

  const loadCreators = async () => {
    const { data } = await supabase
      .from("creator_profiles")
      .select(`
        *,
        users_extended!creator_profiles_user_id_fkey (name, city, bio),
        portfolio_images (url, tags)
      `)
      .limit(10);

    if (data) {
      setCreators(data);
    }
  };

  const handleLike = async () => {
    if (!user || currentIndex >= creators.length) return;

    const creator = creators[currentIndex];

    try {
      // Create match
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({
          creator_user_id: creator.user_id,
          client_user_id: user.id,
          client_liked: true,
          match_score: 85, // Placeholder score
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Send automatic notification message
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          match_id: matchData.id,
          sender_user_id: user.id,
          text: `Hi! I viewed your profile and I'm interested in your work. I'd love to discuss my project with you!`,
        });

      if (messageError) throw messageError;

      toast({
        title: "Liked!",
        description: "Message sent to photographer.",
      });

      setCurrentIndex((prev) => prev + 1);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const currentCreator = creators[currentIndex];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Discover Photographers</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="swipe" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="swipe">Swipe</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="swipe" className="mt-8">
            {currentCreator ? (
              <div className="max-w-lg mx-auto">
                <Card className="swipe-card shadow-elevated">
                  <div className="relative aspect-[3/4] bg-muted">
                    {currentCreator.portfolio_images?.[0] && (
                      <img
                        src={currentCreator.portfolio_images[0].url}
                        alt="Portfolio"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="match-score-badge">
                        85
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-2">
                      {currentCreator.users_extended?.name}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {currentCreator.users_extended?.city}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      {currentCreator.styles?.map((style: string) => (
                        <span
                          key={style}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {currentCreator.users_extended?.bio}
                    </p>
                    {currentCreator.price_band_low && (
                      <p className="text-sm font-semibold">
                        ${currentCreator.price_band_low} - ${currentCreator.price_band_high}/hr
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-center mt-6">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-16 h-16 rounded-full"
                    onClick={handlePass}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    className="w-16 h-16 rounded-full gradient-accent"
                    onClick={handleLike}
                  >
                    <Heart className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No more photographers to show</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Search features coming soon...</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Discover;
