import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Navigation from "@/components/Navigation";
import { messageSchema } from "@/lib/validation";
import { z } from "zod";

interface Message {
  id: string;
  sender_user_id: string;
  text: string;
  media_url: string | null;
  created_at: string;
  read_at: string | null;
}

interface OtherUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

const Thread = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, [threadId]);

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
    setCurrentUserId(session.user.id);
    loadThread(session.user.id);
    subscribeToMessages();
  };

  const loadThread = async (userId: string) => {
    if (!threadId) return;

    try {
      // Get thread details
      const { data: threadData, error: threadError } = await supabase
        .from("threads")
        .select("*")
        .eq("id", threadId)
        .single();

      if (threadError) throw threadError;

      // Use denormalized data for fast identity resolution
      const isCreator = threadData.creator_user_id === userId;
      const otherUserId = isCreator ? threadData.client_user_id : threadData.creator_user_id;
      const otherUserName = isCreator ? threadData.client_name : threadData.creator_name;
      const otherUserAvatar = isCreator ? threadData.client_avatar_url : threadData.creator_avatar_url;

      setOtherUser({
        id: otherUserId,
        name: otherUserName || "User",
        avatar_url: otherUserAvatar,
      });

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("thread_id", threadId)
        .neq("sender_user_id", userId)
        .is("read_at", null);

    } catch (error) {
      console.error("Error loading thread:", error);
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // Mark as read if we're the receiver
          if (payload.new.sender_user_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", payload.new.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !threadId || sending) return;

    setSending(true);
    const originalMessage = newMessage;
    setNewMessage(""); // Optimistic clear

    try {
      // Validate message against schema
      const validated = messageSchema.parse({ text: newMessage });

      const { error } = await supabase.from("messages").insert({
        thread_id: threadId,
        sender_user_id: currentUserId,
        text: validated.text,
      });

      if (error) throw error;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setNewMessage(originalMessage);
        toast.error(error.errors[0].message);
      } else {
        console.error("Error sending message:", error);
        setNewMessage(originalMessage); // Restore on error
        toast.error("Couldn't send. Tap to retry.", {
          action: {
            label: "Retry",
            onClick: () => {
              setNewMessage(originalMessage);
            },
          },
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUserId || !threadId) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image must be under 15MB");
      return;
    }

    setSending(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${threadId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolios")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("portfolios")
        .getPublicUrl(filePath);

      // Validate message text
      const imageMessageText = "📷 Sent an image";
      const validated = messageSchema.parse({ text: imageMessageText });

      const { error: messageError } = await supabase.from("messages").insert({
        thread_id: threadId,
        sender_user_id: currentUserId,
        text: validated.text,
        media_url: publicUrl,
      });

      if (messageError) throw messageError;

      toast.success("Image sent!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to send image");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Thread Header */}
      <div className="border-b bg-card sticky top-[calc(56px+48px+env(safe-area-inset-top))] md:top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {otherUser && (
            <>
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback>
                  {otherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-lg font-semibold">{otherUser.name}</h1>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_user_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.media_url && (
                        <img
                          src={message.media_url}
                          alt="Attachment"
                          className="rounded-lg mb-2 max-w-xs"
                        />
                      )}
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="container mx-auto max-w-4xl flex gap-2">
          <label className="cursor-pointer">
            <Button type="button" size="icon" variant="ghost" disabled={sending}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={sending}
            />
          </label>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Thread;
