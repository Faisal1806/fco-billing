'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrintOrientation } from '@/components/print-orientation-provider';

export function PrintOrientationSelector() {
  const { orientation, setOrientation } = usePrintOrientation();

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <label className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
        Orientation
      </label>
      <Select value={orientation} onValueChange={(value) => setOrientation(value as 'portrait' | 'landscape')}>
        <SelectTrigger className="h-11 rounded-xl border-white/10 bg-background/80 text-sm font-semibold">
          <SelectValue placeholder="Portrait" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="portrait">Portrait</SelectItem>
          <SelectItem value="landscape">Landscape</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

