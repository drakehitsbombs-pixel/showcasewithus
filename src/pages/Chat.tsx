import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { messageSchema } from "@/lib/validation";

interface Message {
  id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, [matchId]);

  useEffect(() => {
    if (matchId && user) {
      loadMessages();
      subscribeToMessages();
    }
  }, [matchId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    loadMatchDetails(session.user.id);
  };

  const loadMatchDetails = async (userId: string) => {
    try {
      const { data: match, error } = await supabase
        .from("matches")
        .select(`
          creator_user_id,
          client_user_id,
          users_extended!matches_creator_user_id_fkey(name, avatar_url)
        `)
        .eq("id", matchId)
        .single();

      if (error) throw error;

      const otherUserId = match.creator_user_id === userId 
        ? match.client_user_id 
        : match.creator_user_id;

      const { data: otherUserData } = await supabase
        .from("users_extended")
        .select("name, avatar_url")
        .eq("id", otherUserId)
        .single();

      setOtherUser(otherUserData);
    } catch (error: any) {
      toast.error("Failed to load match details");
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim()) return;

    try {
      const validated = messageSchema.parse({ text: newMessage });

      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_user_id: user.id,
        text: validated.text,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0]?.message || "Invalid message");
      } else {
        toast.error("Failed to send message");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/matches")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Button>

        <Card className="card-premium h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={otherUser?.avatar_url || undefined} />
                <AvatarFallback>
                  {otherUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{otherUser?.name || "Loading..."}</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_user_id === user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender_user_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                maxLength={2000}
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
