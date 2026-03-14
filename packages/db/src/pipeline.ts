import { Prisma, TransactionRepresenting, TransactionStatus } from "@prisma/client";
import { prisma } from "./client";

export type OfficePipelineStatus = "Opportunity" | "Active" | "Pending" | "Closed" | "Cancelled";
export type OfficePipelineHistoryStatus = Extract<OfficePipelineStatus, "Closed" | "Cancelled">;
export type OfficePipelineMetricMode = "transaction_volume" | "office_net" | "office_gross";
export type OfficePipelineRepresentingFilter = TransactionRepresenting | "all";

export type OfficePipelineOwnerOption = {
  id: string;
  label: string;
};

export type OfficePipelineMetricOption = {
  value: OfficePipelineMetricMode;
  label: string;
  description: string;
};

export type OfficePipelineFunnelBucket = {
  status: Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">;
  count: number;
  metricLabel: string;
  shareLabel: string;
};

export type OfficePipelineHistoryBucket = {
  status: OfficePipelineHistoryStatus;
  count: number;
  metricLabel: string;
};

export type OfficePipelineHistoryMonth = {
  monthKey: string;
  label: string;
  totalCount: number;
  totalMetricLabel: string;
  buckets: OfficePipelineHistoryBucket[];
};

export type OfficePipelineWorkspaceRow = {
  id: string;
  title: string;
  addressLine: string;
  cityState: string;
  status: OfficePipelineStatus;
  representing: string;
  owner: string;
  priceLabel: string;
  metricValueLabel: string;
  keyDateTypeLabel: string;
  keyDateLabel: string;
  updatedLabel: string;
};

export type OfficePipelineWorkspaceSnapshot = {
  filters: {
    search: string;
    representing: OfficePipelineRepresentingFilter;
    ownerMembershipId: string;
    metricMode: OfficePipelineMetricMode;
    metricOptions: OfficePipelineMetricOption[];
    ownerOptions: OfficePipelineOwnerOption[];
    stage: Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending"> | "";
    historyStatus: OfficePipelineHistoryStatus | "";
    historyMonth: string;
  };
  metricModeLabel: string;
  metricModeDescription: string;
  selection: {
    kind: "all" | "stage" | "history";
    label: string;
    note: string;
    contextChips: string[];
  };
  workspaceSummary: {
    filteredTransactions: {
      count: number;
      metricLabel: string;
      note: string;
    };
    livePipeline: {
      count: number;
      metricLabel: string;
      note: string;
    };
    recentHistory: {
      count: number;
      metricLabel: string;
      note: string;
    };
    selectedView: {
      count: number;
      metricLabel: string;
      note: string;
    };
  };
  funnelBuckets: OfficePipelineFunnelBucket[];
  historyMonths: OfficePipelineHistoryMonth[];
  listSummary: {
    totalCount: number;
    metricLabel: string;
  };
  rows: OfficePipelineWorkspaceRow[];
};

export type GetOfficePipelineWorkspaceInput = {
  organizationId: string;
  officeId?: string | null;
  search?: string;
  representing?: string;
  ownerMembershipId?: string;
  metricMode?: string;
  stage?: string;
  historyStatus?: string;
  historyMonth?: string;
};

type PipelineWorkspaceTransaction = {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: Prisma.Decimal | null;
  grossCommission: Prisma.Decimal | null;
  officeNet: Prisma.Decimal | null;
  importantDate: Date | null;
  closingDate: Date | null;
  updatedAt: Date;
  status: TransactionStatus;
  representing: TransactionRepresenting;
  ownerMembershipId: string | null;
  ownerMembership: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
};

const activePipelineStatuses: Array<Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">> = [
  "Opportunity",
  "Active",
  "Pending"
];
const historyPipelineStatuses: OfficePipelineHistoryStatus[] = ["Closed", "Cancelled"];
const pipelineHistoryWindowMonths = 6;

const pipelineStatusFromDb: Record<TransactionStatus, OfficePipelineStatus> = {
  opportunity: "Opportunity",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  cancelled: "Cancelled"
};

const representingLabelMap: Record<TransactionRepresenting, string> = {
  buyer: "Buyer",
  seller: "Seller",
  both: "Both",
  tenant: "Tenant",
  landlord: "Landlord"
};

