import { Search, Users, CheckCircle } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Tell us your style & budget",
      description: "Share what you're looking for and we'll match you with the perfect photographers"
    },
    {
      icon: Users,
      title: "Match with local photographers",
      description: "Browse profiles, portfolios, and reviews from talented photographers in your area"
    },
    {
      icon: CheckCircle,
      title: "Book with confidence",
      description: "Message, compare quotes, and secure your photographer all in one place"
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
