'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { saveDocument, deleteDocument, getDocuments } from '@/lib/actions';

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
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
} from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from '@/components/party-selector';
import PageHeader from '@/components/PageHeader';

type PurchaseRow = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
  total?: number;
};

type Purchase = {
  id: string;
  billNo: string;
  date: string;
  growerName: string;
  purchaseFor: 'Customer' | 'Own Stock (F.Co)';
  entries: PurchaseRow[];
  totals: {
    totalQty: number;
    grandTotal: number;
  };
};

const emptyRow: PurchaseRow = {
  type: 'Patti',
  qty: 0,
  variety: '',
  rate: 0,
};

const initialRows: PurchaseRow[] = Array.from(
  { length: 3 },
  () => ({ ...emptyRow })
);

function getYearFromDate(date: unknown): number | null {
  if (!date) return null;

  const value = String(date);

  const match = value.match(/\b(20\d{2})\b/);

  if (match) {
    return Number(match[1]);
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getFullYear();
  }

  return null;
}

export default function PurchasesPage() {
  const { toast } = useToast();
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([
    currentYear,
  ]);

  const [billNo, setBillNo] = useState('');
  const [growerName, setGrowerName] = useState('');
  const [date, setDate] = useState('');

  const [rows, setRows] = useState<PurchaseRow[]>(initialRows);

  const [purchaseFor, setPurchaseFor] = useState<
    'Customer' | 'Own Stock (F.Co)'
  >('Customer');

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [savedPurchases, setSavedPurchases] = useState<Purchase[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getDocuments('purchase-');

      if (result.success) {
        const purchases = (result.data || []).map((item: any) => ({
          ...item,
          id: item.id || `purchase-${item.billNo}`,
        }));

        setSavedPurchases(
          purchases.sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() -
              new Date(a.date).getTime()
          )
        );
      } else {
        setSavedPurchases([]);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
      setSavedPurchases([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const yearlyPurchases = useMemo(() => {
    return savedPurchases.filter((purchase) => {
      return getYearFromDate(purchase.date) === selectedYear;
    });
  }, [savedPurchases, selectedYear]);

  const yearlyCount = yearlyPurchases.length;

  const yearlyNugs = useMemo(() => {
    return yearlyPurchases.reduce(
      (total, purchase) =>
        total + Number(purchase.totals?.totalQty || 0),
      0
    );
  }, [yearlyPurchases]);

  const filteredPurchases = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();

    return yearlyPurchases.filter((purchase) => {
      if (!lowerCaseSearch) return true;

      return (
        purchase.billNo
          ?.toLowerCase()
          .includes(lowerCaseSearch) ||
        purchase.growerName
          ?.toLowerCase()
          .includes(lowerCaseSearch)
      );
    });
  }, [yearlyPurchases, searchTerm]);

  const totals = useMemo(() => {
    const totalQty = rows.reduce(
      (sum, row) => sum + (Number(row.qty) || 0),
      0
    );

    const rowTotals = rows.map(
      (row) =>
        (Number(row.qty) || 0) *
        (Number(row.rate) || 0)
    );

    const grandTotal = rowTotals.reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      totalQty,
      grandTotal,
      rowTotals,
    };
  }, [rows]);

  const updateRow = (
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

  const addRow = () => {
    setRows((previous) => [
      ...previous,
      { ...emptyRow },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((previous) =>
      previous.length > 1
        ? previous.filter((_, i) => i !== index)
        : previous
    );
  };

  const resetForm = () => {
    setBillNo('');
    setGrowerName('');
    setDate('');
    setPurchaseFor('Customer');
    setRows(initialRows);
    setIsEditing(false);
  };

  const savePurchase = async () => {
    if (
      !billNo ||
      !date ||
      (purchaseFor === 'Customer' && !growerName)
    ) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description:
          'Please fill in Bill No, Date, and Customer Name before saving.',
      });

      return;
    }

    setIsSubmitting(true);

    const purchaseId = `purchase-${billNo}`;

    const finalGrowerName =
      purchaseFor === 'Own Stock (F.Co)'
        ? 'F.Co (Own Stock)'
        : growerName;

    const purchaseData: Purchase = {
      id: purchaseId,
      billNo,
      date,
      growerName: finalGrowerName,
      purchaseFor,

      entries: rows
        .filter(
          (row) =>
            Number(row.qty) > 0 &&
            Number(row.rate) > 0
        )
        .map((row) => ({
          ...row,
          qty: Number(row.qty),
          rate: Number(row.rate),
          total:
            Number(row.qty) *
            Number(row.rate),
        })),

      totals: {
        totalQty: totals.totalQty,
        grandTotal: Number(
          totals.grandTotal.toFixed(2)
        ),
      },
    };

    try {
      /*
       * IMPORTANT:
       * Save to MongoDB using the actual document key.
       */
      const result = await saveDocument(
        purchaseId,
        purchaseData
      );

      if (!result.success) {
        throw new Error(
          result.error || 'MongoDB save failed'
        );
      }

      /*
       * Local cache for immediate UI access
       */
      localStorage.setItem(
        purchaseId,
        JSON.stringify(purchaseData)
      );

      toast({
        title: isEditing
          ? 'Purchase Updated'
          : 'Purchase Saved',
        description:
          'The purchase bill has been successfully saved.',
      });

      await fetchPurchases();

      setIsEditing(true);
    } catch (error) {
      console.error(
        'Purchase save failed:',
        error
      );

      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description:
          'Purchase could not be saved to the database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPurchase = () => {
    if (!isEditing || !billNo) {
      toast({
        variant: 'destructive',
        title: 'Cannot View Bill',
        description:
          'Please save the purchase before viewing.',
      });

      return;
    }

    router.push(`/purchase-bill/${billNo}`);
  };

  const loadPurchaseForEdit = (
    purchase: Purchase
  ) => {
    setBillNo(purchase.billNo);

    setGrowerName(
      purchase.growerName === 'F.Co (Own Stock)'
        ? ''
        : purchase.growerName
    );

    setDate(purchase.date);

    setPurchaseFor(
      purchase.purchaseFor ||
        (purchase.growerName ===
        'F.Co (Own Stock)'
          ? 'Own Stock (F.Co)'
          : 'Customer')
    );

    setRows(
      purchase.entries?.length
        ? purchase.entries
        : initialRows
    );

    setIsEditing(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDeletePurchase = async (
    billId: string
  ) => {
    if (userRole !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description:
          'You do not have permission to delete purchases.',
      });

      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete Purchase Bill #${billId}?`
      )
    ) {
      return;
    }

    const documentKey = `purchase-${billId}`;

    try {
      const result = await deleteDocument(
        documentKey
      );

      if (!result.success) {
        throw new Error(
          result.error || 'Delete failed'
        );
      }

      localStorage.removeItem(documentKey);

      await fetchPurchases();

      toast({
        title: 'Purchase Deleted',
        description: `Purchase Bill #${billId} has been deleted.`,
      });

      if (billNo === billId) {
        resetForm();
      }
    } catch (error) {
      console.error(
        'Purchase delete failed:',
        error
      );

      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description:
          'Purchase could not be deleted.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record New Purchase"
        description="Enter details for apples purchased from growers at the mandi."
        icon={<ShoppingBasket className="h-8 w-8" />}
        imageUrl="/assets/3d/purchases.png"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="billNo">
                  Bill No
                </Label>

                <Input
                  id="billNo"
                  value={billNo}
                  onChange={(e) =>
                    setBillNo(e.target.value)
                  }
                  disabled={isEditing}
                />
              </div>

              <div>
                <Label htmlFor="date">
                  Date
                </Label>

                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
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
                    setPurchaseFor(value)
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
                  {purchaseFor === 'Customer'
                    ? 'Customer Name'
                    : 'Company Name'}
                </Label>

                {purchaseFor === 'Customer' ? (
                  <PartySelector
                    value={growerName}
                    onChange={setGrowerName}
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Variety</TableHead>
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
                {rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      <Select
                        value={row.type}
                        onValueChange={(
                          value: PurchaseRow['type']
                        ) =>
                          updateRow(index, {
                            type: value,
                          })
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
                        value={row.variety}
                        onChange={(e) =>
                          updateRow(index, {
                            variety:
                              e.target.value,
                          })
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        value={row.qty || ''}
                        onChange={(e) =>
                          updateRow(index, {
                            qty:
                              Number(
                                e.target.value
                              ) || 0,
                          })
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        value={row.rate || ''}
                        onChange={(e) =>
                          updateRow(index, {
                            rate:
                              Number(
                                e.target.value
                              ) || 0,
                          })
                        }
                      />
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      ₹
                      {(
                        totals.rowTotals[index] ||
                        0
                      ).toFixed(2)}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removeRow(index)
                        }
                      >
                        <Trash2 className="text-red-600 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7}>
                    <Button
                      onClick={addRow}
                      variant="outline"
                      size="sm"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            <Separator />

            <div className="flex justify-end gap-6 p-4 bg-muted rounded-lg">
              <div className="text-right">
                <p className="text-muted-foreground">
                  Total Quantity
                </p>

                <p className="text-2xl font-bold">
                  {totals.totalQty}
                </p>
              </div>

              <div className="text-right">
                <p className="text-muted-foreground">
                  Grand Total
                </p>

                <p className="text-2xl font-bold">
                  ₹
                  {totals.grandTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="flex w-full justify-center gap-4">
              <Button
                onClick={savePurchase}
                className="w-full max-w-xs"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {isEditing
                  ? 'Update Purchase'
                  : 'Save Purchase'}
              </Button>

              <Button
                onClick={viewPurchase}
                variant="secondary"
                className="w-full max-w-xs gap-2"
                disabled={!isEditing}
              >
                <FileText className="h-4 w-4" />
                View Bill
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">
                  Recent Purchases
                </h3>

                {!isLoading && (
                  <Badge variant="secondary">
                    {yearlyCount} in {selectedYear}
                  </Badge>
                )}
              </div>

              <Select
                value={String(selectedYear)}
                onValueChange={(value) =>
                  setSelectedYear(Number(value))
                }
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={String(year)}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>

            <div className="text-sm text-muted-foreground mt-2">
              Total Quantity in {selectedYear}:{' '}
              <span className="font-bold text-foreground">
                {yearlyNugs.toLocaleString()}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex justify-between items-center p-2 border rounded-md hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">
                          Bill #{purchase.billNo}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {purchase.growerName}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            purchase.date
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            loadPurchaseForEdit(
                              purchase
                            )
                          }
                        >
                          <FilePenLine className="h-4 w-4" />
                        </Button>

                        {userRole === 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeletePurchase(
                                purchase.billNo
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center p-4">
                    No purchases saved for {selectedYear}.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
