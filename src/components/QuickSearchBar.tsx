import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { STYLE_OPTIONS } from "@/lib/constants";

const BUDGET_STEPS = [0, 50, 100, 250, 500, 1000, 2000, 5000];

export const QuickSearchBar = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [budgetIndex, setBudgetIndex] = useState(0);
  const [detecting, setDetecting] = useState(false);

  const handleDetectLocation = () => {
    setDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setDetecting(false);
        },
        () => {
          setDetecting(false);
        }
      );
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedStyle) params.set('styles', selectedStyle);
    if (budgetIndex > 0) params.set('minBudget', String(BUDGET_STEPS[budgetIndex]));
    if (location) {
      const coords = location.split(',').map(s => s.trim());
      if (coords.length === 2) {
        params.set('lat', coords[0]);
        params.set('lon', coords[1]);
      }
    }
    navigate(`/discover?${params.toString()}`);
  };

  const formatBudget = (value: number) => {
    if (value === 0) return 'Any';
    if (value >= 1000) return `$${value / 1000}k`;
    return `$${value}`;
  };

  return (
    <div className="bg-card rounded-2xl shadow-md p-6 max-w-4xl mx-auto border border-border">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-2 block">Location</label>
          <div className="flex gap-2">
            <Input
              placeholder="City or coords"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleDetectLocation}
              disabled={detecting}
              title="Detect location"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="text-sm font-medium mb-2 block">Style</label>
          <select
            className="w-full h-10 px-3 border border-input rounded-md bg-background"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          >
            <option value="">All Styles</option>
            {STYLE_OPTIONS.slice(0, 6).map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-2 block">
            Budget ≥ {formatBudget(BUDGET_STEPS[budgetIndex])}
          </label>
          <input
            type="range"
            min={0}
            max={BUDGET_STEPS.length - 1}
            step={1}
            value={budgetIndex}
            onChange={(e) => setBudgetIndex(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="md:col-span-2">
          <Button 
            onClick={handleSearch}
            className="w-full bg-primary hover:brightness-90 text-primary-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};
