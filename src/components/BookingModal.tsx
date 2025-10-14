import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
  priceLow?: number;
  priceHigh?: number;
}

export const BookingModal = ({
  open,
  onOpenChange,
  creatorId,
  creatorName,
  priceLow,
  priceHigh,
}: BookingModalProps) => {
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [locationText, setLocationText] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!slotDate || !slotStart || !slotEnd) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if match exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("client_user_id", user.id)
        .eq("creator_user_id", creatorId)
        .maybeSingle();

      let matchId = existingMatch?.id;

      // Create match if it doesn't exist
      if (!matchId) {
        const { data: newMatch, error: matchError } = await supabase
          .from("matches")
          .insert({
            client_user_id: user.id,
            creator_user_id: creatorId,
            client_liked: true,
            status: "liked",
          })
          .select()
          .single();

        if (matchError) throw matchError;
        matchId = newMatch.id;
      }

      // Get client details
      const { data: clientData } = await supabase
        .from("users_extended")
        .select("name, avatar_url, city, email")
        .eq("id", user.id)
        .single();

      // Get creator details
      const { data: creatorData } = await supabase
        .from("users_extended")
        .select("name, avatar_url, email")
        .eq("id", creatorId)
        .single();

      // Create booking with denormalized data
      const startDateTime = new Date(`${slotDate}T${slotStart}`);
      const endDateTime = new Date(`${slotDate}T${slotEnd}`);

      const { error: bookingError } = await supabase.from("bookings").insert({
        match_id: matchId,
        slot_start: startDateTime.toISOString(),
        slot_end: endDateTime.toISOString(),
        status: "pending",
        location_text: locationText || null,
        client_name: clientData?.name || null,
        client_avatar_url: clientData?.avatar_url || null,
        client_city: clientData?.city || null,
        client_email: clientData?.email || null,
        creator_name: creatorName,
        creator_avatar_url: creatorData?.avatar_url || null,
        creator_email: creatorData?.email || null,
      });

      if (bookingError) throw bookingError;

      // Create thread if it doesn't exist
      const { data: existingThread } = await supabase
        .from("threads")
        .select("id")
        .eq("client_user_id", user.id)
        .eq("creator_user_id", creatorId)
        .maybeSingle();

      let threadId = existingThread?.id;

      if (!threadId) {
        const { data: newThread, error: threadError } = await supabase
          .from("threads")
          .insert({
            client_user_id: user.id,
            creator_user_id: creatorId,
            status: "open",
          })
          .select()
          .single();

        if (threadError) throw threadError;
        threadId = newThread.id;
      }

      // Send system message
      await supabase.from("messages").insert({
        thread_id: threadId,
        sender_user_id: user.id,
        text: `📅 Booking request: ${startDateTime.toLocaleDateString()} ${startDateTime.toLocaleTimeString(
          "en-US",
          { hour: "numeric", minute: "2-digit" }
        )} - ${endDateTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}${locationText ? `\n📍 ${locationText}` : ""}${notes ? `\n💬 ${notes}` : ""}`,
      });

      toast.success(`Request sent—${creatorName} will confirm or propose a time.`);
      onOpenChange(false);

      // Reset form
      setSlotDate("");
      setSlotStart("");
      setSlotEnd("");
      setLocationText("");
      setNotes("");
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Booking</DialogTitle>
          <DialogDescription>
            Send a booking request to {creatorName}
            {priceLow && priceHigh && (
              <span className="block mt-1 text-sm">
                Estimated: ${priceLow} - ${priceHigh}/hr
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Time *</Label>
              <Input
                id="start"
                type="time"
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Time *</Label>
              <Input
                id="end"
                type="time"
                value={slotEnd}
                onChange={(e) => setSlotEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Where should we meet?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or details..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || !slotDate || !slotStart || !slotEnd}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
