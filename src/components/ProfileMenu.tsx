import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, UserCircle, Bell, CreditCard } from "lucide-react";

interface ProfileMenuProps {
  userId: string;
}

const ProfileMenu = ({ userId }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    const { data: user } = await supabase
      .from("users_extended")
      .select("name, role, avatar_url")
      .eq("id", userId)
      .single();

    if (user) {
      setUserData(user);
      
      // Try to get avatar from creator_profiles if creator
      if (user.role === "creator") {
        const { data: profile } = await supabase
          .from("creator_profiles")
          .select("avatar_url")
          .eq("user_id", userId)
          .single();
        
        setAvatarUrl(profile?.avatar_url || user.avatar_url);
      } else {
        setAvatarUrl(user.avatar_url);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!userData) return null;

  const initials = userData.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={avatarUrl || undefined} alt={userData.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{userData.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{userData.role}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userData.role === "creator" ? (
          <>
            <DropdownMenuItem onClick={() => navigate(`/creator/id/${userId}`)}>
              <UserCircle className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/creator/profile-setup")}>
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => navigate("/client/profile")}>
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/notifications")}>
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </DropdownMenuItem>
        {userData.role === "creator" && (
          <DropdownMenuItem onClick={() => navigate("/subscription")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