const metricModeLabels: Record<OfficePipelineMetricMode, string> = {
  transaction_volume: "Transaction volume",
  office_net: "Office net",
  office_gross: "Office gross"
};
const metricModeOrder: OfficePipelineMetricMode[] = ["transaction_volume", "office_net", "office_gross"];

function normalizeRepresentingFilter(value: string | undefined): OfficePipelineRepresentingFilter {
  if (!value || value === "all") {
    return "all";
  }

  return ["buyer", "seller", "both", "tenant", "landlord"].includes(value) ? (value as TransactionRepresenting) : "all";
}

function normalizeMetricMode(value: string | undefined): OfficePipelineMetricMode {
  if (value === "office_net") {
    return "office_net";
  }

  if (value === "office_gross") {
    return "office_gross";
  }

  return "transaction_volume";
}

function normalizeStage(value: string | undefined): Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending"> | "" {
  return activePipelineStatuses.includes(value as Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">)
    ? (value as Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">)
    : "";
}

function normalizeHistoryStatus(value: string | undefined): OfficePipelineHistoryStatus | "" {
  return historyPipelineStatuses.includes(value as OfficePipelineHistoryStatus) ? (value as OfficePipelineHistoryStatus) : "";
}

function normalizeHistoryMonth(value: string | undefined) {
  if (!value) {
    return "";
  }

  return /^\d{4}-\d{2}$/.test(value) ? value : "";
}

function formatCurrency(value: Prisma.Decimal | number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
  }).format(numericValue);
}

function formatDateLabel(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric"
  });
}

function getTransactionMetricValue(
  transaction: Pick<PipelineWorkspaceTransaction, "price" | "grossCommission" | "officeNet">,
  metricMode: OfficePipelineMetricMode
) {
  if (metricMode === "office_net") {
    return Number(transaction.officeNet ?? 0);
  }

  if (metricMode === "office_gross") {
    return Number(transaction.grossCommission ?? 0);
  }

  return Number(transaction.price ?? 0);
}

function getMonthlyRollupDate(transaction: Pick<PipelineWorkspaceTransaction, "closingDate" | "updatedAt">) {
  return transaction.closingDate ?? transaction.updatedAt;
}

function getMonthlyRollupKey(transaction: Pick<PipelineWorkspaceTransaction, "closingDate" | "updatedAt">) {
  return getMonthlyRollupDate(transaction).toISOString().slice(0, 7);
}

function buildTopLevelWhere(input: GetOfficePipelineWorkspaceInput, representing: OfficePipelineRepresentingFilter): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    organizationId: input.organizationId
  };

  if (input.officeId) {
    where.officeId = input.officeId;
  }

  if (representing !== "all") {
    where.representing = representing;
  }

  if (input.ownerMembershipId?.trim()) {
    where.ownerMembershipId = input.ownerMembershipId.trim();
  }

  if (input.search?.trim()) {
    const query = input.search.trim();

    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { address: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
      { state: { contains: query, mode: "insensitive" } },
      { zipCode: { contains: query, mode: "insensitive" } },
      {
        ownerMembership: {
          user: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } }
            ]
          }
        }
      }
    ];
  }

  return where;
}

function buildHistoryMonthKeys() {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  for (let index = 0; index < pipelineHistoryWindowMonths; index += 1) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    keys.push(monthKey);
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return keys;
}

function buildOwnerLabel(transaction: PipelineWorkspaceTransaction) {
  return transaction.ownerMembership
    ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
    : "Unassigned";
}

function buildSelectionState(
  stage: OfficePipelineWorkspaceSnapshot["filters"]["stage"],
  historyStatus: OfficePipelineWorkspaceSnapshot["filters"]["historyStatus"],
  historyMonth: string,
  contextChips: string[]
) {
  if (stage) {
    return {
      kind: "stage" as const,
      label: `${stage} stage`,
      note: "Showing the working list for the selected live funnel stage after the current top filters.",
      contextChips
    };
  }

  if (historyStatus && historyMonth) {
    return {
      kind: "history" as const,
      label: `${historyStatus} · ${formatMonthLabel(historyMonth)}`,
      note: "Closed / cancelled history uses closing date when available, otherwise updated date as the documented fallback.",
      contextChips
    };
  }

  return {
    kind: "all" as const,
    label: "All filtered transactions",
    note: "Showing every transaction that matches the current top-level pipeline filters.",
    contextChips
  };
}

