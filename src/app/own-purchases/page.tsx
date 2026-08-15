'use client';

import React, { useMemo, useState } from 'react';
import { saveDocument } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  ShoppingBasket,
  FileText,
} from 'lucide-react';

import PageHeader from '@/components/PageHeader';

type OwnPurchaseRow = {
  type: 'Patti' | 'Dabba';
  variety: string;
  qty: number;
  rate: number;
};

type OwnPurchase = {
  id: string;
  purchaseNo: string;
  date: string;
  supplierName: string;
  khata: string;
  notes: string;
  entries: OwnPurchaseRow[];
  totals: {
    totalQty: number;
    totalAmount: number;
    paid: number;
    balance: number;
  };
  purchaseType: 'Own Purchase';
};

const emptyRow: OwnPurchaseRow = {
  type: 'Patti',
  variety: '',
  qty: 0,
  rate: 0,
};

const initialRows: OwnPurchaseRow[] = [
  { ...emptyRow },
  { ...emptyRow },
  { ...emptyRow },
];

export default function OwnPurchasesPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [purchaseNo, setPurchaseNo] = useState('');
  const [date, setDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [khata, setKhata] = useState('');
  const [notes, setNotes] = useState('');
  const [paid, setPaid] = useState(0);

  const [rows, setRows] =
    useState<OwnPurchaseRow[]>(initialRows);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => {
    const rowTotals = rows.map(
      (row) =>
        (Number(row.qty) || 0) *
        (Number(row.rate) || 0)
    );

    const totalQty = rows.reduce(
      (sum, row) => sum + (Number(row.qty) || 0),
      0
    );

    const totalAmount = rowTotals.reduce(
      (sum, value) => sum + value,
      0
    );

    const balance =
      totalAmount - (Number(paid) || 0);

    return {
      rowTotals,
      totalQty,
      totalAmount,
      balance,
    };
  }, [rows, paid]);

  const updateRow = (
    index: number,
    patch: Partial<OwnPurchaseRow>
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
    setPurchaseNo('');
    setDate('');
    setSupplierName('');
    setKhata('');
    setNotes('');
    setPaid(0);
    setRows(initialRows);
  };

  const saveOwnPurchase = async () => {
    if (
      !purchaseNo.trim() ||
      !date ||
      !supplierName.trim()
    ) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description:
          'Please enter Purchase No., Date and Supplier / Seller.',
      });

      return;
    }

    const validEntries = rows
      .filter(
        (row) =>
          Number(row.qty) > 0 &&
          Number(row.rate) > 0 &&
          row.variety.trim()
      )
      .map((row) => ({
        type: row.type,
        variety: row.variety.trim(),
        qty: Math.round(Number(row.qty)),
        rate: Math.round(Number(row.rate)),
      }));

    if (validEntries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Items',
        description:
          'Add at least one purchase item with quantity, variety and rate.',
      });

      return;
    }

    setIsSubmitting(true);

    const documentKey =
      `own-purchase-${purchaseNo.trim()}`;

    const purchaseData: OwnPurchase = {
      id: documentKey,
      purchaseNo: purchaseNo.trim(),
      date,
      supplierName: supplierName.trim(),
      khata: khata.trim(),
      notes: notes.trim(),

      entries: validEntries,

      totals: {
        totalQty: Math.round(totals.totalQty),
        totalAmount: Math.round(totals.totalAmount),
        paid: Math.round(Number(paid) || 0),
        balance: Math.round(totals.balance),
      },

      purchaseType: 'Own Purchase',
    };

    try {
      const result = await saveDocument(
        documentKey,
        purchaseData
      );

      if (!result.success) {
        throw new Error(
          result.error || 'Failed to save purchase'
        );
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          documentKey,
          JSON.stringify(purchaseData)
        );

        window.dispatchEvent(
          new Event('mongodb-synced')
        );
      }

      toast({
        title: 'F.Co Purchase Saved',
        description:
          `Purchase #${purchaseNo} has been saved successfully.`,
      });

      resetForm();
    } catch (error) {
      console.error(
        'F.Co purchase save failed:',
        error
      );

      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description:
          'The F.Co purchase could not be saved.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="F.Co Purchases"
        description="Record purchases made by F.Co from suppliers and sellers."
        icon={
          <ShoppingBasket className="h-8 w-8" />
        }
        imageUrl="/assets/3d/purchases.png"
      />

      <Card>
        <CardHeader>
          <CardTitle>
            New F.Co Purchase
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>
                Purchase No.
              </Label>

              <Input
                value={purchaseNo}
                onChange={(e) =>
                  setPurchaseNo(e.target.value)
                }
                placeholder="e.g. FP-001"
              />
            </div>

            <div>
              <Label>
                Date
              </Label>

              <Input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
              />
            </div>

            <div>
              <Label>
                Supplier / Seller
              </Label>

              <Input
                value={supplierName}
                onChange={(e) =>
                  setSupplierName(e.target.value)
                }
                placeholder="Supplier name"
              />
            </div>

            <div>
              <Label>
                Khata
              </Label>

              <Input
                value={khata}
                onChange={(e) =>
                  setKhata(e.target.value)
                }
                placeholder="Khata / Account"
              />
            </div>
          </div>

          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>
                  Description / Variety
                </TableHead>
                <TableHead>
                  Type
                </TableHead>
                <TableHead className="text-right">
                  Quantity
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
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {index + 1}
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
                      placeholder="Variety / Description"
                    />
                  </TableCell>

                  <TableCell>
                    <Select
                      value={row.type}
                      onValueChange={(
                        value: OwnPurchaseRow['type']
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
                      type="number"
                      min="0"
                      step="1"
                      value={row.qty || ''}
                      onChange={(e) =>
                        updateRow(index, {
                          qty:
                            Math.round(
                              Number(
                                e.target.value
                              )
                            ) || 0,
                        })
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={row.rate || ''}
                      onChange={(e) =>
                        updateRow(index, {
                          rate:
                            Math.round(
                              Number(
                                e.target.value
                              )
                            ) || 0,
                        })
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    ₹
                    {Math.round(
                      totals.rowTotals[index] || 0
                    ).toLocaleString('en-IN')}
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        removeRow(index)
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>
                Paid
              </Label>

              <Input
                type="number"
                min="0"
                step="1"
                value={paid || ''}
                onChange={(e) =>
                  setPaid(
                    Math.round(
                      Number(e.target.value)
                    ) || 0
                  )
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label>
                Notes
              </Label>

              <Input
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder="Optional notes"
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span>
                  Total Quantity
                </span>

                <strong>
                  {Math.round(
                    totals.totalQty
                  ).toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="flex justify-between mt-2">
                <span>
                  Total Purchase
                </span>

                <strong>
                  ₹
                  {Math.round(
                    totals.totalAmount
                  ).toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="flex justify-between mt-2">
                <span>
                  Balance
                </span>

                <strong>
                  ₹
                  {Math.round(
                    totals.balance
                  ).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            <strong>Separate F.Co Purchase:</strong>{' '}
            This record is stored independently from
            Customer Purchases. Freight and Other Expenses
            are intentionally not included.
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-4">
          <Button
            onClick={saveOwnPurchase}
            disabled={isSubmitting}
            className="min-w-[220px]"
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Save F.Co Purchase
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              router.push('/purchase-register')
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Purchase Register
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}