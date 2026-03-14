import { Prisma, TransactionRepresenting, TransactionStatus, TransactionType, UserRole } from "@prisma/client";
import { activityLogActions, recordActivityLogEvent } from "./activity-log";
import { prisma } from "./client";
import { listAvailableContactsForTransaction, type OfficeTransactionContact, type OfficeTransactionContactOption } from "./transaction-contacts";
import {
  listTransactionDocumentsSnapshot,
  type OfficeFormTemplateOption,
  type OfficeIncomingUpdate,
  type OfficeTransactionDocument,
  type OfficeTransactionForm
} from "./transaction-documents";

export type OfficeTransactionStatus = "Opportunity" | "Active" | "Pending" | "Closed" | "Cancelled";

export type OfficeTransactionRecord = {
  id: string;
  address: string;
  importantDate: string;
  price: string;
  owner: string;
  representing: string;
  status: OfficeTransactionStatus;
  volume: number;
  isFlagged?: boolean;
};

export type OfficeTransactionSummary = {
  totalCount: number;
  totalNetIncome: string;
};

export type OfficeTransactionSelectOption = {
  id: string;
  label: string;
};

export type OfficeTransactionFilterOptions = {
  ownerOptions: OfficeTransactionSelectOption[];
  teamOptions: OfficeTransactionSelectOption[];
};

export type OfficeTransactionListResult = {
  transactions: OfficeTransactionRecord[];
  summary: OfficeTransactionSummary;
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filterOptions: OfficeTransactionFilterOptions;
};

export type OfficeTransactionDetail = {
  id: string;
  organizationId: string;
  officeId: string | null;
  ownerMembershipId: string | null;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  type: string;
  status: OfficeTransactionStatus;
  representing: string;
  importantDate: string;
  buyerAgreementDate: string;
  buyerExpirationDate: string;
  acceptanceDate: string;
  listingDate: string;
  listingExpirationDate: string;
  closingDate: string;
  companyReferral: "Yes" | "No";
  companyReferralEmployeeName: string;
  ownerName: string;
  ownerEmail: string;
  officeName: string;
  grossCommission: string;
  referralFee: string;
  officeNet: string;
  agentNet: string;
  financeNotes: string;
  additionalFields: Record<string, string>;
  contacts: OfficeTransactionContact[];
  availableContacts: OfficeTransactionContactOption[];
  documents: OfficeTransactionDocument[];
  forms: OfficeTransactionForm[];
  incomingUpdates: OfficeIncomingUpdate[];
  formTemplates: OfficeFormTemplateOption[];
  createdAt: string;
  updatedAt: string;
};

export type ListTransactionsInput = {
  organizationId: string;
  officeId?: string | null;
  search?: string;
  status?: OfficeTransactionStatus | "All";
  ownerMembershipId?: string;
  teamId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export type CreateTransactionInput = {
  organizationId: string;
  officeId?: string | null;
  ownerMembershipId: string;
  actorMembershipId?: string;
  transactionType: string;
  transactionStatus: string;
  representing: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  transactionName: string;
  price: string;
  buyerAgreementDate?: string;
  buyerExpirationDate?: string;
  acceptanceDate?: string;
  listingDate?: string;
  listingExpirationDate?: string;
  closingDate?: string;
  grossCommission?: string;
  referralFee?: string;
  officeNet?: string;
  agentNet?: string;
  financeNotes?: string;
  additionalFields?: Record<string, string>;
};

export type UpdateTransactionStatusInput = {
  organizationId: string;
  transactionId: string;
  status: OfficeTransactionStatus;
  actorMembershipId?: string;
};

export type UpdateTransactionFinanceInput = {
  organizationId: string;
  transactionId: string;
  grossCommission?: string;
  referralFee?: string;
  officeNet?: string;
  agentNet?: string;
  financeNotes?: string;
  actorMembershipId?: string;
};

const transactionStatusLabelMap: Record<TransactionStatus, OfficeTransactionStatus> = {
  opportunity: "Opportunity",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  cancelled: "Cancelled"
};

const transactionStatusDbMap: Record<OfficeTransactionStatus, TransactionStatus> = {
  Opportunity: "opportunity",
  Active: "active",
  Pending: "pending",
  Closed: "closed",
  Cancelled: "cancelled"
};

const transactionTypeDbMap: Record<string, TransactionType> = {
  Sales: "sales",
  "Sales (listing)": "sales_listing",
  "Rental/Leasing": "rental_leasing",
  "Rental (listing)": "rental_listing",
  "Commercial Sales": "commercial_sales",
  "Commercial Lease": "commercial_lease",
  Other: "other"
};

const transactionTypeLabelMap: Record<TransactionType, string> = {
  sales: "Sales",
  sales_listing: "Sales (listing)",
  rental_leasing: "Rental/Leasing",
  rental_listing: "Rental (listing)",
  commercial_sales: "Commercial Sales",
  commercial_lease: "Commercial Lease",
  other: "Other"
};

const representingDbMap: Record<string, TransactionRepresenting> = {
  Buyer: "buyer",
  Seller: "seller",
  Both: "both",
  Tenant: "tenant",
  Landlord: "landlord"
};

const representingLabelMap: Record<TransactionRepresenting, string> = {
  buyer: "buyer",
  seller: "seller",
  both: "both",
  tenant: "tenant",
  landlord: "landlord"
};

const defaultTransactionsPage = 1;
const defaultTransactionsPageSize = 20;
const maxTransactionsPageSize = 100;

function formatCurrency(value: Prisma.Decimal | number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
  }).format(numericValue);
}

