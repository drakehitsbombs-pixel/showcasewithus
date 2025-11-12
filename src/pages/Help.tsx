import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Camera, Users, Calendar, MessageSquare } from "lucide-react";
import Footer from "@/components/Footer";

const Help = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about ShowCase
          </p>
        </div>

        <div className="grid gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>For Clients</CardTitle>
              </div>
              <CardDescription>Learn how to find and book photographers</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I find photographers?</AccordionTrigger>
                  <AccordionContent>
                    Browse the Discover page to see photographers in your area. You can filter by location, shoot type, and price range. Each profile shows their portfolio, styles, and starting price.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Do I need an account to browse?</AccordionTrigger>
                  <AccordionContent>
                    No! You can browse all photographer profiles without creating an account. You'll only need to sign up when you're ready to book a shoot.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How does booking work?</AccordionTrigger>
                  <AccordionContent>
                    Click the "Book" button on any photographer's profile. You'll be asked to sign up or log in, then complete a simple form with your shoot details. The photographer will receive your request and respond directly.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I contact photographers directly?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Many photographers choose to display their email and phone number on their public profile. You can click these to email or call them directly without creating an account.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <CardTitle>For Photographers</CardTitle>
              </div>
              <CardDescription>Get the most out of your ShowCase profile</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I create a profile?</AccordionTrigger>
                  <AccordionContent>
                    Sign up and complete the onboarding flow. Add your professional name, bio, city, photography styles, pricing, and upload 10-20 of your best images. Your profile will be live immediately.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Should I show my contact info?</AccordionTrigger>
                  <AccordionContent>
                    It's up to you! You can toggle email and phone visibility in your settings. Showing contact info lets potential clients reach you directly via email or text, even if they don't have a ShowCase account.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do bookings work?</AccordionTrigger>
                  <AccordionContent>
                    When a client submits a booking request, you'll receive an email notification. Review the details and respond to confirm or discuss further. All bookings start with status "requested" until you accept.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How can I get featured on Showcase?</AccordionTrigger>
                  <AccordionContent>
                    The Showcase tab displays the most-viewed photographers. The more profile views you get, the higher you'll rank. Make sure your public profile is enabled and share your profile link on social media.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-secondary-foreground" />
                </div>
                <CardTitle>General</CardTitle>
              </div>
              <CardDescription>Common questions about ShowCase</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is ShowCase free to use?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Both clients and photographers can use ShowCase for free. We don't charge booking fees or commissions.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do payments work?</AccordionTrigger>
                  <AccordionContent>
                    All payments are handled directly between clients and photographers. ShowCase doesn't process payments – we simply connect you. Discuss pricing and payment methods directly with your photographer.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What if I need help with something else?</AccordionTrigger>
                  <AccordionContent>
                    We're here to help! Visit our <Link to="/contact" className="text-primary underline">Contact Us</Link> page to send us a message. We typically respond within 24 hours.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is ready to help you out
            </p>
            <Link to="/contact">
              <Button>Contact Support</Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
