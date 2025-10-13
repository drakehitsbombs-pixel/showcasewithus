import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Navigation from "@/components/Navigation";

interface Thread {
  id: string;
  creator_user_id: string;
  client_user_id: string;
  last_message_at: string;
  status: string;
  unread_count: number;
  other_user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  last_message: {
    text: string;
    sender_user_id: string;
  } | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    loadThreads(session.user.id);
    subscribeToThreads(session.user.id);
  };

  const loadThreads = async (userId: string) => {
    try {
      const { data: threadsData, error } = await supabase
        .from("threads")
        .select("*")
        .or(`creator_user_id.eq.${userId},client_user_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      if (!threadsData || threadsData.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      // Get other user details and last messages
      const enrichedThreads = await Promise.all(
        threadsData.map(async (thread) => {
          const otherUserId = thread.creator_user_id === userId 
            ? thread.client_user_id 
            : thread.creator_user_id;

          // Get other user data
          const { data: userData } = await supabase
            .from("users_extended")
            .select("name")
            .eq("id", otherUserId)
            .single();

          // Get avatar from creator_profiles if other user is creator
          let avatarUrl = null;
          if (thread.creator_user_id === otherUserId) {
            const { data: profileData } = await supabase
              .from("creator_profiles")
              .select("avatar_url")
              .eq("user_id", otherUserId)
              .single();
            avatarUrl = profileData?.avatar_url;
          }

          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("text, sender_user_id")
            .eq("thread_id", thread.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("thread_id", thread.id)
            .neq("sender_user_id", userId)
            .is("read_at", null);

          return {
            ...thread,
            other_user: {
              id: otherUserId,
              name: userData?.name || "Unknown",
              avatar_url: avatarUrl,
            },
            last_message: lastMessage,
            unread_count: unreadCount || 0,
          };
        })
      );

      setThreads(enrichedThreads);
    } catch (error) {
      console.error("Error loading threads:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToThreads = (userId: string) => {
    const channel = supabase
      .channel("threads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "threads",
          filter: `creator_user_id=eq.${userId}`,
        },
        () => loadThreads(userId)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "threads",
          filter: `client_user_id=eq.${userId}`,
        },
        () => loadThreads(userId)
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => loadThreads(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {threads.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start a conversation by messaging a photographer
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Card
                key={thread.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/messages/${thread.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={thread.other_user.avatar_url || undefined} />
                    <AvatarFallback>
                      {thread.other_user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{thread.other_user.name}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                    {thread.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {thread.last_message.sender_user_id === currentUserId && "You: "}
                        {thread.last_message.text}
                      </p>
                    )}
                  </div>

                  {thread.unread_count > 0 && (
                    <Badge className="ml-2">{thread.unread_count}</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