function buildMetricModeDescription(metricMode: OfficePipelineMetricMode) {
  if (metricMode === "office_net") {
    return "Uses the office net values saved on each transaction; missing values are treated as zero.";
  }

  if (metricMode === "office_gross") {
    return "Uses the gross commission values saved on each transaction; missing values are treated as zero.";
  }

  return "Uses transaction price as the current pipeline volume metric.";
}

function isLivePipelineStatus(
  status: OfficePipelineStatus
): status is Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending"> {
  return activePipelineStatuses.includes(status as Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">);
}

function mapPipelineRow(transaction: PipelineWorkspaceTransaction, metricMode: OfficePipelineMetricMode): OfficePipelineWorkspaceRow {
  const keyDate = transaction.closingDate ?? transaction.importantDate;
  const cityState = [transaction.city, transaction.state].filter(Boolean).join(", ");

  return {
    id: transaction.id,
    title: transaction.title,
    addressLine: transaction.address,
    cityState: cityState || transaction.zipCode || "—",
    status: pipelineStatusFromDb[transaction.status],
    representing: representingLabelMap[transaction.representing],
    owner: buildOwnerLabel(transaction),
    priceLabel: formatCurrency(transaction.price),
    metricValueLabel: formatCurrency(getTransactionMetricValue(transaction, metricMode)),
    keyDateTypeLabel: transaction.closingDate ? "Closing" : transaction.importantDate ? "Important date" : "Key date",
    keyDateLabel: keyDate ? formatDateLabel(keyDate) : "—",
    updatedLabel: formatDateLabel(transaction.updatedAt)
  };
}

