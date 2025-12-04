import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { Shield, Box, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ArmoryStatusPanel() {
  const { data: items = [] } = useQuery({
    queryKey: ['armory-status-gauge'],
    queryFn: async () => {
      return supabaseApi.entities.ArmoryItem.list({
        sort: { quantity: 1 },
        limit: 4
      });
    }
  });

  const getIcon = (category) => {
    switch(category) {
      case 'WEAPON': return Shield;
      case 'MEDICAL': return Syringe;
      default: return Box;
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage < 10) return "bg-[#8a0303]";
    if (percentage < 50) return "bg-[#ffbf00]";
    return "bg-[#00ff41]";
  };

  const getTextColor = (percentage) => {
    if (percentage < 10) return "text-[#8a0303]";
    if (percentage < 50) return "text-[#ffbf00]";
    return "text-[#00ff41]";
  };

  return (
    <div className="border border-[var(--burnt-orange)] bg-[var(--gunmetal)] h-full flex flex-col">
      <div className="label-plate px-3 py-2 border-b border-[var(--burnt-orange)] flex items-center gap-2">
        <Shield className="w-3 h-3 text-black" />
        ARMORY LEVELS
      </div>

      <div className="flex-1 p-3 flex flex-col justify-center gap-3 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center text-[#ffbf00] text-xs font-black">NO INVENTORY DATA</div>
        ) : (
          items.map((item) => {
            const Icon = getIcon(item.category);
            const max = 100;
            const percentage = Math.min(100, Math.max(0, (item.quantity / max) * 100));
            const barColor = getStatusColor(percentage);
            const textColor = getTextColor(percentage);

            return (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-black tracking-[0.18em] items-center">
                  <span className="text-white flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-[var(--burnt-orange)]" />
                    {item.name}
                  </span>
                  <span className={cn("font-mono", textColor)}>{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-black border border-[var(--burnt-orange)]">
                  <div className={cn("h-full transition-all duration-500", barColor)} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}