import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const timeoutRef = useRef(null);
  let navigate;
  try { navigate = useNavigate(); } catch {}
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getUser();
        const authUser = data?.user;
        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;

        const mergedUser = {
          id: authUser.id,
          email: authUser.email,
          ...(profile || {}),
        };
        
        // Ensure rank is lowercase
        if (mergedUser.rank) {
          mergedUser.rank = mergedUser.rank.toLowerCase();
        }

        setUser(mergedUser);
        setValue("callsign", mergedUser.callsign || "");
        setValue("rsi_handle", mergedUser.rsi_handle || "");
        setValue("full_name", mergedUser.full_name || authUser.email || "");
        setValue("rank", mergedUser.rank || "vagrant");
      } catch (error) {
        console.error("Failed to load user", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      setErrorMsg("");
      if (!supabase) throw new Error("No Supabase client");
      const userId = user?.id;
      if (!userId) throw new Error("No user session");

      const payload = {
        id: userId,
        callsign: data.callsign?.trim() || null,
        rsi_handle: data.rsi_handle?.trim() || null,
        rank: data.rank?.toLowerCase?.() || 'vagrant',
      };

      console.log("Updating profile with payload:", payload);
      
      const { data: upserted, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      console.log("Profile updated, received:", upserted);

      const nextUser = upserted || { ...user, ...payload };
      setUser(nextUser);
      
      // Invalidate user profile cache to ensure fresh data on next load
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      
      setShowSuccess(true);
      toast.success("Profile updated successfully");
      timeoutRef.current = setTimeout(() => {
        if (navigate) {
          navigate("/NomadOpsDashboard");
        } else {
          window.location.href = "/NomadOpsDashboard";
        }
      }, 1800);
    } catch (error) {
      console.error("Update failed", error);
      setErrorMsg(error.message || "Failed to update profile");
      toast.error("Failed to update profile");
    }
  };

  const isRestricted = (user?.status || user?.rank || '').toLowerCase() === 'restricted' ||
    (Array.isArray(user?.flags) && user.flags.includes('restricted'));

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center font-mono">
        LOADING PROFILE DATA...
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-black text-zinc-200 p-6 flex flex-col items-center font-sans relative overflow-hidden">
       {errorMsg && (
         <div className="fixed top-0 left-0 w-full z-50 flex items-center justify-center bg-black/80">
           <div className="bg-zinc-950 border-2 border-red-700 rounded-lg shadow-2xl p-6 flex flex-col items-center gap-2">
             <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Error</h2>
             <p className="text-zinc-400 font-mono text-sm">{errorMsg}</p>
             <button
               className="mt-2 px-6 py-2 bg-red-700 text-white font-bold rounded shadow hover:bg-red-600 transition-colors border border-red-900"
               onClick={() => setErrorMsg("")}
             >Close</button>
           </div>
         </div>
       )}
       {isRestricted && (
        <div className="brig-overlay z-0">
          <span>RESTRICTED // THE BRIG</span>
        </div>
       )}
       {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 animate-fade-in">
          <div className="bg-zinc-950 border-2 border-[var(--burnt-orange)] rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
           <Shield className="w-8 h-8 text-[var(--burnt-orange)]" />
           <h2 className="text-2xl font-black text-amber-300 uppercase tracking-widest">Profile Updated!</h2>
           <p className="text-zinc-400 font-mono text-sm">Your changes have been saved.<br />Returning to dashboard...</p>
           <button
            className="mt-2 px-6 py-2 bg-[var(--burnt-orange)] text-black font-bold rounded shadow hover:bg-amber-500 transition-colors border border-amber-700"
            onClick={() => {
              setShowSuccess(false);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              toast.success("Returning to dashboard...");
              if (navigate) {
                navigate("/NomadOpsDashboard");
              } else {
                window.location.href = "/NomadOpsDashboard";
              }
            }}
           >Back to Dashboard</button>
          </div>
        </div>
       )}
       {/* Fallback navigation button if user is trapped */}
      {/* End fallback navigation button block */}
       <div className="max-w-2xl w-full space-y-6 relative z-10">
         <div className="flex items-center gap-4 mb-8">
           <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
             <User className="w-8 h-8 text-zinc-500" />
           </div>
           <div>
             <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Operative Profile</h1>
             <p className="text-zinc-500 font-mono text-xs tracking-widest">IDENTITY // CLEARANCE // TAGS</p>
           </div>
         </div>

         <Card className="bg-zinc-950 border-zinc-800">
           <CardHeader className="border-b border-zinc-900 bg-zinc-900/20">
             <CardTitle className="text-lg font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-2">
               <Shield className="w-4 h-4 text-[#ea580c]" />
               Identity Configuration
             </CardTitle>
             <CardDescription className="text-xs font-mono text-zinc-600">
               Update your handle and display preferences.
             </CardDescription>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
               <div className="grid gap-2">
                 <Label htmlFor="full_name" className="text-xs uppercase text-zinc-500 font-bold">Registered Name (Read Only)</Label>
                 <Input 
                  id="full_name" 
                  {...register("full_name")} 
                  disabled 
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-500"
                 />
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="callsign" className="text-xs uppercase text-[#ea580c] font-bold">Callsign / Display Name</Label>
                 <Input 
                  id="callsign" 
                  {...register("callsign")} 
                  className="bg-zinc-900 border-zinc-800 text-white font-mono focus:border-[#ea580c]"
                  placeholder="e.g. System Admin, Maverick..."
                 />
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="rsi_handle" className="text-xs uppercase text-zinc-500 font-bold">RSI Handle (In-Game)</Label>
                 <Input 
                  id="rsi_handle" 
                  {...register("rsi_handle")} 
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-300 font-mono"
                  placeholder="Your Star Citizen handle"
                 />
               </div>

               {/* Temporary Dev Override for Rank */}
               <div className="grid gap-2 pt-4 border-t border-zinc-900/50">
                 <Label htmlFor="rank" className="text-xs uppercase text-zinc-500 font-bold">Clearance Level (Dev Override)</Label>
                 <select 
                  {...register("rank")}
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ea580c] disabled:cursor-not-allowed disabled:opacity-50"
                 >
                  <option value="vagrant">Vagrant</option>
                  <option value="scout">Scout</option>
                  <option value="voyager">Voyager</option>
                  <option value="founder">Founder</option>
                  <option value="pioneer">Pioneer (Admin)</option>
                 </select>
                 <p className="text-[10px] text-zinc-600">Set your rank manually to access restricted systems.</p>
               </div>

               <div className="pt-4 flex items-center justify-between border-t border-zinc-900">
                 <div className="flex flex-col gap-1">
                   <span className="text-[10px] uppercase text-zinc-500 font-bold">Current Clearance</span>
                   <Badge variant="outline" className="w-fit border-zinc-700 text-zinc-400 font-mono">
                     {user?.rank || "VAGRANT"}
                   </Badge>
                 </div>
                 <div className="flex flex-row items-center">
                   {!showSuccess && !errorMsg && (
                     <Button
                       type="button"
                       onClick={() => {
                         if (navigate) {
                           navigate("/NomadOpsDashboard");
                         } else {
                           window.location.href = "/NomadOpsDashboard";
                         }
                       }}
                       className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-[#ea580c] font-bold uppercase tracking-wider px-6 py-2 min-w-[140px] mr-4"
                     >
                       <span className="mr-2">&#8592;</span>Back to Dashboard
                     </Button>
                   )}
                   <Button
                     type="submit"
                     disabled={isSubmitting}
                     className="bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold uppercase tracking-wider px-6 py-2 min-w-[140px]"
                   >
                     {isSubmitting ? "Updating..." : "Save Changes"}
                   </Button>
                 </div>
               </div>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
  );
}
