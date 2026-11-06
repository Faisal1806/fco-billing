'use client';

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import {
  saveDocument,
  deleteDocument,
  getBusinessDocuments,
} from '@/lib/actions';
import { BUSINESS_YEAR, getDocumentDateYear, parseDocumentDate } from '@/lib/document-utils';

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

import { Separator } from '@/components/ui/separator';

import {
  Loader2,
  PlusCircle,
  Trash2,
  FilePenLine,
  FileText,
  Search,
  ShoppingBasket,
  Building2,
} from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { PartySelector } from '@/components/party-selector';
import PageHeader from '@/components/PageHeader';

/* =========================================================
   TYPES
========================================================= */

type PurchaseMode = 'customer' | 'supplier';

type PurchaseRow = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
  total?: number;
};

type Purchase = {
  id: string;
  documentType?: 'customer-purchase';
  billNo: string;
  date: string;
  growerName: string;
  purchaseFor: 'Customer' | 'Own Stock (F.Co)';
  entries: PurchaseRow[];
  totals: {
    totalQty: number;
    grandTotal: number;
  };
  purchaseType?: string;
  partyId?: string;
  partyName?: string;
  companyName?: string;
  items?: Array<{
    type: 'Patti' | 'Dabba';
    variety: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  totalQuantity?: number;
  grandTotal?: number;
  createdAt?: string;
  updatedAt?: string;
};

type SupplierPurchaseRow = {
  type: 'Patti' | 'Dabba';
  description: string;
  qty: number;
  rate: number;
  amount: number;
};

type SupplierPurchase = {
  id: string;
  documentType?: 'supplier-purchase';
  purchaseNo: string;
  date: string;
  supplierName: string;
  khata: string;
  entries: SupplierPurchaseRow[];
  totalPurchase: number;
  paid: number;
  balance: number;
  notes: string;
};

type RecentPurchase =
  | {
      mode: 'customer';
      data: Purchase;
    }
  | {
      mode: 'supplier';
      data: SupplierPurchase;
    };

/* =========================================================
   DEFAULT VALUES
========================================================= */

const emptyCustomerRow: PurchaseRow = {
  type: 'Patti',
  qty: 0,
  variety: '',
  rate: 0,
};

const createCustomerRows = (): PurchaseRow[] =>
  Array.from(
    { length: 3 },
    () => ({ ...emptyCustomerRow })
  );

const createSupplierRows = (): SupplierPurchaseRow[] => [
  {
    type: 'Patti',
    description: '',
    qty: 0,
    rate: 0,
    amount: 0,
  },
  {
    type: 'Patti',
    description: '',
    qty: 0,
    rate: 0,
    amount: 0,
  },
  {
    type: 'Patti',
    description: '',
    qty: 0,
    rate: 0,
    amount: 0,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatPurchaseAmount(value: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '₹0.00';
  }

  return `₹${Math.round(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function getYearFromDate(date: unknown): number | null {
  return getDocumentDateYear(date);
}

const toNumber = (
  value: unknown,
  fallback = 0
): number => {
  const n = Number(value);
  return Number.isFinite(n)
    ? n
    : fallback;
};

const normalizePurchaseDocument = (
  raw: any,
  fallbackKey?: string
): Purchase | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const value =
    raw?.value && typeof raw.value === 'object'
      ? raw.value
      : raw;

  const billNo = String(
    value?.billNo || ''
  ).trim();

  if (!billNo) {
    return null;
  }

  const itemsSource = Array.isArray(value?.items)
    ? value.items
    : Array.isArray(value?.entries)
      ? value.entries
      : [];

  const items = itemsSource.map((entry: any) => {
    const quantity = toNumber(
      entry?.quantity ?? entry?.qty,
      0
    );
    const rate = toNumber(entry?.rate, 0);
    const total = toNumber(
      entry?.total ?? entry?.amount ?? quantity * rate,
      0
    );

    return {
      type:
        entry?.type === 'Dabba'
          ? 'Dabba'
          : 'Patti',
      variety: String(
        entry?.variety || entry?.description || ''
      ),
      quantity,
      rate,
      total,
    };
  });

  const totalQuantity = toNumber(
    value?.totalQuantity ??
      value?.totals?.totalQty ??
      items.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0
      ),
    0
  );

  const grandTotal = toNumber(
    value?.grandTotal ??
      value?.totals?.grandTotal ??
      items.reduce(
        (sum: number, item: { total: number }) => sum + item.total,
        0
      ),
    0
  );

  const partyName = String(
    value?.partyName ||
      value?.growerName ||
      value?.customerName ||
      ''
  );

  const purchaseFor =
    value?.purchaseFor ||
    (partyName === 'F.Co (Own Stock)'
      ? 'Own Stock (F.Co)'
      : 'Customer');

  return {
    id:
      String(
        value?.id ||
          fallbackKey ||
          `purchase-${billNo}`
      ),
    documentType:
      value?.documentType ||
      'customer-purchase',
    billNo,
    date: String(value?.date || ''),
    growerName:
      partyName === 'F.Co (Own Stock)'
        ? 'F.Co (Own Stock)'
        : partyName,
    purchaseFor,
    entries: items.map((item: { type: 'Patti' | 'Dabba'; variety: string; quantity: number; rate: number; total: number }) => ({
      type: item.type,
      variety: item.variety,
      qty: item.quantity,
      rate: item.rate,
      total: item.total,
    })),
    totals: {
      totalQty: totalQuantity,
      grandTotal,
    },
    purchaseType:
      value?.purchaseType ||
      'Customer Purchase',
    partyId: String(value?.partyId || ''),
    partyName,
    companyName:
      String(
        value?.companyName ||
          'Firdous Ahmad & Company'
      ),
    items,
    totalQuantity,
    grandTotal,
    createdAt: value?.createdAt,
    updatedAt: value?.updatedAt,
  };
};

/* =========================================================
   PAGE
========================================================= */

export default function PurchasesPage() {
  const { toast } = useToast();
  const router = useRouter();

  const currentYear = BUSINESS_YEAR;

  /* =======================================================
     COMMON STATE
  ======================================================= */

  const [purchaseMode, setPurchaseMode] =
    useState<PurchaseMode>('customer');

  const [isEditing, setIsEditing] = useState(false);
  const [editingDocumentKey, setEditingDocumentKey] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [userRole, setUserRole] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] =
    useState('');

  const selectedYear = BUSINESS_YEAR;
  const availableYears = [BUSINESS_YEAR];

  /* =======================================================
     CUSTOMER PURCHASE STATE
  ======================================================= */

  const [billNo, setBillNo] =
    useState('');

  const [growerName, setGrowerName] =
    useState('');

  const [partyId, setPartyId] = useState('');

  const [date, setDate] =
    useState('');

  const [purchaseFor, setPurchaseFor] =
    useState<
      'Customer' | 'Own Stock (F.Co)'
    >('Customer');

  const [rows, setRows] =
    useState<PurchaseRow[]>(
      createCustomerRows()
    );

  const [savedPurchases, setSavedPurchases] =
    useState<Purchase[]>([]);

  /* =======================================================
     SUPPLIER PURCHASE STATE
  ======================================================= */

  const [
    supplierPurchaseNo,
    setSupplierPurchaseNo,
  ] = useState('');

  const [
    supplierDate,
    setSupplierDate,
  ] = useState('');

  const [
    supplierName,
    setSupplierName,
  ] = useState('');

  const [
    supplierKhata,
    setSupplierKhata,
  ] = useState('');

  const [
    supplierNotes,
    setSupplierNotes,
  ] = useState('');

  const [
    supplierPaid,
    setSupplierPaid,
  ] = useState(0);

  const [
    supplierRows,
    setSupplierRows,
  ] = useState<SupplierPurchaseRow[]>(
    createSupplierRows()
  );

  const [
    savedSupplierPurchases,
    setSavedSupplierPurchases,
  ] = useState<SupplierPurchase[]>([]);

  /* =======================================================
     USER ROLE
  ======================================================= */

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(
        localStorage.getItem('userRole')
      );
    }
  }, []);

  /* =======================================================
     LOAD CUSTOMER PURCHASES
  ======================================================= */
const fetchCustomerPurchases = useCallback(async () => {
  try {
    const result = await getBusinessDocuments('purchase-');

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || 'Failed to load customer purchases.');
    }

    const purchases: Purchase[] = result.data
      .map(item => normalizePurchaseDocument(item, item.key))
      .filter(
        (purchase): purchase is Purchase =>
          Boolean(
            purchase &&
              !String(purchase.id).startsWith(
                'supplier-purchase-'
              )
          )
      );

    purchases.sort(
      (a, b) =>
        (parseDocumentDate(b.date)?.getTime() ?? 0) -
        (parseDocumentDate(a.date)?.getTime() ?? 0)
    );

    setSavedPurchases(purchases);
  } catch (error) {
    console.error(
      'Failed to load customer purchases:',
      error
    );
    setSavedPurchases([]);
    toast({
      variant: 'destructive',
      title: 'Customer Purchases Failed',
      description: error instanceof Error ? error.message : 'Could not load customer purchases.',
    });
  }
}, [toast]);
  /* =======================================================
     LOAD SUPPLIER PURCHASES
  ======================================================= */

const fetchSupplierPurchases = useCallback(async () => {
  try {
    const result = await getBusinessDocuments('supplier-purchase-');

    if (
      !result.success ||
      !Array.isArray(result.data)
    ) {
      throw new Error(result.error || 'Failed to load supplier purchases.');
    }

    const purchases: SupplierPurchase[] =
      result.data
        .map(value => {
          return {
            ...value,

            id:
              value.id ||
              `supplier-purchase-${
                value?.purchaseNo || ''
              }`,

            documentType:
              value?.documentType ||
              'supplier-purchase',

            purchaseNo:
              value?.purchaseNo || '',

            date:
              value?.date || '',

            supplierName:
              value?.supplierName || '',

            khata:
              value?.khata || '',

            entries:
              Array.isArray(value.entries)
                ? value.entries
                : [],

            totalPurchase:
              Number(
                value?.totalPurchase || 0
              ),

            paid:
              Number(value?.paid || 0),

            balance:
              Number(value?.balance || 0),

            notes:
              value?.notes || '',
          } as SupplierPurchase;
        })
        .filter(Boolean);

    purchases.sort(
      (a, b) =>
        (parseDocumentDate(b.date)?.getTime() ?? 0) -
        (parseDocumentDate(a.date)?.getTime() ?? 0)
    );

    setSavedSupplierPurchases(purchases);
  } catch (error) {
    console.error(
      'Failed to load supplier purchases:',
      error
    );

    setSavedSupplierPurchases([]);
    toast({
      variant: 'destructive',
      title: 'Supplier Purchases Failed',
      description: error instanceof Error ? error.message : 'Could not load supplier purchases.',
    });
  }
}, [toast]);

  /* =======================================================
     LOAD EVERYTHING
  ======================================================= */

  const fetchAllPurchases =
    useCallback(async () => {
      setIsLoading(true);

      try {
        await Promise.all([
          fetchCustomerPurchases(),
          fetchSupplierPurchases(),
        ]);
      } finally {
        setIsLoading(false);
      }
    }, [
      fetchCustomerPurchases,
      fetchSupplierPurchases,
    ]);

  useEffect(() => {
    fetchAllPurchases();
  }, [fetchAllPurchases]);

  /* =======================================================
     AVAILABLE YEARS
  ======================================================= */

  /* =======================================================
     CUSTOMER TOTALS
  ======================================================= */

  const customerTotals = useMemo(() => {
    const totalQty = rows.reduce(
      (sum, row) =>
        sum + (Number(row.qty) || 0),
      0
    );

    const rowTotals = rows.map(
      (row) =>
        (Number(row.qty) || 0) *
        (Number(row.rate) || 0)
    );

    const grandTotal = rowTotals.reduce(
      (sum, value) =>
        sum + value,
      0
    );

    return {
      totalQty,
      rowTotals,
      grandTotal,
    };
  }, [rows]);

  /* =======================================================
     SUPPLIER TOTALS
  ======================================================= */

  const supplierTotals = useMemo(() => {
    const totalPurchase =
      supplierRows.reduce(
        (sum, row) =>
          sum +
          (Number(row.qty) || 0) *
            (Number(row.rate) || 0),
        0
      );

    const paid =
      Number(supplierPaid) || 0;

    const balance =
      totalPurchase - paid;

    return {
      totalPurchase,
      paid,
      balance,
    };
  }, [
    supplierRows,
    supplierPaid,
  ]);

  /* =======================================================
     CUSTOMER YEAR FILTER
  ======================================================= */

  const yearlyPurchases = useMemo(() => {
    return savedPurchases.filter(
      (purchase) =>
        getYearFromDate(
          purchase.date
        ) === selectedYear
    );
  }, [
    savedPurchases,
    selectedYear,
  ]);

  /* =======================================================
     SUPPLIER YEAR FILTER
  ======================================================= */

  const yearlySupplierPurchases =
    useMemo(() => {
      return savedSupplierPurchases.filter(
        (purchase) =>
          getYearFromDate(
            purchase.date
          ) === selectedYear
      );
    }, [
      savedSupplierPurchases,
      selectedYear,
    ]);

  /* =======================================================
     SEARCH CUSTOMER
  ======================================================= */

  const filteredCustomerPurchases =
    useMemo(() => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

      return yearlyPurchases.filter(
        (purchase) => {
          if (!search) return true;

          return (
            normalize(purchase.billNo).includes(search) ||
            normalize(purchase.growerName).includes(search)
          );
        }
      );
    }, [
      yearlyPurchases,
      searchTerm,
    ]);

  /* =======================================================
     SEARCH SUPPLIER
  ======================================================= */

  const filteredSupplierPurchases =
    useMemo(() => {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

      return yearlySupplierPurchases.filter(
        (purchase) => {
          if (!search) return true;

          return (
            normalize(purchase.purchaseNo).includes(search) ||
            normalize(purchase.supplierName).includes(search) ||
            normalize(purchase.khata).includes(search)
          );
        }
      );
    }, [
      yearlySupplierPurchases,
      searchTerm,
    ]);

  /* =======================================================
     YEARLY CUSTOMER QUANTITY
  ======================================================= */

  const yearlyCustomerQty =
    useMemo(() => {
      return yearlyPurchases.reduce(
        (total, purchase) =>
          total +
          Number(
            purchase.totals?.totalQty || 0
          ),
        0
      );
    }, [yearlyPurchases]);

  /* =======================================================
     YEARLY SUPPLIER TOTAL
  ======================================================= */

  const yearlySupplierTotal =
    useMemo(() => {
      return yearlySupplierPurchases.reduce(
        (total, purchase) =>
          total +
          Number(
            purchase.totalPurchase || 0
          ),
        0
      );
    }, [
      yearlySupplierPurchases,
    ]);

  /* =======================================================
     UPDATE CUSTOMER ROW
  ======================================================= */

  const updateCustomerRow = (
    index: number,
    patch: Partial<PurchaseRow>
  ) => {
    setRows((previous) => {
      const copy = [...previous];

      copy[index] = {
        ...copy[index],
        ...patch,
      };

      return copy;
    });
  };

  /* =======================================================
     ADD CUSTOMER ROW
  ======================================================= */

  const addCustomerRow = () => {
    setRows((previous) => [
      ...previous,
      {
        ...emptyCustomerRow,
      },
    ]);
  };

  /* =======================================================
     REMOVE CUSTOMER ROW
  ======================================================= */

  const removeCustomerRow = (
    index: number
  ) => {
    setRows((previous) =>
      previous.length > 1
        ? previous.filter(
            (_, i) => i !== index
          )
        : previous
    );
  };

  /* =======================================================
     UPDATE SUPPLIER ROW
  ======================================================= */

  const updateSupplierRow = (
    index: number,
    patch: Partial<SupplierPurchaseRow>
  ) => {
    setSupplierRows((previous) => {
      const copy = [...previous];

      const updated = {
        ...copy[index],
        ...patch,
      };

      updated.amount =
        (Number(updated.qty) || 0) *
        (Number(updated.rate) || 0);

      copy[index] = updated;

      return copy;
    });
  };

  /* =======================================================
     ADD SUPPLIER ROW
  ======================================================= */

  const addSupplierRow = () => {
    setSupplierRows((previous) => [
      ...previous,
      {
        type: 'Patti',
        description: '',
        qty: 0,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  /* =======================================================
     REMOVE SUPPLIER ROW
  ======================================================= */

  const removeSupplierRow = (
    index: number
  ) => {
    setSupplierRows((previous) =>
      previous.length > 1
        ? previous.filter(
            (_, i) => i !== index
          )
        : previous
    );
  };

  /* =======================================================
     RESET FORM
  ======================================================= */

  const resetForm = () => {
    setBillNo('');
    setGrowerName('');
    setPartyId('');
    setDate('');
    setPurchaseFor('Customer');

    setRows(
      createCustomerRows()
    );

    setSupplierPurchaseNo('');
    setSupplierDate('');
    setSupplierName('');
    setSupplierKhata('');
    setSupplierNotes('');
    setSupplierPaid(0);

    setSupplierRows(
      createSupplierRows()
    );

    setIsEditing(false);
    setEditingDocumentKey(null);
  };

  /* =======================================================
     SAVE CUSTOMER PURCHASE
  ======================================================= */

  const saveCustomerPurchase =
    async () => {
      if (
        !billNo.trim() ||
        !date ||
        (
          purchaseFor ===
            'Customer' &&
          !growerName.trim()
        )
      ) {
        toast({
          variant: 'destructive',
          title: 'Missing Details',
          description:
            'Please fill Bill No, Date and Customer Name.',
        });

        return;
      }

      setIsSubmitting(true);

      const documentKey =
        `purchase-${billNo.trim()}`;

      const finalGrowerName =
        purchaseFor ===
        'Own Stock (F.Co)'
          ? 'F.Co (Own Stock)'
          : growerName.trim();

      const items = rows
        .filter(
          (row) =>
            Number(row.qty) > 0 &&
            Number(row.rate) > 0
        )
        .map((row) => ({
          type: row.type,
          variety: String(row.variety || ''),
          quantity: Number(row.qty) || 0,
          rate: Number(row.rate) || 0,
          total: Math.round(
            (Number(row.qty) || 0) * (Number(row.rate) || 0)
          ),
        }));

      const purchaseData = {
        id: documentKey,
        billNo: billNo.trim(),
        date,
        purchaseType: 'Customer Purchase',
        purchaseFor,
        partyId: purchaseFor === 'Customer' ? partyId : '',
        partyName: finalGrowerName,
        growerName: finalGrowerName,
        companyName: 'Firdous Ahmad & Company',
        items,
        totalQuantity: Number(customerTotals.totalQty) || 0,
        grandTotal: Math.round(Number(customerTotals.grandTotal) || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const result =
          await saveDocument(
            documentKey,
            purchaseData
          );

        if (!result.success) {
          throw new Error(
            result.error ||
              'MongoDB save failed'
          );
        }

        toast({
          title: isEditing
            ? 'Purchase Updated'
            : 'Purchase Saved',

          description:
            `Customer purchase #${billNo} has been saved locally and synced when MongoDB is available.`,
        });

        await fetchAllPurchases();

        setIsEditing(true);
        setEditingDocumentKey(
          documentKey
        );
      } catch (error) {
        console.error(
          'Customer purchase save failed:',
          error
        );

        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description:
            'Customer purchase could not be saved to MongoDB.',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

  /* =======================================================
     SAVE SUPPLIER PURCHASE
  ======================================================= */

  const saveSupplierPurchase =
    async () => {
      if (
        !supplierPurchaseNo.trim() ||
        !supplierDate ||
        !supplierName.trim()
      ) {
        toast({
          variant: 'destructive',
          title: 'Missing Details',
          description:
            'Please fill Purchase No, Date and Supplier Name.',
        });

        return;
      }

      setIsSubmitting(true);

      const documentKey =
        `supplier-purchase-${supplierPurchaseNo.trim()}`;

      const entries =
        supplierRows
          .filter(
            (row) =>
              Number(row.qty) > 0 ||
              Number(row.rate) > 0 ||
              row.description.trim()
          )
          .map((row) => ({
            ...row,
            qty:
              Number(row.qty) || 0,
            rate:
              Number(row.rate) || 0,
            amount:
              Math.round((Number(row.qty) || 0) * (Number(row.rate) || 0)),
          }));

      const totalPurchase =
        Math.round(entries.reduce(
          (sum, row) =>
            sum +
            Number(row.amount || 0),
          0
        ));

      const paid = Math.round(Number(supplierPaid) || 0);

      const balance =
        totalPurchase - paid;

      const supplierData:
        SupplierPurchase = {
        id: documentKey,

        documentType:
          'supplier-purchase',

        purchaseNo:
          supplierPurchaseNo.trim(),

        date: supplierDate,

        supplierName:
          supplierName.trim(),

        khata:
          supplierKhata.trim(),

        entries,

        totalPurchase,

        paid,

        balance,

        notes:
          supplierNotes.trim(),
      };

      try {
        const result =
          await saveDocument(
            documentKey,
            supplierData
          );

        if (!result.success) {
          throw new Error(
            result.error ||
              'MongoDB save failed'
          );
        }

        if (
          typeof window !==
          'undefined'
        ) {
          localStorage.setItem(
            documentKey,
            JSON.stringify(
              supplierData
            )
          );
        }

        toast({
          title: isEditing
            ? 'Supplier Purchase Updated'
            : 'Supplier Purchase Saved',

          description:
            `Supplier purchase #${supplierPurchaseNo} has been saved locally and synced when MongoDB is available.`,
        });

        await fetchAllPurchases();

        setIsEditing(true);
        setEditingDocumentKey(
          documentKey
        );
      } catch (error) {
        console.error(
          'Supplier purchase save failed:',
          error
        );

        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description:
            'Supplier purchase could not be saved to MongoDB.',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

  /* =======================================================
     MAIN SAVE
  ======================================================= */

  const handleSave = async () => {
    if (
      purchaseMode ===
      'customer'
    ) {
      await saveCustomerPurchase();
    } else {
      await saveSupplierPurchase();
    }
  };

  /* =======================================================
     EDIT CUSTOMER PURCHASE
  ======================================================= */

  const loadCustomerForEdit = (
    purchase: Purchase
  ) => {
    setPurchaseMode('customer');

    setBillNo(
      purchase.billNo || ''
    );

    setGrowerName(
      purchase.growerName ===
        'F.Co (Own Stock)'
        ? ''
        : purchase.growerName ||
            ''
    );

    setPartyId(purchase.partyId || '');

    setDate(
      purchase.date || ''
    );

    setPurchaseFor(
      purchase.purchaseFor ||
        (
          purchase.growerName ===
          'F.Co (Own Stock)'
            ? 'Own Stock (F.Co)'
            : 'Customer'
        )
    );

    setRows(
      purchase.entries?.length
        ? purchase.entries.map(
            (row) => ({
              ...row,
              qty:
                Number(row.qty) || 0,
              rate:
                Number(row.rate) || 0,
              total:
                Number(
                  row.total || 0
                ),
            })
          )
        : createCustomerRows()
    );

    const key =
      purchase.id ||
      `purchase-${purchase.billNo}`;

    setEditingDocumentKey(key);
    setIsEditing(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =======================================================
     EDIT SUPPLIER PURCHASE
  ======================================================= */

  const loadSupplierForEdit = (
    purchase: SupplierPurchase
  ) => {
    setPurchaseMode('supplier');

    setSupplierPurchaseNo(
      purchase.purchaseNo || ''
    );

    setSupplierDate(
      purchase.date || ''
    );

    setSupplierName(
      purchase.supplierName || ''
    );

    setSupplierKhata(
      purchase.khata || ''
    );

    setSupplierNotes(
      purchase.notes || ''
    );

    setSupplierPaid(
      Number(
        purchase.paid || 0
      )
    );

    setSupplierRows(
      purchase.entries?.length
        ? purchase.entries.map(
            (row) => ({
              ...row,
              qty:
                Number(row.qty) || 0,
              rate:
                Number(row.rate) || 0,
              amount:
                Number(
                  row.amount || 0
                ),
            })
          )
        : createSupplierRows()
    );

    const key =
      purchase.id ||
      `supplier-purchase-${purchase.purchaseNo}`;

    setEditingDocumentKey(key);
    setIsEditing(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =======================================================
     DELETE CUSTOMER
  ======================================================= */

  const deleteCustomerPurchase =
    async (
      purchase: Purchase
    ) => {
      if (
        userRole !== 'admin'
      ) {
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description:
            'Only administrators can delete purchases.',
        });

        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to delete Customer Purchase #${purchase.billNo}?`
        );

      if (!confirmed) return;

      const key =
        purchase.id ||
        `purchase-${purchase.billNo}`;

      try {
        const result =
          await deleteDocument(
            key
          );

        if (!result.success) {
          throw new Error(
            result.error ||
              'Delete failed'
          );
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }

        toast({
          title:
            'Customer Purchase Deleted',
          description:
            `Purchase #${purchase.billNo} has been deleted.`,
        });

        if (
          editingDocumentKey ===
          key
        ) {
          resetForm();
        }

        await fetchAllPurchases();
      } catch (error) {
        console.error(
          'Customer purchase delete failed:',
          error
        );

        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description:
            'Customer purchase could not be deleted.',
        });
      }
    };

  /* =======================================================
     DELETE SUPPLIER
  ======================================================= */

  const deleteSupplierPurchase =
    async (
      purchase: SupplierPurchase
    ) => {
      if (
        userRole !== 'admin'
      ) {
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description:
            'Only administrators can delete purchases.',
        });

        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to delete Supplier Purchase #${purchase.purchaseNo}?`
        );

      if (!confirmed) return;

      const key =
        purchase.id ||
        `supplier-purchase-${purchase.purchaseNo}`;

      try {
        const result =
          await deleteDocument(
            key
          );

        if (!result.success) {
          throw new Error(
            result.error ||
              'Delete failed'
          );
        }

        if (
          typeof window !==
          'undefined'
        ) {
          localStorage.removeItem(
            key
          );
        }

        toast({
          title:
            'Supplier Purchase Deleted',
          description:
            `Supplier purchase #${purchase.purchaseNo} has been deleted.`,
        });

        if (
          editingDocumentKey ===
          key
        ) {
          resetForm();
        }

        await fetchAllPurchases();
      } catch (error) {
        console.error(
          'Supplier purchase delete failed:',
          error
        );

        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description:
            'Supplier purchase could not be deleted.',
        });
      }
    };

  /* =======================================================
     VIEW BILL
  ======================================================= */

  const viewBill = () => {
    if (!isEditing) {
      toast({
        variant: 'destructive',
        title: 'Cannot View Bill',
        description:
          'Please save the purchase first.',
      });

      return;
    }

    if (
      purchaseMode ===
      'customer'
    ) {
      if (!billNo) return;

      router.push(
        `/purchase-bill/${billNo}`
      );
    } else {
      if (
        !supplierPurchaseNo
      )
        return;

      router.push(
        `/supplier-purchase-bill/${supplierPurchaseNo}`
      );
    }
  };

  /* =======================================================
     CUSTOMER FORM
  ======================================================= */

  const customerForm = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="billNo">
            Bill No
          </Label>

          <Input
            id="billNo"
            value={billNo}
            onChange={(e) =>
              setBillNo(
                e.target.value
              )
            }
            disabled={isEditing}
            placeholder="Enter bill number"
          />
        </div>

        <div>
          <Label htmlFor="customerDate">
            Date
          </Label>

          <Input
            id="customerDate"
            type="date"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label>
            Purchase For
          </Label>

          <Select
            value={purchaseFor}
            onValueChange={(
              value:
                | 'Customer'
                | 'Own Stock (F.Co)'
            ) =>
              setPurchaseFor(
                value
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Customer">
                Customer
              </SelectItem>

              <SelectItem value="Own Stock (F.Co)">
                Own Stock (F.Co)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>
            {purchaseFor ===
            'Customer'
              ? 'Customer Name'
              : 'Company Name'}
          </Label>

          {purchaseFor ===
          'Customer' ? (
            <PartySelector
              value={growerName}
              onChange={(name) => {
                setGrowerName(name);
                setPartyId('');
              }}
              onPartySelect={(party) => setPartyId(party.id)}
              filter="customer"
            />
          ) : (
            <Input
              value="F.Co (Own Stock)"
              disabled
            />
          )}
        </div>
      </div>

      <Separator />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                #
              </TableHead>

              <TableHead>
                Type
              </TableHead>

              <TableHead>
                Variety
              </TableHead>

              <TableHead className="text-right">
                Qty
              </TableHead>

              <TableHead className="text-right">
                Rate
              </TableHead>

              <TableHead className="text-right">
                Total
              </TableHead>

              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map(
              (row, index) => (
                <TableRow
                  key={index}
                >
                  <TableCell>
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <Select
                      value={
                        row.type
                      }
                      onValueChange={(
                        value:
                          PurchaseRow['type']
                      ) =>
                        updateCustomerRow(
                          index,
                          {
                            type:
                              value,
                          }
                        )
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Patti">
                          Patti
                        </SelectItem>

                        <SelectItem value="Dabba">
                          Dabba
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Input
                      value={
                        row.variety
                      }
                      onChange={(
                        e
                      ) =>
                        updateCustomerRow(
                          index,
                          {
                            variety:
                              e.target
                                .value,
                          }
                        )
                      }
                      placeholder="Variety"
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        row.qty ||
                        ''
                      }
                      onChange={(
                        e
                      ) =>
                        updateCustomerRow(
                          index,
                          {
                            qty:
                              Number(
                                e
                                  .target
                                  .value
                              ) ||
                              0,
                          }
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        row.rate ||
                        ''
                      }
                      onChange={(
                        e
                      ) =>
                        updateCustomerRow(
                          index,
                          {
                            rate:
                              Number(
                                e
                                  .target
                                  .value
                              ) ||
                              0,
                          }
                        )
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    
                    {Math.round(Number(
                      customerTotals
                        .rowTotals[
                        index
                      ] || 0
                    ))}
                  </TableCell>

                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        removeCustomerRow(
                          index
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={7}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={
                    addCustomerRow
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Total Quantity
            </p>

            <p className="text-3xl font-bold">
              {customerTotals.totalQty.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Grand Total
            </p>

            <p className="text-3xl font-bold">
              
              {formatPurchaseAmount(customerTotals.grandTotal)}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );

  /* =======================================================
     SUPPLIER FORM
  ======================================================= */

  const supplierForm = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="supplierPurchaseNo">
            Purchase No
          </Label>

          <Input
            id="supplierPurchaseNo"
            value={
              supplierPurchaseNo
            }
            onChange={(e) =>
              setSupplierPurchaseNo(
                e.target.value
              )
            }
            disabled={isEditing}
            placeholder="Enter purchase number"
          />
        </div>

        <div>
          <Label htmlFor="supplierDate">
            Date
          </Label>

          <Input
            id="supplierDate"
            type="date"
            value={
              supplierDate
            }
            onChange={(e) =>
              setSupplierDate(
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label htmlFor="supplierName">
            Supplier Name
          </Label>

          <Input
            id="supplierName"
            value={
              supplierName
            }
            onChange={(e) =>
              setSupplierName(
                e.target.value
              )
            }
            placeholder="Enter supplier name"
          />
        </div>

        <div>
          <Label htmlFor="supplierKhata">
            Khata
          </Label>

          <Input
            id="supplierKhata"
            value={
              supplierKhata
            }
            onChange={(e) =>
              setSupplierKhata(
                e.target.value
              )
            }
            placeholder="Khata / account"
          />
        </div>
      </div>

      <Separator />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                #
              </TableHead>

              <TableHead>
                Type
              </TableHead>

              <TableHead>
                Description
              </TableHead>

              <TableHead className="text-right">
                Qty
              </TableHead>

              <TableHead className="text-right">
                Rate
              </TableHead>

              <TableHead className="text-right">
                Amount
              </TableHead>

              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {supplierRows.map(
              (row, index) => (
                <TableRow
                  key={index}
                >
                  <TableCell>
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <Select
                      value={
                        row.type
                      }
                      onValueChange={(
                        value:
                          SupplierPurchaseRow['type']
                      ) =>
                        updateSupplierRow(
                          index,
                          {
                            type:
                              value,
                          }
                        )
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Patti">
                          Patti
                        </SelectItem>

                        <SelectItem value="Dabba">
                          Dabba
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Input
                      value={
                        row.description
                      }
                      onChange={(
                        e
                      ) =>
                        updateSupplierRow(
                          index,
                          {
                            description:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="Item / variety"
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        row.qty ||
                        ''
                      }
                      onChange={(
                        e
                      ) =>
                        updateSupplierRow(
                          index,
                          {
                            qty:
                              Number(
                                e
                                  .target
                                  .value
                              ) ||
                              0,
                          }
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        row.rate ||
                        ''
                      }
                      onChange={(
                        e
                      ) =>
                        updateSupplierRow(
                          index,
                          {
                            rate:
                              Number(
                                e
                                  .target
                                  .value
                              ) ||
                              0,
                          }
                        )
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    
                    {formatPurchaseAmount(row.amount)}
                  </TableCell>

                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        removeSupplierRow(
                          index
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={7}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={
                    addSupplierRow
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* SUPPLIER TOTAL / PAID / BALANCE */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Total Purchase
            </p>

            <p className="text-3xl font-bold">
              
              {formatPurchaseAmount(supplierTotals.totalPurchase)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="supplierPaid">
              Paid
            </Label>

            <Input
              id="supplierPaid"
              type="number"
              min="0"
              step="1"
              value={
                supplierPaid ||
                ''
              }
              onChange={(e) =>
                setSupplierPaid(
                  Number(
                    e.target
                      .value
                  ) || 0
                )
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Balance
            </p>

            <p
              className={`text-3xl font-bold ${
                supplierTotals.balance >
                0
                  ? 'text-destructive'
                  : 'text-green-600'
              }`}
            >
              
              {formatPurchaseAmount(supplierTotals.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Label htmlFor="supplierNotes">
          Notes
        </Label>

        <Input
          id="supplierNotes"
          value={
            supplierNotes
          }
          onChange={(e) =>
            setSupplierNotes(
              e.target.value
            )
          }
          placeholder="Optional notes"
          className="mt-2"
        />
      </div>
    </>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          purchaseMode ===
          'customer'
            ? 'Record New Purchase'
            : 'Record Supplier Purchase'
        }
        description={
          purchaseMode ===
          'customer'
            ? 'Enter details for apples purchased from growers at the mandi.'
            : 'Record purchases made directly from suppliers.'
        }
        icon={
          purchaseMode ===
          'customer' ? (
            <ShoppingBasket className="h-8 w-8" />
          ) : (
            <Building2 className="h-8 w-8" />
          )
        }
        imageUrl="/assets/3d/purchases.png"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* =================================================
            MAIN FORM
        ================================================= */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {purchaseMode ===
                  'customer'
                    ? 'Customer Purchase'
                    : 'Supplier Purchase'}
                </h2>

                <p className="text-sm text-muted-foreground">
                  Choose the purchase type below.
                </p>
              </div>

              {isEditing && (
                <Badge variant="secondary">
                  Editing Existing Purchase
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* PURCHASE TYPE */}

            <div className="rounded-xl border bg-muted/30 p-4">
              <Label className="mb-2 block text-sm font-semibold">
                Purchase Type
              </Label>

              <Select
                value={
                  purchaseMode
                }
                onValueChange={(
                  value:
                    PurchaseMode
                ) => {
                  if (
                    value !==
                    purchaseMode
                  ) {
                    setIsEditing(
                      false
                    );
                    setEditingDocumentKey(
                      null
                    );
                  }

                  setPurchaseMode(
                    value
                  );
                }}
              >
                <SelectTrigger className="w-full md:w-[320px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="customer">
                    Customer Purchase
                  </SelectItem>

                  <SelectItem value="supplier">
                    Supplier Purchase
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CUSTOMER SECTION */}

            {purchaseMode ===
              'customer' &&
              customerForm}

            {/* SUPPLIER SECTION */}

            {purchaseMode ===
              'supplier' &&
              supplierForm}
          </CardContent>

          <CardFooter>
            <div className="flex w-full flex-col md:flex-row justify-center gap-4">
              <Button
                type="button"
                onClick={
                  handleSave
                }
                className="w-full md:max-w-xs"
                disabled={
                  isSubmitting
                }
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {isEditing
                  ? 'Update Purchase'
                  : 'Save Purchase'}
              </Button>

              <Button
                type="button"
                onClick={
                  viewBill
                }
                variant="secondary"
                className="w-full md:max-w-xs gap-2"
                disabled={
                  !isEditing || isSubmitting
                }
              >
                <FileText className="h-4 w-4" />
                View Bill
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  onClick={
                    resetForm
                  }
                  variant="outline"
                  className="w-full md:max-w-xs"
                >
                  New Purchase
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* =================================================
            RECENT PURCHASES
        ================================================= */}

        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Recent Purchases
                </h3>

                <p className="text-xs text-muted-foreground">
                  Customer and supplier purchases
                </p>
              </div>

              <Select
                value={String(
                  selectedYear
                )}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {availableYears.map(
                    (year) => (
                      <SelectItem
                        key={year}
                        value={String(
                          year
                        )}
                      >
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* SEARCH */}

            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search bill, supplier, customer..."
                className="pl-8"
                value={
                  searchTerm
                }
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />
            </div>

            {/* YEARLY SUMMARY */}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Customer Qty
                </p>

                <p className="font-bold">
                  {yearlyCustomerQty.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Supplier Total
                </p>

                <p className="font-bold">
                  
                  {formatPurchaseAmount(yearlySupplierTotal)}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-[520px]">
              <div className="space-y-3 pr-3">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* CUSTOMER PURCHASES */}

                    {filteredCustomerPurchases.length >
                      0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge>
                            Customer
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            {
                              filteredCustomerPurchases.length
                            }{' '}
                            purchase(s)
                          </span>
                        </div>

                        {filteredCustomerPurchases.map(
                          (
                            purchase
                          ) => (
                            <div
                              key={
                                purchase.id
                              }
                              className="border rounded-lg p-3 hover:bg-muted/50"
                            >
                              <div className="flex justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium">
                                    Bill #
                                    {
                                      purchase.billNo
                                    }
                                  </p>

                                  <p className="text-sm text-muted-foreground truncate">
                                    {
                                      purchase.growerName
                                    }
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      purchase.date
                                    ).toLocaleDateString()}
                                  </p>

                                  <p className="text-xs mt-1">
                                    Qty:{' '}
                                    <strong>
                                      {Number(
                                        purchase
                                          .totals
                                          ?.totalQty ||
                                          0
                                      ).toLocaleString()}
                                    </strong>

                                    {' • '}

                                    
                                    {formatPurchaseAmount(purchase.totals?.grandTotal)}
                                  </p>
                                </div>

                                <div className="flex items-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Edit"
                                    onClick={() =>
                                      loadCustomerForEdit(
                                        purchase
                                      )
                                    }
                                  >
                                    <FilePenLine className="h-4 w-4" />
                                  </Button>

                                  {userRole ===
                                    'admin' && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="Delete"
                                      onClick={() =>
                                        deleteCustomerPurchase(
                                          purchase
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* SUPPLIER PURCHASES */}

                    {filteredSupplierPurchases.length >
                      0 && (
                      <div className="space-y-2 pt-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Supplier
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            {
                              filteredSupplierPurchases.length
                            }{' '}
                            purchase(s)
                          </span>
                        </div>

                        {filteredSupplierPurchases.map(
                          (
                            purchase
                          ) => (
                            <div
                              key={
                                purchase.id
                              }
                              className="border rounded-lg p-3 hover:bg-muted/50"
                            >
                              <div className="flex justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium">
                                    Purchase #
                                    {
                                      purchase.purchaseNo
                                    }
                                  </p>

                                  <p className="text-sm text-muted-foreground truncate">
                                    {
                                      purchase.supplierName
                                    }
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      purchase.date
                                    ).toLocaleDateString()}
                                  </p>

                                  <div className="text-xs mt-1 space-y-0.5">
                                    <p>
                                      Total:{' '}
                                      <strong>
                                        
                                        {formatPurchaseAmount(purchase.totalPurchase)}
                                      </strong>
                                    </p>

                                    <p>
                                      Paid:{' '}
                                      <strong>
                                        
                                        {formatPurchaseAmount(purchase.paid)}
                                      </strong>
                                    </p>

                                    <p>
                                      Balance:{' '}
                                      <strong
                                        className={
                                          Number(
                                            purchase.balance ||
                                              0
                                          ) >
                                          0
                                            ? 'text-destructive'
                                            : 'text-green-600'
                                        }
                                      >
                                        
                                        {formatPurchaseAmount(purchase.balance)}
                                      </strong>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Edit"
                                    onClick={() =>
                                      loadSupplierForEdit(
                                        purchase
                                      )
                                    }
                                  >
                                    <FilePenLine className="h-4 w-4" />
                                  </Button>

                                  {userRole ===
                                    'admin' && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="Delete"
                                      onClick={() =>
                                        deleteSupplierPurchase(
                                          purchase
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* NOTHING FOUND */}

                    {filteredCustomerPurchases.length ===
                      0 &&
                      filteredSupplierPurchases.length ===
                        0 && (
                        <p className="text-sm text-muted-foreground text-center p-8">
                          No purchases found for{' '}
                          {selectedYear}.
                        </p>
                      )}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