function formatImportantDate(date: Date | null) {
  if (!date) {
    return "";
  }

  return `expires: ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

function formatDateValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function parseOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const parsed = trimmed ? new Date(trimmed) : null;

  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function startOfDay(value: string | undefined) {
  const parsed = parseOptionalDate(value);

  if (!parsed) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function endOfDay(value: string | undefined) {
  const parsed = parseOptionalDate(value);

  if (!parsed) {
    return null;
  }

  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

function parseOptionalDecimal(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replaceAll(",", "").replace(/\$/g, "").trim();

  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? new Prisma.Decimal(numeric) : null;
}

function parseOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseCreateFinanceDecimal(explicitValue: string | undefined, fallbackValue: string | undefined) {
  return parseOptionalDecimal(explicitValue) ?? parseOptionalDecimal(fallbackValue);
}

function formatAuditCurrencyValue(value: Prisma.Decimal | null) {
  return value ? formatCurrency(value) : "—";
}

function formatAuditTextValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function buildAuditDetail(label: string, previousValue: string, nextValue: string) {
  if (previousValue === nextValue) {
    return null;
  }

  return `${label}: ${previousValue} -> ${nextValue}`;
}

function buildAuditChange(label: string, previousValue: string, nextValue: string) {
  if (previousValue === nextValue) {
    return null;
  }

  return {
    label,
    previousValue,
    nextValue
  };
}

function buildTransactionObjectLabel(transaction: {
  title: string;
  address: string;
  city: string;
  state: string;
}) {
  return `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`;
}

function getSearchMatchingTransactionStatuses(query: string) {
  const normalizedQuery = query.toLowerCase();

  return Object.entries(transactionStatusLabelMap)
    .filter(([, label]) => label.toLowerCase().includes(normalizedQuery))
    .map(([status]) => status as TransactionStatus);
}

function getSearchMatchingRepresentingValues(query: string) {
  const normalizedQuery = query.toLowerCase();

  return Object.entries(representingLabelMap)
    .filter(([, label]) => label.toLowerCase().includes(normalizedQuery))
    .map(([representing]) => representing as TransactionRepresenting);
}

function parseTransactionTypeFilter(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  return Object.values(transactionTypeDbMap).includes(value.trim() as TransactionType) ? (value.trim() as TransactionType) : null;
}

function mapTransactionRecord(
  transaction: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price: Prisma.Decimal | null;
    importantDate: Date | null;
    status: TransactionStatus;
    representing: TransactionRepresenting;
    ownerMembership: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  }
): OfficeTransactionRecord {
  return {
    id: transaction.id,
    address: `${transaction.address}, ${transaction.city}, ${transaction.state} ${transaction.zipCode}`.replace(/,\s+,/g, ", "),
    importantDate: formatImportantDate(transaction.importantDate),
    price: formatCurrency(transaction.price),
    owner: transaction.ownerMembership
      ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
      : "Unassigned",
    representing: representingLabelMap[transaction.representing],
    status: transactionStatusLabelMap[transaction.status],
    volume: Number(transaction.price ?? 0),
    isFlagged: Boolean(transaction.importantDate)
  };
}

function mapTransactionDetail(
  transaction: {
    id: string;
    organizationId: string;
    officeId: string | null;
    ownerMembershipId: string | null;
    title: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price: Prisma.Decimal | null;
    type: TransactionType;
    status: TransactionStatus;
    representing: TransactionRepresenting;
    importantDate: Date | null;
    buyerAgreementDate: Date | null;
    buyerExpirationDate: Date | null;
    acceptanceDate: Date | null;
    listingDate: Date | null;
    listingExpirationDate: Date | null;
    closingDate: Date | null;
    companyReferral: boolean;
    companyReferralEmployeeName: string | null;
    grossCommission: Prisma.Decimal | null;
    referralFee: Prisma.Decimal | null;
    officeNet: Prisma.Decimal | null;
    agentNet: Prisma.Decimal | null;
    financeNotes: string | null;
    additionalFields: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    office: {
      name: string;
    } | null;
    ownerMembership: {
      user: {
        email: string;
        firstName: string;
        lastName: string;
      };
    } | null;
    transactionContacts?: OfficeTransactionContact[];
    availableContacts?: OfficeTransactionContactOption[];
    documents?: OfficeTransactionDocument[];
    forms?: OfficeTransactionForm[];
    incomingUpdates?: OfficeIncomingUpdate[];
    formTemplates?: OfficeFormTemplateOption[];
  }
): OfficeTransactionDetail {
  const ownerName = transaction.ownerMembership
    ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
    : "Unassigned";

  return {
    id: transaction.id,
    organizationId: transaction.organizationId,
    officeId: transaction.officeId,
    ownerMembershipId: transaction.ownerMembershipId,
    title: transaction.title,
    address: transaction.address,
    city: transaction.city,
    state: transaction.state,
    zipCode: transaction.zipCode,
    price: transaction.price ? String(transaction.price) : "",
    type: transactionTypeLabelMap[transaction.type],
    status: transactionStatusLabelMap[transaction.status],
    representing: representingLabelMap[transaction.representing],
    importantDate: formatDateValue(transaction.importantDate),
    buyerAgreementDate: formatDateValue(transaction.buyerAgreementDate),
    buyerExpirationDate: formatDateValue(transaction.buyerExpirationDate),
    acceptanceDate: formatDateValue(transaction.acceptanceDate),
    listingDate: formatDateValue(transaction.listingDate),
    listingExpirationDate: formatDateValue(transaction.listingExpirationDate),
    closingDate: formatDateValue(transaction.closingDate),
    companyReferral: transaction.companyReferral ? "Yes" : "No",
    companyReferralEmployeeName: transaction.companyReferralEmployeeName ?? "",
    ownerName,
    ownerEmail: transaction.ownerMembership?.user.email ?? "",
    officeName: transaction.office?.name ?? "",
    grossCommission: transaction.grossCommission ? String(transaction.grossCommission) : "",
    referralFee: transaction.referralFee ? String(transaction.referralFee) : "",
    officeNet: transaction.officeNet ? String(transaction.officeNet) : "",
    agentNet: transaction.agentNet ? String(transaction.agentNet) : "",
    financeNotes: transaction.financeNotes ?? "",
    additionalFields:
      transaction.additionalFields && typeof transaction.additionalFields === "object" && !Array.isArray(transaction.additionalFields)
        ? Object.fromEntries(
            Object.entries(transaction.additionalFields as Record<string, Prisma.JsonValue>).map(([key, value]) => [key, String(value ?? "")])
          )
        : {},
    contacts: transaction.transactionContacts ?? [],
    availableContacts: transaction.availableContacts ?? [],
    documents: transaction.documents ?? [],
    forms: transaction.forms ?? [],
    incomingUpdates: transaction.incomingUpdates ?? [],
    formTemplates: transaction.formTemplates ?? [],
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString()
  };
}

export async function listTransactions(input: ListTransactionsInput): Promise<OfficeTransactionListResult> {
  const whereConditions: Prisma.TransactionWhereInput[] = [
    {
      organizationId: input.organizationId
    }
  ];
  const requestedPage = Number.isFinite(input.page) ? Number(input.page) : defaultTransactionsPage;
  const requestedPageSize = Number.isFinite(input.pageSize) ? Number(input.pageSize) : defaultTransactionsPageSize;
  const pageSize = Math.min(Math.max(Math.trunc(requestedPageSize) || defaultTransactionsPageSize, 1), maxTransactionsPageSize);
  const transactionType = parseTransactionTypeFilter(input.type);
  const startDate = startOfDay(input.startDate);
  const endDate = endOfDay(input.endDate);

  if (input.officeId) {
    whereConditions.push({
      officeId: input.officeId
    });
  }

  if (input.status && input.status !== "All") {
    whereConditions.push({
      status: transactionStatusDbMap[input.status]
    });
  }

  if (input.ownerMembershipId?.trim()) {
    whereConditions.push({
      ownerMembershipId: input.ownerMembershipId.trim()
    });
  }

  if (input.teamId?.trim()) {
    whereConditions.push({
      ownerMembership: {
        is: {
          teamMemberships: {
            some: {
              organizationId: input.organizationId,
              teamId: input.teamId.trim(),
              ...(input.officeId ? { OR: [{ officeId: input.officeId }, { officeId: null }] } : {}),
              team: {
                isActive: true
              }
            }
          }
        }
      }
    });
  }

  if (transactionType) {
    whereConditions.push({
      type: transactionType
    });
  }

  if (startDate || endDate) {
    whereConditions.push({
      createdAt: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {})
      }
    });
  }

  if (input.search?.trim()) {
    const query = input.search.trim();
    const matchingStatuses = getSearchMatchingTransactionStatuses(query);
    const matchingRepresentingValues = getSearchMatchingRepresentingValues(query);

    whereConditions.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { zipCode: { contains: query, mode: "insensitive" } },
        {
          ownerMembership: {
            user: {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } }
              ]
            }
          }
        },
        {
          transactionContacts: {
            some: {
              client: {
                OR: [
                  { fullName: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                  { phone: { contains: query, mode: "insensitive" } }
                ]
              }
            }
          }
        },
        ...(matchingStatuses.length > 0 ? [{ status: { in: matchingStatuses } }] : []),
        ...(matchingRepresentingValues.length > 0 ? [{ representing: { in: matchingRepresentingValues } }] : [])
      ]
    });
  }

  const where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };

  const totalCount = await prisma.transaction.count({
    where
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(Math.trunc(requestedPage) || defaultTransactionsPage, 1), totalPages);
  const [transactions, financeAggregate, ownerMemberships, teams] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        ownerMembership: {
          include: {
            user: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.transaction.aggregate({
      where,
      _sum: {
        officeNet: true
      }
    }),
    prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        status: "active",
        ...(input.officeId ? { officeId: input.officeId } : {}),
        role: {
          in: ["agent", "office_manager", "office_admin"] satisfies UserRole[]
        }
      },
      include: {
        user: true
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }]
    }),
    prisma.team.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.officeId ? { OR: [{ officeId: input.officeId }, { officeId: null }] } : {})
      },
      select: {
        id: true,
        name: true
      },
      orderBy: [{ name: "asc" }]
    })
  ]);

  return {
    transactions: transactions.map(mapTransactionRecord),
    summary: {
      totalCount,
      totalNetIncome: formatCurrency(financeAggregate._sum.officeNet)
    },
    totalCount,
    totalPages,
    page,
    pageSize,
    filterOptions: {
      ownerOptions: ownerMemberships.map((membership) => ({
        id: membership.id,
        label: `${membership.user.firstName} ${membership.user.lastName}`
      })),
      teamOptions: teams.map((team) => ({
        id: team.id,
        label: team.name
      }))
    }
  };
}

export const officeTransactionsPageDefaults = {
  page: defaultTransactionsPage,
  pageSize: defaultTransactionsPageSize
} as const;

export const officeTransactionsPageLimits = {
  maxPageSize: maxTransactionsPageSize
} as const;

export async function getTransactionById(organizationId: string, transactionId: string): Promise<OfficeTransactionDetail | null> {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      organizationId
    },
    include: {
      office: true,
      ownerMembership: {
        include: {
          user: true
        }
      },
      transactionContacts: {
        where: {
          organizationId
        },
        include: {
          client: {
            select: {
              fullName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!transaction) {
    return null;
  }

  const [availableContacts, documentsSnapshot] = await Promise.all([
    listAvailableContactsForTransaction(organizationId, transactionId),
    listTransactionDocumentsSnapshot(organizationId, transactionId)
  ]);

  return mapTransactionDetail({
    ...transaction,
    transactionContacts: transaction.transactionContacts.map((transactionContact) => ({
      id: transactionContact.id,
      transactionId: transactionContact.transactionId,
      clientId: transactionContact.clientId,
      fullName: transactionContact.client.fullName,
      email: transactionContact.client.email ?? "",
      phone: transactionContact.client.phone ?? "",
      role: transactionContact.role
        .split("_")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("-"),
      isPrimary: transactionContact.isPrimary,
      notes: transactionContact.notes ?? ""
    })),
    availableContacts,
    documents: documentsSnapshot.documents,
    forms: documentsSnapshot.forms,
    incomingUpdates: documentsSnapshot.incomingUpdates,
    formTemplates: documentsSnapshot.formTemplates
  });
}

export async function createTransaction(input: CreateTransactionInput): Promise<OfficeTransactionDetail> {
  const additionalFields = { ...(input.additionalFields ?? {}) };

  const companyReferralValue = (additionalFields.companyReferral ?? "").toString().toLowerCase();
  const companyReferral = companyReferralValue === "yes";
  const companyReferralEmployeeName = (additionalFields.companyReferralEmployeesName ?? additionalFields.companyReferralEmployeeName ?? "").trim();
  const grossCommission = parseCreateFinanceDecimal(input.grossCommission, additionalFields.commissionAmount);
  const referralFee = parseCreateFinanceDecimal(input.referralFee, additionalFields.referralFee);
  const officeNet = parseCreateFinanceDecimal(input.officeNet, additionalFields.officeNet);
  const agentNet = parseCreateFinanceDecimal(input.agentNet, additionalFields.agentNet);
  const financeNotes = parseOptionalText(input.financeNotes) ?? parseOptionalText(additionalFields.note);

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        organizationId: input.organizationId,
        officeId: input.officeId ?? null,
        ownerMembershipId: input.ownerMembershipId,
        type: transactionTypeDbMap[input.transactionType] ?? "other",
        status: transactionStatusDbMap[(input.transactionStatus as OfficeTransactionStatus) || "Opportunity"] ?? "opportunity",
        representing: representingDbMap[input.representing] ?? "buyer",
        title: input.transactionName.trim() || input.address.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        state: input.state.trim(),
        zipCode: input.zipCode.trim(),
        price: parseOptionalDecimal(input.price),
        importantDate: parseOptionalDate(input.buyerExpirationDate) ?? parseOptionalDate(input.closingDate),
        buyerAgreementDate: parseOptionalDate(input.buyerAgreementDate),
        buyerExpirationDate: parseOptionalDate(input.buyerExpirationDate),
        acceptanceDate: parseOptionalDate(input.acceptanceDate),
        listingDate: parseOptionalDate(input.listingDate),
        listingExpirationDate: parseOptionalDate(input.listingExpirationDate),
        closingDate: parseOptionalDate(input.closingDate),
        companyReferral,
        companyReferralEmployeeName: companyReferralEmployeeName || null,
        grossCommission,
        referralFee,
        officeNet,
        agentNet,
        financeNotes,
        referralContext: companyReferral
          ? {
              companyReferralEmployeeName
            }
          : Prisma.JsonNull,
        commissionContext: Prisma.JsonNull,
        additionalFields
      },
      include: {
        office: true,
        ownerMembership: {
          include: {
            user: true
          }
        }
      }
    });

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId ?? input.ownerMembershipId,
      entityType: "transaction",
      entityId: created.id,
      action: activityLogActions.transactionCreated,
      payload: {
        officeId: created.officeId,
        transactionId: created.id,
        transactionLabel: buildTransactionObjectLabel(created),
        objectLabel: buildTransactionObjectLabel(created),
        details: [
          `Status: ${transactionStatusLabelMap[created.status]}`,
          `Representing: ${representingLabelMap[created.representing]}`,
          `Owner: ${created.ownerMembership ? `${created.ownerMembership.user.firstName} ${created.ownerMembership.user.lastName}` : "Unassigned"}`
        ]
      }
    });

    return created;
  });

  return mapTransactionDetail({
    ...transaction,
    transactionContacts: [],
    availableContacts: []
  });
}

export async function updateTransactionStatus(input: UpdateTransactionStatusInput): Promise<OfficeTransactionDetail | null> {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      organizationId: input.organizationId
    },
    select: {
      id: true,
      officeId: true,
      title: true,
      address: true,
      city: true,
      state: true,
      status: true
    }
  });

  if (!transaction) {
    return null;
  }

  const nextStatus = transactionStatusDbMap[input.status];
  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.transaction.update({
      where: {
        id: input.transactionId
      },
      data: {
        status: nextStatus,
        importantDate: input.status === "Closed" || input.status === "Cancelled" ? null : undefined
      },
      include: {
        office: true,
        ownerMembership: {
          include: {
            user: true
          }
        }
      }
    });

    if (transaction.status !== nextStatus) {
      const statusChange = buildAuditChange("Status", transactionStatusLabelMap[transaction.status], transactionStatusLabelMap[saved.status]);
      await recordActivityLogEvent(tx, {
        organizationId: input.organizationId,
        membershipId: input.actorMembershipId ?? null,
        entityType: "transaction",
        entityId: saved.id,
        action:
          nextStatus === "closed"
            ? activityLogActions.transactionClosed
            : nextStatus === "cancelled"
              ? activityLogActions.transactionCancelled
              : activityLogActions.transactionStatusChanged,
        payload: {
          officeId: saved.officeId,
          transactionId: saved.id,
          transactionLabel: buildTransactionObjectLabel(saved),
          objectLabel: buildTransactionObjectLabel(saved),
          changes: statusChange ? [statusChange] : [],
          details: [
            ...(nextStatus === "closed" ? ["Marked closed"] : []),
            ...(nextStatus === "cancelled" ? ["Marked cancelled"] : [])
          ]
        }
      });
    }

    return saved;
  });

  return mapTransactionDetail({
    ...updated,
    transactionContacts: [],
    availableContacts: []
  });
}

export async function updateTransactionFinance(input: UpdateTransactionFinanceInput): Promise<OfficeTransactionDetail | null> {
  const existing = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      organizationId: input.organizationId
    },
    select: {
      id: true,
      officeId: true,
      title: true,
      address: true,
      city: true,
      state: true,
      grossCommission: true,
      referralFee: true,
      officeNet: true,
      agentNet: true,
      financeNotes: true
    }
  });

  if (!existing) {
    return null;
  }

  const nextGrossCommission = parseOptionalDecimal(input.grossCommission);
  const nextReferralFee = parseOptionalDecimal(input.referralFee);
  const nextOfficeNet = parseOptionalDecimal(input.officeNet);
  const nextAgentNet = parseOptionalDecimal(input.agentNet);
  const nextFinanceNotes = parseOptionalText(input.financeNotes);

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: {
        id: input.transactionId
      },
      data: {
        grossCommission: nextGrossCommission,
        referralFee: nextReferralFee,
        officeNet: nextOfficeNet,
        agentNet: nextAgentNet,
        financeNotes: nextFinanceNotes
      }
    });

    const details = [
      buildAuditDetail("Gross commission", formatAuditCurrencyValue(existing.grossCommission), formatAuditCurrencyValue(nextGrossCommission)),
      buildAuditDetail("Referral fee", formatAuditCurrencyValue(existing.referralFee), formatAuditCurrencyValue(nextReferralFee)),
      buildAuditDetail("Office net", formatAuditCurrencyValue(existing.officeNet), formatAuditCurrencyValue(nextOfficeNet)),
      buildAuditDetail("Agent net", formatAuditCurrencyValue(existing.agentNet), formatAuditCurrencyValue(nextAgentNet)),
      buildAuditDetail("Finance notes", formatAuditTextValue(existing.financeNotes), formatAuditTextValue(nextFinanceNotes))
    ].filter((detail): detail is string => Boolean(detail));
    const changes = [
      buildAuditChange("Gross commission", formatAuditCurrencyValue(existing.grossCommission), formatAuditCurrencyValue(nextGrossCommission)),
      buildAuditChange("Referral fee", formatAuditCurrencyValue(existing.referralFee), formatAuditCurrencyValue(nextReferralFee)),
      buildAuditChange("Office net", formatAuditCurrencyValue(existing.officeNet), formatAuditCurrencyValue(nextOfficeNet)),
      buildAuditChange("Agent net", formatAuditCurrencyValue(existing.agentNet), formatAuditCurrencyValue(nextAgentNet)),
      buildAuditChange("Finance notes", formatAuditTextValue(existing.financeNotes), formatAuditTextValue(nextFinanceNotes))
    ].filter((change): change is NonNullable<typeof change> => Boolean(change));

    if (details.length > 0) {
      await recordActivityLogEvent(tx, {
        organizationId: input.organizationId,
        membershipId: input.actorMembershipId ?? null,
        entityType: "transaction",
        entityId: input.transactionId,
        action: activityLogActions.transactionFinanceUpdated,
        payload: {
          officeId: existing.officeId,
          transactionId: input.transactionId,
          transactionLabel: buildTransactionObjectLabel(existing),
          objectLabel: buildTransactionObjectLabel(existing),
          changes,
          details
        }
      });
    }
  });

  return getTransactionById(input.organizationId, input.transactionId);
}
