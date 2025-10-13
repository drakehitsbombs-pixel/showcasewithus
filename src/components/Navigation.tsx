import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Camera, Search, MessageSquare, LayoutDashboard, Briefcase, Award, ChevronDown } from "lucide-react";
import ProfileMenu from "./ProfileMenu";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const availableStyles = [
    "All",
    "Wedding",
    "Portrait",
    "Product",
    "Event",
    "Lifestyle",
    "Editorial",
    "Real Estate",
    "Food",
    "Sports",
  ];

  useEffect(() => {
    checkAuth();
    subscribeToMessages();
    
    // Load style from URL or localStorage
    const params = new URLSearchParams(location.search);
    const styleParam = params.get("style");
    if (styleParam) {
      setSelectedStyle(styleParam);
    } else {
      const savedStyle = localStorage.getItem("showcase_style");
      if (savedStyle) setSelectedStyle(savedStyle);
    }
  }, [location.search]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data } = await supabase
        .from("users_extended")
        .select("role")
        .eq("id", session.user.id)
        .single();
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

  const isActive = (path: string) => location.pathname === path;

  const handleStyleSelect = (style: string) => {
    const lowerStyle = style === "All" ? null : style.toLowerCase();
    setSelectedStyle(lowerStyle);
    
    if (lowerStyle) {
      localStorage.setItem("showcase_style", lowerStyle);
      navigate(`${location.pathname}?style=${lowerStyle}`);
    } else {
      localStorage.removeItem("showcase_style");
      navigate(location.pathname);
    }
  };

  if (!userId) return null;

  return (
    <div className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Show Case</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {userRole === "client" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActive("/client/discover") ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Discover
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {availableStyles.map((style) => (
                    <DropdownMenuItem
                      key={style}
                      onClick={() => {
                        handleStyleSelect(style);
                        navigate("/client/discover");
                      }}
                    >
                      {style}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant={isActive("/client/showcase") ? "default" : "ghost"}
                onClick={() => navigate("/client/showcase")}
                className="gap-2"
              >
                <Award className="h-4 w-4" />
                Showcase
              </Button>
              <Button
                variant={isActive("/client/brief-setup") ? "default" : "ghost"}
                onClick={() => navigate("/client/brief-setup")}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                My Brief
              </Button>
            </>
          )}

          {userRole === "creator" && (
            <Button
              variant={isActive("/creator/dashboard") ? "default" : "ghost"}
              onClick={() => navigate("/creator/dashboard")}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          )}

          <Button
            variant={isActive("/messages") ? "default" : "ghost"}
            onClick={() => navigate("/messages")}
            className="gap-2 relative"
          >
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </nav>

        <ProfileMenu userId={userId} />
      </div>
    </div>
  );
};

export default Navigation;
