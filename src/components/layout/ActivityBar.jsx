import React from "react";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  LayoutGrid, 
  Radio, 
  Calendar, 
  ShieldAlert, 
  Coins, 
  Users,
  Lock,
  Rocket,
  Target
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function ActivityBar() {
  // The activity bar is intentionally hidden for now to keep the viewport clear.
  // Preserve component for future use without rendering UI.
  return null;
}
