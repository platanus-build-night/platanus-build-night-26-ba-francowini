"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet } from "lucide-react";
import BalanceCard from "@/components/wallet/balance-card";
import TransactionHistory from "@/components/wallet/transaction-history";
import BudgetPurchase from "@/components/wallet/budget-purchase";
import AiUnlockCard from "@/components/wallet/ai-unlock-card";

interface WalletBalance {
  virtualBudget: number;
  realBalance: number;
  feeWaived: boolean;
}

interface Transaction {
  id: number;
  type: string;
  status: string;
  amountArs: number;
  description: string | null;
  createdAt: string;
}

interface TransactionsPage {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BudgetTier {
  id: string;
  virtualAmount: number;
  priceArs: number;
}

interface BudgetData {
  tiers: BudgetTier[];
  feeWaived: boolean;
  feeRate: number;
}

interface UserProfile {
  aiUnlocked: boolean;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<TransactionsPage | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);

  const fetchWalletData = useCallback(async (page: number) => {
    try {
      const res = await fetch(`/api/wallet?page=${page}&pageSize=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    }
  }, []);

  const fetchBudgetData = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/budget");
      const data = await res.json();
      if (res.ok) setBudgetData(data);
    } catch {
      // Non-critical — budget tiers just won't show
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) setProfile({ aiUnlocked: data.aiUnlocked });
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchWalletData(1),
      fetchBudgetData(),
      fetchProfile(),
    ]).finally(() => setLoading(false));
  }, [fetchWalletData, fetchBudgetData, fetchProfile]);

  const handlePageChange = (newPage: number) => {
    setTxPage(newPage);
    fetchWalletData(newPage);
  };

  const handleRefresh = () => {
    fetchWalletData(txPage);
    fetchBudgetData();
    fetchProfile();
  };

  if (loading) {
    return <WalletSkeleton />;
  }

  if (error && !balance) {
    return (
      <div className="card-retro">
        <div className="card-retro-header">
          <span className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Billetera
          </span>
        </div>
        <div className="card-retro-body text-center py-8">
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={handleRefresh}
            className="btn-retro-outline mt-4"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold uppercase">
        Billetera
      </h1>

      {/* Balance card */}
      {balance && (
        <BalanceCard
          virtualBudget={balance.virtualBudget}
          realBalance={balance.realBalance}
          feeWaived={balance.feeWaived}
          onLoadSuccess={handleRefresh}
        />
      )}

      {/* Budget purchase */}
      {budgetData && (
        <BudgetPurchase
          tiers={budgetData.tiers}
          feeWaived={budgetData.feeWaived}
          feeRate={budgetData.feeRate}
          onPurchaseSuccess={handleRefresh}
        />
      )}

      {/* AI unlock */}
      {profile && (
        <AiUnlockCard
          aiUnlocked={profile.aiUnlocked}
          onPurchaseSuccess={handleRefresh}
        />
      )}

      {/* Transaction history */}
      {transactions && (
        <TransactionHistory
          transactions={transactions.data}
          total={transactions.total}
          page={transactions.page}
          pageSize={transactions.pageSize}
          totalPages={transactions.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

function WalletSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse" />

      {/* Balance skeleton */}
      <div className="card-retro">
        <div className="header-bar-accent">Billetera</div>
        <div className="card-retro-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="border-2 border-border p-4 text-center">
              <div className="h-4 w-24 bg-muted animate-pulse mx-auto mb-2" />
              <div className="h-10 w-32 bg-muted animate-pulse mx-auto" />
            </div>
            <div className="border-2 border-border p-4 text-center">
              <div className="h-4 w-24 bg-muted animate-pulse mx-auto mb-2" />
              <div className="h-10 w-32 bg-muted animate-pulse mx-auto" />
            </div>
          </div>
          <div className="h-10 w-full bg-muted animate-pulse" />
        </div>
      </div>

      {/* Budget skeleton */}
      <div className="card-retro">
        <div className="card-retro-header">Comprar Presupuesto Virtual</div>
        <div className="card-retro-body">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-border p-4 space-y-3">
                <div className="h-8 w-20 bg-muted animate-pulse mx-auto" />
                <div className="h-4 w-16 bg-muted animate-pulse mx-auto" />
                <div className="h-10 w-full bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction skeleton */}
      <div className="card-retro">
        <div className="card-retro-header">Historial de Transacciones</div>
        <div className="card-retro-body p-0">
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 px-3 py-3 border-b border-border"
              >
                <div className="h-4 w-20 bg-muted animate-pulse" />
                <div className="h-4 w-24 bg-muted animate-pulse" />
                <div className="h-4 w-16 bg-muted animate-pulse" />
                <div className="h-4 w-16 bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
