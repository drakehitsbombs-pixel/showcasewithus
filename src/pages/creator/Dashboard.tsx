import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, MessageSquare, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";
import { InsightsDrawer } from "@/components/InsightsDrawer";

interface DashboardMetrics {
  profile_views: number;
  likes: number;
  matches: number;
  messages: number;
  bookings: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    profile_views: 0,
    likes: 0,
    matches: 0,
    messages: 0,
    bookings: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewsDrawerOpen, setViewsDrawerOpen] = useState(false);
  const [likesDrawerOpen, setLikesDrawerOpen] = useState(false);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [recentLikes, setRecentLikes] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadMetrics(session.user.id);
      }
    });
  }, []);

  const loadMetrics = async (userId: string) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Profile views (last 7 days)
      const { count: viewsCount } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('creator_user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Matches where client liked
      const { count: likesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('creator_user_id', userId)
        .eq('client_liked', true)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Mutual matches
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('creator_user_id', userId)
        .eq('status', 'matched')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Messages received via threads
      const { data: threadIds } = await supabase
        .from('threads')
        .select('id')
        .eq('creator_user_id', userId)
        .eq('status', 'open');

      let messagesCount = 0;
      if (threadIds && threadIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', threadIds.map(t => t.id))
          .neq('sender_user_id', userId)
          .gte('created_at', sevenDaysAgo.toISOString());
        messagesCount = count || 0;
      }

      // Bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*, matches!inner(creator_user_id)', { count: 'exact', head: true })
        .eq('matches.creator_user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      setMetrics({
        profile_views: viewsCount || 0,
        likes: likesCount || 0,
        matches: matchesCount || 0,
        messages: messagesCount,
        bookings: bookingsCount || 0,
      });

      // Load detailed views data
      const { data: viewsData } = await supabase
        .from('profile_views')
        .select('id, created_at, viewer_user_id, users_extended!profile_views_viewer_user_id_fkey(name, city, avatar_url)')
        .eq('creator_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      
      setRecentViews(viewsData?.map(v => ({
        id: v.id,
        user: v.users_extended,
        created_at: v.created_at,
      })) || []);

      // Load detailed likes data
      const { data: likesData } = await supabase
        .from('matches')
        .select('id, created_at, client_user_id, users_extended!matches_client_user_id_fkey(name, city, avatar_url)')
        .eq('creator_user_id', userId)
        .eq('client_liked', true)
        .order('created_at', { ascending: false })
        .limit(30);
      
      setRecentLikes(likesData?.map(l => ({
        id: l.id,
        user: l.users_extended,
        created_at: l.created_at,
      })) || []);

      // Load recent activity
      const activity: RecentActivity[] = [];

      if (likesCount && likesCount > 0) {
        const { data: recentLikes } = await supabase
          .from('matches')
          .select('created_at, users_extended!matches_client_user_id_fkey(name)')
          .eq('creator_user_id', userId)
          .eq('client_liked', true)
          .order('created_at', { ascending: false })
          .limit(3);

        recentLikes?.forEach(like => {
          activity.push({
            type: 'like',
            description: `New like from ${like.users_extended?.name || 'a client'}`,
            timestamp: like.created_at,
          });
        });
      }

      if (matchesCount && matchesCount > 0) {
        const { data: recentMatches } = await supabase
          .from('matches')
          .select('created_at, users_extended!matches_client_user_id_fkey(name)')
          .eq('creator_user_id', userId)
          .eq('status', 'matched')
          .order('created_at', { ascending: false })
          .limit(3);

        recentMatches?.forEach(match => {
          activity.push({
            type: 'match',
            description: `New match with ${match.users_extended?.name || 'a client'}`,
            timestamp: match.created_at,
          });
        });
      }

      // Sort by timestamp
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activity.slice(0, 5));

    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <Button onClick={() => navigate("/creator/calendar")}>
            View Calendar
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewsDrawerOpen(true)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.profile_views}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days · Click to view</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLikesDrawerOpen(true)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Likes</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.likes}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days · Click to view</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/matches")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Matches</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.matches}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days · Click to view</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/messages")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.messages}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days · Click to view</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/creator/calendar")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.bookings}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days · Click to view</p>
                </CardContent>
              </Card>
            </div>

            {metrics.profile_views === 0 && metrics.likes === 0 && metrics.matches === 0 ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    You haven't received any views yet. Here's how to increase your visibility:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Upload at least 5-10 high-quality portfolio images</li>
                    <li>Complete your profile with a detailed bio</li>
                    <li>Set your price range and availability</li>
                    <li>Add multiple photography styles to your profile</li>
                    <li>Respond quickly to messages from potential clients</li>
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest events from the past 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="mt-0.5">
                            {activity.type === 'like' && <Heart className="w-4 h-4 text-pink-500" />}
                            {activity.type === 'match' && <Heart className="w-4 h-4 text-primary fill-primary" />}
                            {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/creator/profile-setup")}>
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={() => navigate("/matches")}>
                  View All Matches
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <InsightsDrawer
        open={viewsDrawerOpen}
        onOpenChange={setViewsDrawerOpen}
        title="Profile Views"
        description="Recent visitors to your profile (last 30)"
        items={recentViews}
        emptyMessage="No one has viewed your profile yet"
      />

      <InsightsDrawer
        open={likesDrawerOpen}
        onOpenChange={setLikesDrawerOpen}
        title="Likes"
        description="Clients who liked your profile (last 30)"
        items={recentLikes}
        emptyMessage="No likes yet"
      />
    </div>
  );
};

export default Dashboard;
