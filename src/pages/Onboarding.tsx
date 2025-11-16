import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { profileSchema } from "@/lib/validation";
import { z } from "zod";

const Onboarding = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkExistingProfile(session.user.id);
      }
    });
  }, []);

  const checkExistingProfile = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      if (data.role === "creator") {
        navigate("/creator/dashboard");
      } else {
        navigate("/client/discover");
      }
    }
  };

  const handleRoleSelection = async (role: "creator" | "client") => {
    if (!user) return;

    try {
      // Validate name
      const userName = user.user_metadata?.name || "User";
      const validated = profileSchema.pick({ name: true }).parse({ name: userName });

      // Insert into users_extended (without role - stored in user_roles for security)
      const { error: userError } = await supabase.from("users_extended").insert({
        id: user.id,
        email: user.email,
        name: validated.name,
      });

      if (userError) throw userError;

      // Insert role into user_roles table for security
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: role,
      });

      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      if (role === "creator") {
        // Create creator profile
        await supabase.from("creator_profiles").insert({
          user_id: user.id,
        });

        // Create free subscription
        await supabase.from("subscriptions").insert({
          creator_user_id: user.id,
          plan: "free",
        });

        navigate("/creator/profile-setup");
      } else {
        navigate("/client/brief-setup");
      }

      toast({
        title: "Profile created!",
        description: `Let's set up your ${role} profile.`,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-card">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Role</h1>
          <p className="text-muted-foreground">Are you a photographer or looking to hire one?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-elevated cursor-pointer hover:shadow-glow transition-smooth" onClick={() => handleRoleSelection("creator")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>I'm a Photographer</CardTitle>
              <CardDescription>Showcase your work and connect with clients</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Build your portfolio</li>
                <li>• Set your pricing and availability</li>
                <li>• Get matched with ideal clients</li>
                <li>• Receive booking requests</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-elevated cursor-pointer hover:shadow-glow transition-smooth" onClick={() => handleRoleSelection("client")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle>I Need a Photographer</CardTitle>
              <CardDescription>Find the perfect photographer for your project</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Browse talented photographers</li>
                <li>• Create project briefs</li>
                <li>• See AI-powered matches</li>
                <li>• Book with confidence</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
