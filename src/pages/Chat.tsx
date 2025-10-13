import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Legacy Chat page - redirects to new Thread-based messaging
 * Route: /chat/:matchId -> /messages/:threadId
 */
const Chat = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();

  useEffect(() => {
    const redirectToThread = async () => {
      if (!matchId) {
        navigate("/messages");
        return;
      }

      try {
        // Get the match details
        const { data: match, error: matchError } = await supabase
          .from("matches")
          .select("creator_user_id, client_user_id")
          .eq("id", matchId)
          .single();

        if (matchError) throw matchError;

        // Find or create the thread
        const { data: existingThread } = await supabase
          .from("threads")
          .select("id")
          .eq("creator_user_id", match.creator_user_id)
          .eq("client_user_id", match.client_user_id)
          .eq("status", "open")
          .maybeSingle();

        if (existingThread) {
          navigate(`/messages/${existingThread.id}`, { replace: true });
        } else {
          // Create thread if it doesn't exist
          const { data: newThread, error: threadError } = await supabase
            .from("threads")
            .insert({
              creator_user_id: match.creator_user_id,
              client_user_id: match.client_user_id,
              status: "open",
            })
            .select("id")
            .single();

          if (threadError) throw threadError;
          navigate(`/messages/${newThread.id}`, { replace: true });
        }
      } catch (error) {
        console.error("Error redirecting from legacy chat:", error);
        toast.error("Couldn't load conversation");
        navigate("/messages");
      }
    };

    redirectToThread();
  }, [matchId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    </div>
  );
};

export default Chat;
