import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ClickableStyleChipProps {
  styleId: string;
  label: string;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export const ClickableStyleChip = ({ styleId, label, variant = "outline", className = "" }: ClickableStyleChipProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/client/discover?tab=search&styles=${styleId}`);
  };

  return (
    <Badge
      variant={variant}
      className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${className}`}
      onClick={handleClick}
    >
      {label}
    </Badge>
  );
};
