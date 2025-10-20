import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, MessageSquare, Calendar, Upload, Share2, Clock, Camera, Badge } from "lucide-react";
import Navigation from "@/components/Navigation";
import { InsightsDrawer } from "@/components/InsightsDrawer";
import { Sparkline } from "@/components/Sparkline";

interface DashboardMetrics {
  profile_views: number;
  likes: number;
  matches: number;
  messages: number;
  bookings: number;
  profile_views_trend: number[];
  likes_trend: number[];
  matches_trend: number[];
  messages_trend: number[];
  bookings_trend: number[];
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
    profile_views_trend: [],
    likes_trend: [],
    matches_trend: [],
    messages_trend: [],
    bookings_trend: [],
  });
  const [upcomingBookings, setUpcomingBookings] = useState(0);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [stylesCount, setStylesCount] = useState(0);
  const [hasPrice, setHasPrice] = useState(false);
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

      // Helper to generate 7-day trend (simplified)
      const viewsTrend: number[] = [];
      const likesTrend: number[] = [];
      const matchesTrend: number[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        // Views for this day (unique viewers)
        const { data: viewsDay } = await supabase
          .from('profile_views')
          .select('viewer_user_id')
          .eq('creator_user_id', userId)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        const uniqueViewers = new Set(viewsDay?.map(v => v.viewer_user_id).filter(Boolean));
        viewsTrend.push(uniqueViewers.size);

        // Likes for this day
        const { count: likesDay } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('creator_user_id', userId)
          .eq('client_liked', true)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        likesTrend.push(likesDay || 0);

        // Matches for this day
        const { count: matchesDay } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('creator_user_id', userId)
          .eq('status', 'matched')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        matchesTrend.push(matchesDay || 0);
      }

      // Profile views (last 7 days total - unique viewers)
      const { data: viewsData7d } = await supabase
        .from('profile_views')
        .select('viewer_user_id')
        .eq('creator_user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());
      const uniqueViewers7d = new Set(viewsData7d?.map(v => v.viewer_user_id).filter(Boolean));
      const viewsCount = uniqueViewers7d.size;

      // Likes (last 7 days total)
      const { count: likesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('creator_user_id', userId)
        .eq('client_liked', true)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Matches (last 7 days total)
      const { count: matchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('creator_user_id', userId)
        .eq('status', 'matched')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Messages
      const { data: threadIds } = await supabase
        .from('threads')
        .select('id')
        .eq('creator_user_id', userId)
        .eq('status', 'open');

      let messagesCount = 0;
      const messagesTrend: number[] = [];
      
      if (threadIds && threadIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', threadIds.map(t => t.id))
          .neq('sender_user_id', userId)
          .gte('created_at', sevenDaysAgo.toISOString());
        messagesCount = count || 0;

        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date();
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);

          const { count: dayCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('thread_id', threadIds.map(t => t.id))
            .neq('sender_user_id', userId)
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());
          
          messagesTrend.push(dayCount || 0);
        }
      } else {
        messagesTrend.push(0, 0, 0, 0, 0, 0, 0);
      }

      // Bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*, matches!inner(creator_user_id)', { count: 'exact', head: true })
        .eq('matches.creator_user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      const bookingsTrend: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const { count: dayCount } = await supabase
          .from('bookings')
          .select('*, matches!inner(creator_user_id)', { count: 'exact', head: true })
          .eq('matches.creator_user_id', userId)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        
        bookingsTrend.push(dayCount || 0);
      }

      // Upcoming bookings
      const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('*, matches!inner(creator_user_id)', { count: 'exact', head: true })
        .eq('matches.creator_user_id', userId)
        .gte('date', new Date().toISOString());

      setUpcomingBookings(upcomingCount || 0);

      // Profile completion data
      const { data: profile } = await supabase
        .from('creator_profiles')
        .select('styles, price_band_low, portfolios(id)')
        .eq('user_id', userId)
        .single();

      setPortfolioCount(profile?.portfolios?.length || 0);
      setStylesCount(profile?.styles?.length || 0);
      setHasPrice(!!profile?.price_band_low);

      setMetrics({
        profile_views: viewsCount,
        likes: likesCount || 0,
        matches: matchesCount || 0,
        messages: messagesCount,
        bookings: bookingsCount || 0,
        profile_views_trend: viewsTrend,
        likes_trend: likesTrend,
        matches_trend: matchesTrend,
        messages_trend: messagesTrend,
        bookings_trend: bookingsTrend,
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
          <Button onClick={() => navigate("/creator/calendar")} className="relative">
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
            {upcomingBookings > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-1 text-xs bg-primary text-primary-foreground rounded-full">
                {upcomingBookings}
              </Badge>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <Card className="cursor-pointer hover:shadow-md transition-all border" onClick={() => setViewsDrawerOpen(true)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.profile_views}</div>
                  <Sparkline data={metrics.profile_views_trend} className="text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-all border" onClick={() => setLikesDrawerOpen(true)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Likes</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.likes}</div>
                  <Sparkline data={metrics.likes_trend} className="text-accent mb-1" />
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-all border"
                onClick={() => navigate("/matches")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Matches</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.matches}</div>
                  <Sparkline data={metrics.matches_trend} className="text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-all border"
                onClick={() => navigate("/messages")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.messages}</div>
                  <Sparkline data={metrics.messages_trend} className="text-blue-500 mb-1" />
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-all border"
                onClick={() => navigate("/creator/calendar")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.bookings}</div>
                  <Sparkline data={metrics.bookings_trend} className="text-green-500 mb-1" />
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>
            </div>

            {portfolioCount < 8 || stylesCount < 3 || !hasPrice ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Complete Your Profile</CardTitle>
                  <CardDescription>
                    Boost your visibility by completing these steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {portfolioCount < 8 && (
                      <li className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                        <span>Add 8+ photos so clients see your style</span>
                      </li>
                    )}
                    {stylesCount < 3 && (
                      <li className="flex items-center gap-2">
                        <Badge className="w-4 h-4 text-muted-foreground" />
                        <span>Pick 3+ styles to improve matches</span>
                      </li>
                    )}
                    {!hasPrice && (
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Set price and availability to get booking requests</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ) : metrics.profile_views === 0 && metrics.likes === 0 && metrics.matches === 0 ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    Your profile is ready! Here's how to get discovered:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Share your profile on social media</li>
                    <li>Respond quickly to messages from potential clients</li>
                    <li>Keep your availability calendar up to date</li>
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
                <Button onClick={() => navigate("/creator/profile-setup")} size="lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photos/Projects
                </Button>
                <Button onClick={async () => {
                  const { data: profile } = await supabase
                    .from('users_extended')
                    .select('username')
                    .eq('id', user?.id)
                    .single();
                  
                  const username = profile?.username;
                  if (username) {
                    navigator.clipboard.writeText(`${window.location.origin}/creator/${username}`);
                    alert('Profile link copied!');
                  } else {
                    alert('Please set a username in your profile first');
                  }
                }} variant="secondary" size="lg">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>
                <Button onClick={() => navigate("/creator/calendar")} variant="secondary" size="lg">
                  <Clock className="w-4 h-4 mr-2" />
                  Manage Availability
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
