import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateGoogleCalendarUrl, generateICSFile, downloadICSFile } from "@/lib/calendar-utils";

interface Booking {
  id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  match_id: string;
  location_text?: string;
  client_name?: string;
  client_avatar_url?: string;
  client_city?: string;
  client_email?: string;
}

const Calendar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadBookings(session.user.id);
      }
    });
  }, []);

  const loadBookings = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          matches!inner(
            client_user_id,
            creator_user_id,
            brief_id
          )
        `)
        .eq("matches.creator_user_id", userId)
        .order("slot_start", { ascending: true });

      if (error) throw error;

      // Fetch client details for each booking
      const bookingsWithDetails = await Promise.all(
        (data || []).map(async (booking: any) => {
          const { data: clientData } = await supabase
            .from("users_extended")
            .select("name, city, avatar_url, email")
            .eq("id", booking.matches.client_user_id)
            .single();

          return {
            ...booking,
            client_name: clientData?.name,
            client_city: clientData?.city,
            client_avatar_url: clientData?.avatar_url,
            client_email: clientData?.email,
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking confirmed!");
      setSelectedBooking(null);
      if (user) loadBookings(user.id);
    } catch (error: any) {
      console.error("Error approving booking:", error);
      toast.error("Failed to confirm booking");
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking declined");
      setSelectedBooking(null);
      if (user) loadBookings(user.id);
    } catch (error: any) {
      console.error("Error declining booking:", error);
      toast.error("Failed to decline booking");
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getBookingsForDay = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split("T")[0];

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.slot_start).toISOString().split("T")[0];
      return bookingDate === dateStr;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "soft_confirmed":
        return "bg-yellow-500/20 border-yellow-500";
      case "confirmed":
        return "bg-green-500/20 border-green-500";
      case "cancelled":
        return "bg-red-500/20 border-red-500";
      case "completed":
        return "bg-blue-500/20 border-blue-500";
      default:
        return "bg-muted border-border";
    }
  };

  const handleExportToGoogle = (booking: Booking) => {
    const title = `Photo session with ${booking.client_name || "Client"}`;
    const url = generateGoogleCalendarUrl(
      title,
      booking.slot_start,
      booking.slot_end,
      booking.location_text,
      `Booking with ${booking.client_name || "Client"}`
    );
    window.open(url, "_blank");
    toast.success("Opening Google Calendar...");
  };

  const handleExportToICS = async (booking: Booking) => {
    const title = `Photo session with ${booking.client_name || "Client"}`;
    const { data: { user } } = await supabase.auth.getUser();
    
    const icsContent = generateICSFile(
      booking.id,
      title,
      booking.slot_start,
      booking.slot_end,
      booking.location_text,
      `Booking with ${booking.client_name || "Client"}`,
      user?.email,
      booking.client_email
    );
    
    downloadICSFile(icsContent, `booking-${booking.id}`);
    toast.success("ICS file ready—import to your calendar.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Calendar</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/creator/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dayBookings = getBookingsForDay(day);
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded-lg p-2 hover:bg-muted/50 transition-colors cursor-pointer ${
                      isToday ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">{day}</div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`text-xs px-1 py-0.5 rounded border ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {new Date(booking.slot_start).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-muted-foreground">+{dayBookings.length - 2}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border bg-yellow-500/20 border-yellow-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border bg-green-500/20 border-green-500" />
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border bg-blue-500/20 border-blue-500" />
                <span>Completed</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Sheet open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>Review and manage this booking</SheetDescription>
          </SheetHeader>

          {selectedBooking && (
            <div className="space-y-4 mt-6">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <div className="flex items-center gap-3 mt-1">
                  {selectedBooking.client_avatar_url && (
                    <img
                      src={selectedBooking.client_avatar_url}
                      alt={selectedBooking.client_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold">
                      {selectedBooking.client_name || "Client"}
                    </p>
                    {selectedBooking.client_city && (
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.client_city}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-semibold">
                  {new Date(selectedBooking.slot_start).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm">
                  {new Date(selectedBooking.slot_start).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(selectedBooking.slot_end).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {selectedBooking.location_text && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-sm">{selectedBooking.location_text}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{selectedBooking.status.replace("_", " ")}</p>
              </div>

              {selectedBooking.status === "confirmed" && (
                <div className="space-y-2 pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Export to Calendar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportToGoogle(selectedBooking)}>
                        Add to Google Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportToICS(selectedBooking)}>
                        Download ICS (Apple/Outlook)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {(selectedBooking.status === "pending" || selectedBooking.status === "soft_confirmed") && (
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={() => handleApprove(selectedBooking.id)}
                    className="w-full"
                  >
                    Confirm Booking
                  </Button>
                  <Button
                    onClick={() => handleDecline(selectedBooking.id)}
                    variant="outline"
                    className="w-full"
                  >
                    Decline
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/messages`)}
              >
                Message Client
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Calendar;
