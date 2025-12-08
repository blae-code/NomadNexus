import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Wallet, AlertTriangle } from "lucide-react";

export default function AUECWarningPanel() {
  // Fetch coffer transactions to calculate total balance
  const { data: transactions = [] } = useQuery({
    queryKey: ['coffer-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coffer_transactions')
        .select('amount')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) {
        console.warn('Failed to fetch transactions:', error);
        return [];
      }
      return data || [];
    }
  });

  const totalBalance = React.useMemo(() => {
    // Sum all transaction amounts to get current balance
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  // Logic: Low if < 50000
  const isLow = totalBalance < 50000;

  if (isLow) {
    return (
      <div className="border-2 border-amber-500/50 bg-amber-950/20 p-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
           <AlertTriangle className="w-6 h-6 text-amber-500" />
           <div>
              <div className="text-amber-500 font-black uppercase tracking-widest text-sm">
                 [!! AUEC RESERVE LOW !!]
              </div>
              <div className="text-amber-400/70 text-xs font-mono">
                 RECOMMEND CONTRIBUTION
              </div>
           </div>
        </div>
        <div className="font-mono text-xl text-amber-500 font-bold">
           {totalBalance.toLocaleString()} aUEC
        </div>
      </div>
    );
  }

  return null;
}