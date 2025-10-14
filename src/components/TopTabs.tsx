import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTabsForRole, PRIMARY_TABS } from "@/lib/navigation-constants";
import { cn } from "@/lib/utils";

interface TopTabsProps {
  userRole: string | null;
  unreadCount?: number;
}

const TopTabs = ({ userRole, unreadCount = 0 }: TopTabsProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = getTabsForRole(userRole);

  const isActive = (href: string) => {
    // Match exact path or path prefix for nested routes
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  if (tabs.length === 0) return null;

  return (
    <div className="top-tabs">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(tab.href)}
              className={cn(
                "tab flex-shrink-0 gap-2 relative",
                active && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.id === 'messages' && unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default TopTabs;
