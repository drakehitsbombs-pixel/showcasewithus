import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileMenu from "./ProfileMenu";
import TopTabs from "./TopTabs";
import { ThemeToggle } from "./ThemeToggle";

const Navigation = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
    subscribeToMessages();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setUserRole(data?.role || null);
      loadUnreadCount(session.user.id);
    }
  };

  const loadUnreadCount = async (uid: string) => {
    const { data: threads } = await supabase
      .from("threads")
      .select("id")
      .or(`creator_user_id.eq.${uid},client_user_id.eq.${uid}`);

    if (threads && threads.length > 0) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("thread_id", threads.map(t => t.id))
        .neq("sender_user_id", uid)
        .is("read_at", null);

      setUnreadCount(count || 0);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("nav-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          if (userId) loadUnreadCount(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (!userId) return null;

  return (
    <>
      <header className="app-header">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 hover:bg-transparent"
          onClick={() => navigate("/")}
          aria-label="Home"
        >
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold hidden sm:inline">Show Case</span>
          </div>
        </Button>

        <div className="flex-1" />

        {userRole === "creator" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/creator/calendar")}
            aria-label="View Calendar"
            className="mr-2"
          >
            <CalendarIcon className="h-5 w-5" />
          </Button>
        )}

        <ThemeToggle />

        <ProfileMenu userId={userId} userRole={userRole} />
      </header>

      <TopTabs userRole={userRole} unreadCount={unreadCount} />
    </>
  );
};

export default Navigation;
