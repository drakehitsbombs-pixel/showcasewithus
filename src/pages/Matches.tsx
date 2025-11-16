import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Match {
  id: string;
  creator_user_id: string;
  client_user_id: string;
  created_at: string;
  users_extended: {
    name: string;
    avatar_url: string | null;
    city: string | null;
  };
}

const Matches = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    loadMatches(session.user.id);
  };

  const loadMatches = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          creator_user_id,
          client_user_id,
          created_at,
          status
        `)
        .or(`creator_user_id.eq.${userId},client_user_id.eq.${userId}`)
        .eq("status", "matched")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user details for each match
      const matchesWithUsers = await Promise.all(
        (data || []).map(async (match) => {
          const otherUserId = match.creator_user_id === userId 
            ? match.client_user_id 
            : match.creator_user_id;

          const { data: userData } = await supabase
            .from("users_extended")
            .select("name, avatar_url, city")
            .eq("id", otherUserId)
            .single();

          return {
            ...match,
            users_extended: userData || { name: "Unknown", avatar_url: null, city: null }
          };
        })
      );

      setMatches(matchesWithUsers);
    } catch (error: any) {
      console.error("Error loading matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-3xl">Your Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading matches...</p>
            ) : matches.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No matches yet. Keep swiping!
              </p>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.id} className="overflow-hidden">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={match.users_extended.avatar_url || undefined} />
                        <AvatarFallback>
                          {match.users_extended.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {match.users_extended.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {match.users_extended.city || "Location not specified"}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleOpenChat(match.id)}
                        className="btn-primary"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Matches;
