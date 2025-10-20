import { Search, Award, Waves, Briefcase, MessageSquare, LayoutDashboard } from "lucide-react";

export interface NavTab {
  id: string;
  label: string;
  href: string;
  icon: any;
  roles: ("client" | "creator")[];
}

// Single source of truth for primary navigation tabs
export const PRIMARY_TABS: NavTab[] = [
  { 
    id: 'discover', 
    label: 'Discover', 
    href: '/client/discover', 
    icon: Search,
    roles: ['client']
  },
  { 
    id: 'showcase', 
    label: 'Showcase', 
    href: '/client/showcase', 
    icon: Award,
    roles: ['client', 'creator']
  },
  { 
    id: 'brief', 
    label: 'My Brief', 
    href: '/client/brief-setup', 
    icon: Briefcase,
    roles: ['client']
  },
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    href: '/creator/dashboard', 
    icon: LayoutDashboard,
    roles: ['creator']
  },
  { 
    id: 'messages', 
    label: 'Messages', 
    href: '/messages', 
    icon: MessageSquare,
    roles: ['client', 'creator']
  },
];

export const getTabsForRole = (role: string | null): NavTab[] => {
  if (!role) return [];
  return PRIMARY_TABS.filter(tab => tab.roles.includes(role as any));
};
