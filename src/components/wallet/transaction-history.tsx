"use client";

import { ChevronLeft, ChevronRight, Receipt, Clock, Check, X, RotateCcw } from "lucide-react";

interface Transaction {
  id: number;
  type: string;
  status: string;
  amountArs: number;
  description: string | null;
  createdAt: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TYPE_LABELS: Record<string, string> = {
  WALLET_LOAD: "Carga de saldo",
  BUDGET_PURCHASE: "Compra de presupuesto",
  SUBSTITUTION_FEE: "Tarifa de sustitucion",
  LEAGUE_BUYIN: "Entrada a liga",
  LEAGUE_PRIZE: "Premio de liga",
  LEAGUE_REFUND: "Reembolso de liga",
  AI_UNLOCK: "AI Premium",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Check }
> = {
  APPROVED: {
    label: "Aprobada",
    className: "bg-green-800 text-white border-green-900",
    icon: Check,
  },
  PENDING: {
    label: "Pendiente",
    className: "bg-amber-600 text-white border-amber-700",
    icon: Clock,
  },
  REJECTED: {
    label: "Rechazada",
    className: "bg-red-700 text-white border-red-800",
    icon: X,
  },
  REFUNDED: {
    label: "Reembolsada",
    className: "bg-blue-700 text-white border-blue-800",
    icon: RotateCcw,
  },
};

export default function TransactionHistory({
  transactions,
  total,
  page,
  totalPages,
  onPageChange,
}: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="card-retro">
        <div className="card-retro-header">
          <span className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Historial de Transacciones
          </span>
        </div>
        <div className="card-retro-body text-center py-8 text-muted-foreground">
          No tenés transacciones todavia. Cargá saldo para comenzar.
        </div>
      </div>
    );
  }

  return (
    <div className="card-retro">
      <div className="card-retro-header">
        <span className="flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Historial de Transacciones ({total})
        </span>
      </div>
      <div className="card-retro-body p-0">
        <div className="overflow-x-auto">
          <table className="table-retro">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Descripcion</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const statusCfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.PENDING;
                const StatusIcon = statusCfg.icon;
                const dateStr = new Date(tx.createdAt).toLocaleDateString(
                  "es-AR",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <tr key={tx.id}>
                    <td className="whitespace-nowrap text-xs">{dateStr}</td>
                    <td className="font-bold text-xs">
                      {TYPE_LABELS[tx.type] ?? tx.type}
                    </td>
                    <td className="font-heading font-bold whitespace-nowrap">
                      ${tx.amountArs.toLocaleString("es-AR")}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 border text-xs font-heading font-bold ${statusCfg.className}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {tx.description ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t-2 border-border">
            <span className="text-xs text-muted-foreground">
              Pagina {page} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="btn-retro-outline px-2 py-1 text-xs disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="btn-retro-outline px-2 py-1 text-xs disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