export async function getOfficePipelineWorkspaceSnapshot(
  input: GetOfficePipelineWorkspaceInput
): Promise<OfficePipelineWorkspaceSnapshot> {
  const representing = normalizeRepresentingFilter(input.representing);
  const metricMode = normalizeMetricMode(input.metricMode);
  const stage = normalizeStage(input.stage);
  const historyStatus = normalizeHistoryStatus(input.historyStatus);
  const historyMonth = normalizeHistoryMonth(input.historyMonth);
  const where = buildTopLevelWhere(input, representing);

  const [transactions, ownerMemberships] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        ownerMembership: {
          include: {
            user: true
          }
        }
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        status: "active",
        ...(input.officeId ? { officeId: input.officeId } : {}),
        transactionsOwned: {
          some: {
            organizationId: input.organizationId,
            ...(input.officeId ? { officeId: input.officeId } : {})
          }
        }
      },
      include: {
        user: true
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }]
    })
  ]);

  const ownerOptions = ownerMemberships.map((membership) => ({
    id: membership.id,
    label: `${membership.user.firstName} ${membership.user.lastName}`
  }));
  const ownerFilterLabel = input.ownerMembershipId?.trim()
    ? ownerOptions.find((option) => option.id === input.ownerMembershipId?.trim())?.label ?? "Selected owner"
    : "Any owner / agent";
  const representingFilterLabel = representing === "all" ? "Any side" : `${representingLabelMap[representing]} side`;
  const metricOptions = metricModeOrder.map((value) => ({
    value,
    label: metricModeLabels[value],
    description: buildMetricModeDescription(value)
  }));
  const selectionContextChips = [
    representingFilterLabel,
    ownerFilterLabel,
    `Metric: ${metricModeLabels[metricMode]}`,
    ...(input.search?.trim() ? [`Search: ${input.search.trim()}`] : [])
  ];
  const livePipelineTransactions = transactions.filter((transaction) => isLivePipelineStatus(pipelineStatusFromDb[transaction.status]));
  const livePipelineCount = livePipelineTransactions.length;
  const livePipelineMetric = livePipelineTransactions.reduce(
    (sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode),
    0
  );

  const funnelBuckets = activePipelineStatuses.map((currentStatus) => {
    const scopedTransactions = transactions.filter((transaction) => pipelineStatusFromDb[transaction.status] === currentStatus);
    const totalMetric = scopedTransactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);

    return {
      status: currentStatus,
      count: scopedTransactions.length,
      metricLabel: formatCurrency(totalMetric),
      shareLabel: livePipelineCount > 0 ? `${Math.round((scopedTransactions.length / livePipelineCount) * 100)}% of live funnel` : "0% of live funnel"
    };
  });

  const historyMonthKeys = buildHistoryMonthKeys();
  const recentHistoryTransactions = transactions.filter((transaction) => {
    const status = pipelineStatusFromDb[transaction.status];
    return historyPipelineStatuses.includes(status as OfficePipelineHistoryStatus) && historyMonthKeys.includes(getMonthlyRollupKey(transaction));
  });
  const recentHistoryMetric = recentHistoryTransactions.reduce(
    (sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode),
    0
  );
  const historyMonths = historyMonthKeys
    .map((monthKey) => {
      const bucketMetrics = historyPipelineStatuses.map((currentStatus) => {
        const scopedTransactions = transactions.filter(
          (transaction) =>
            pipelineStatusFromDb[transaction.status] === currentStatus && getMonthlyRollupKey(transaction) === monthKey
        );
        const totalMetric = scopedTransactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);

        return {
          totalMetric,
          status: currentStatus,
          count: scopedTransactions.length,
          metricLabel: formatCurrency(totalMetric)
        };
      });
      const totalCount = bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0);
      const totalMetric = bucketMetrics.reduce((sum, bucket) => sum + bucket.totalMetric, 0);

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        totalCount,
        totalMetricLabel: formatCurrency(totalMetric),
        buckets: bucketMetrics.map(({ totalMetric: _totalMetric, ...bucket }) => bucket)
      };
    })
    .filter((month) => month.buckets.some((bucket) => bucket.count > 0) || month.monthKey === historyMonth);

  const selection = buildSelectionState(stage, historyStatus, historyMonth, selectionContextChips);

  const selectedTransactions = transactions
    .filter((transaction) => {
      if (stage) {
        return pipelineStatusFromDb[transaction.status] === stage;
      }

      if (historyStatus && historyMonth) {
        return pipelineStatusFromDb[transaction.status] === historyStatus && getMonthlyRollupKey(transaction) === historyMonth;
      }

      return true;
    })
    .sort((left, right) => {
      if (historyStatus && historyMonth) {
        return getMonthlyRollupDate(right).getTime() - getMonthlyRollupDate(left).getTime();
      }

      return right.updatedAt.getTime() - left.updatedAt.getTime();
    });

  const totalMetric = selectedTransactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);
  const allTransactionsMetric = transactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);

  return {
    filters: {
      search: input.search?.trim() ?? "",
      representing,
      ownerMembershipId: input.ownerMembershipId?.trim() ?? "",
      metricMode,
      metricOptions,
      ownerOptions,
      stage,
      historyStatus,
      historyMonth
    },
    metricModeLabel: metricModeLabels[metricMode],
    metricModeDescription: buildMetricModeDescription(metricMode),
    selection,
    workspaceSummary: {
      filteredTransactions: {
        count: transactions.length,
        metricLabel: formatCurrency(allTransactionsMetric),
        note: "All statuses inside the current search, side, owner, and office scope."
      },
      livePipeline: {
        count: livePipelineCount,
        metricLabel: formatCurrency(livePipelineMetric),
        note: "Opportunity, Active, and Pending records only."
      },
      recentHistory: {
        count: recentHistoryTransactions.length,
        metricLabel: formatCurrency(recentHistoryMetric),
        note: `Closed and Cancelled rollups across the last ${pipelineHistoryWindowMonths} months.`
      },
      selectedView: {
        count: selectedTransactions.length,
        metricLabel: formatCurrency(totalMetric),
        note:
          selection.kind === "all"
            ? "The current working list before any stage or month drilldown."
            : "The currently selected stage or monthly history bucket."
      }
    },
    funnelBuckets,
    historyMonths,
    listSummary: {
      totalCount: selectedTransactions.length,
      metricLabel: formatCurrency(totalMetric)
    },
    rows: selectedTransactions.map((transaction) => mapPipelineRow(transaction, metricMode))
  };
}
