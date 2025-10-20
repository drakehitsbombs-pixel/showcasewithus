import { Star, MessageSquare, Users } from "lucide-react";

export function SocialProof() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5" />
        <span className="text-sm font-medium">
          Trusted by <strong className="text-foreground">1,200+</strong> clients this year
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-accent text-accent" />
          ))}
        </div>
        <span className="text-sm font-medium">
          <strong className="text-foreground">4.8</strong> average rating
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm font-medium">
          <strong className="text-foreground">7k+</strong> messages sent
        </span>
      </div>
    </div>
  );
}
