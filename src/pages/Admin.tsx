import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    loadData();
  };

  const loadData = async () => {
    try {
      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('users_extended')
        .select(`
          *,
          user_roles(role)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load creators with profiles
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('creator_profiles')
        .select(`
          *,
          users_extended!creator_profiles_user_id_fkey(
            name,
            email,
            city,
            avatar_url
          ),
          portfolio_images(url)
        `)
        .order('created_at', { ascending: false });

      if (creatorsError) throw creatorsError;
      setCreators(creatorsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'verified' ? 'unverified' : 'verified';
      
      const { error } = await supabase
        .from('creator_profiles')
        .update({ verification_status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Creator ${newStatus === 'verified' ? 'verified' : 'unverified'}`);
      loadData();
    } catch (error: any) {
      toast.error("Failed to update verification status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'creator' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.city || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creators" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator Profiles ({creators.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creators.map((creator) => (
                    <Card key={creator.user_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={creator.users_extended?.avatar_url || undefined} />
                            <AvatarFallback>
                              {creator.users_extended?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">
                                {creator.users_extended?.name}
                              </h3>
                              <Badge 
                                variant={creator.verification_status === 'verified' ? 'default' : 'secondary'}
                              >
                                {creator.verification_status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {creator.users_extended?.email}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>{creator.users_extended?.city || 'Location not set'}</span>
                              {creator.price_band_low && (
                                <span>
                                  ${creator.price_band_low} - ${creator.price_band_high}/hr
                                </span>
                              )}
                              <span>{creator.portfolio_images?.length || 0} images</span>
                            </div>

                            {creator.styles && creator.styles.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {creator.styles.map((style: string) => (
                                  <Badge key={style} variant="outline">
                                    {style}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {creator.portfolio_images && creator.portfolio_images.length > 0 && (
                              <div className="flex gap-2 mb-3">
                                {creator.portfolio_images.slice(0, 4).map((img: any, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img.url}
                                    alt={`Portfolio ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                ))}
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant={creator.verification_status === 'verified' ? 'outline' : 'default'}
                              onClick={() => toggleVerification(creator.user_id, creator.verification_status)}
                            >
                              {creator.verification_status === 'verified' ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Unverify
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Verify
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
