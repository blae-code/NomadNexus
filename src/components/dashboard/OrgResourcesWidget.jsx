import React from "react";
import { Button } from "@/components/ui/button";
import { Sword, Calendar, Youtube, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { createPageUrl } from "@/utils";

export default function OrgResourcesWidget() {
  // 1. Fetch Next Bonfire Meeting
  const { data: nextMeeting } = useQuery({
    queryKey: ['next-bonfire'],
    queryFn: async () => {
      const events = await supabaseApi.entities.Event.list({
        filter: { status: 'scheduled' },
        sort: { start_time: 1 }
      });
      // Find first event with 'Bonfire' in title
      return events.find(e => e.title.toLowerCase().includes('bonfire')) || null;
    }
  });

  return (
    <div className="h-full border border-[var(--burnt-orange)] bg-[var(--gunmetal)] flex flex-col overflow-hidden">
      <div className="label-plate px-3 py-2 border-b border-[var(--burnt-orange)] flex items-center gap-2">
        <Monitor className="w-4 h-4 text-black" />
        ORG RESOURCES
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        <section className="space-y-2">
          <div className="label-plate px-2 py-1 flex items-center gap-2 text-[10px]">
            <Sword className="w-3 h-3 text-black" />
            LOGISTICS & ARMORY
          </div>
          <div className="data-cell flex-col items-start px-4 py-3">
            <p className="text-xs text-white/80 leading-relaxed">
              Submit equipment requisition forms for upcoming operations. Approval required for heavy ordnance.
            </p>
            <a href={createPageUrl("Treasury")} className="block w-full mt-3">
              <Button className="w-full h-9 border border-[var(--burnt-orange)] bg-black text-white hover:bg-[var(--burnt-orange)] hover:text-black">
                OPEN REQUISITION FORM
              </Button>
            </a>
          </div>
        </section>

        <section className="space-y-2">
          <div className="label-plate px-2 py-1 flex items-center gap-2 text-[10px]">
            <Calendar className="w-3 h-3 text-black" />
            RITUAL BONFIRE
          </div>
          <div className="data-cell flex-col items-start px-4 py-3 gap-3">
            {nextMeeting ? (
              <>
                <div className="flex justify-between w-full items-start">
                  <div className="text-sm font-black text-white">{nextMeeting.title}</div>
                  <div className="label-plate px-2 py-0.5">MONTHLY</div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full text-[11px] font-mono">
                  <div className="data-cell px-2 py-2 flex-col items-start">
                    <span className="label-plate px-1 py-0.5 text-[9px]">Local</span>
                    <span className="text-[#00ff41]">
                      {nextMeeting.start_time
                        ? new Date(nextMeeting.start_time).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "TBD"}
                    </span>
                  </div>
                  <div className="data-cell px-2 py-2 flex-col items-start">
                    <span className="label-plate px-1 py-0.5 text-[9px]">UTC</span>
                    <span className="text-[#ffbf00]">
                      {new Date(nextMeeting.start_time)
                        .toUTCString()
                        .split(" ")
                        .slice(0, 5)
                        .join(" ")}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full text-center text-[12px] text-[#ffbf00] font-black">NO BONFIRE SCHEDULED</div>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <div className="label-plate px-2 py-1 flex items-center gap-2 text-[10px]">
            <Youtube className="w-3 h-3 text-black" />
            COMMS RELAY
          </div>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="block group cursor-pointer">
            <div className="relative aspect-video border border-[var(--burnt-orange)] bg-black overflow-hidden">
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                <Youtube className="w-12 h-12 text-[#8a0303] group-hover:text-[var(--burnt-orange)] transition-colors" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black p-2 border-t border-[var(--burnt-orange)]">
                <div className="data-cell px-2 py-1 text-[10px] font-black uppercase flex items-center gap-1">
                  Latest Operation Highlights <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          </a>
        </section>
      </div>
    </div>
  );
}

function Monitor(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  )
}