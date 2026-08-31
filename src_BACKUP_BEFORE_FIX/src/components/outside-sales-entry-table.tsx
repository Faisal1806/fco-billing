
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';

export type EntryRow = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
  isStored?: boolean;
};

export const emptyRow: EntryRow = { type: 'Patti', qty: 0, variety: '', rate: 0, isStored: false };

interface EntryTableProps {
  title: string;
  rows: EntryRow[];
  icon: React.ReactNode;
  onUpdate: (index: number, patch: Partial<EntryRow>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  showStorageOption?: boolean;
}

const EntryTableComponent = ({ title, rows, icon, onUpdate, onAdd, onRemove, showStorageOption = false }: EntryTableProps) => {
  return (
    <div>
      <Label className="text-base font-semibold flex items-center gap-2 mb-2">
        {icon} {title}
      </Label>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Variety</TableHead>
            {showStorageOption && <TableHead>Store</TableHead>}
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell>
                <Select
                  value={r.type}
                  onValueChange={(v: EntryRow['type']) => onUpdate(i, { type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Patti">Patti</SelectItem>
                    <SelectItem value="Dabba">Dabba</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Variety"
                  value={r.variety}
                  onChange={(e) => onUpdate(i, { variety: e.target.value })}
                />
              </TableCell>
              {showStorageOption && (
                 <TableCell className="text-center">
                    <Checkbox
                        checked={r.isStored}
                        onCheckedChange={(checked) => onUpdate(i, { isStored: !!checked })}
                    />
                 </TableCell>
              )}
              <TableCell>
                <Input
                  type="number"
                  className="text-right"
                  value={r.qty || ''}
                  onChange={(e) => onUpdate(i, { qty: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  className="text-right"
                  value={r.rate || ''}
                  onChange={(e) => onUpdate(i, { rate: Number(e.target.value) })}
                  disabled={r.isStored}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                 {r.isStored ? <Badge variant="secondary">Stored</Badge> : `â‚¹${((r.qty || 0) * (r.rate || 0)).toFixed(2)}`}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onRemove(i)}>
                  <Trash2 className="text-red-500 h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={onAdd} variant="outline" size="sm" className="mt-2 gap-2">
        <PlusCircle className="h-4 w-4" /> Add Row
      </Button>
    </div>
  );
};

export const EntryTable = React.memo(EntryTableComponent);



