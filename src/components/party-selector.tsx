
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Leaf, ShoppingCart, Users, Handshake } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const PARTY_STORAGE_PREFIX = 'party-';

type Party = {
  id: string;
  name: string;
  type: 'Grower' | 'Customer' | 'Both' | 'Outside Party';
};

type PartyTypeFilter = 'all' | 'grower' | 'customer' | 'outside';

const defaultGrowers: { name: string, address: string }[] = [
    { name: 'AB. Majeed Lone S/P', address: 'R/o Nadihal Bla.' },
    { name: 'AB. Salaam Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ayoub Khan', address: 'R/o Nadihal Bla.' },
    { name: 'Nazir Ahmad Dar (Happa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Maqbool Dar (Happa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmad Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Manzoor Ahmad Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Naseer Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohd. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohd. Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'Nazir Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Maqbool Baigh', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Ahangar', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Tanveer Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Arif Lone (Uffa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Subhan Parry', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (Potty)', address: 'R/o Nadihal Bla.' },
    { name: 'Majoor Ahmad Lone ®', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Jaana ® B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Rayees Rajab ®', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Lone', address: 'R/o Nadihal Bla.' },
    { name: 'Hilal Ahmad Wani', address: 'R/o Nadihal Bla.' },
    { name: 'Javid Ahmad Sheikh', address: 'R/o Shanoo, Mawer Handwara' },
    { name: 'Manzoor Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ashraf wani', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone (Waza)', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Wani', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone ®', address: 'R/o Nadihal Baramulla' },
    { name: 'Bashir Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (H)', address: 'R/o Nadihal Bla.' }
];

const normalizeName = (name: string): string => {
    if (!name) return '';
    return name
        .toUpperCase()
        .replace(/R\/O.*$/i, '')
        .replace(/\(.*\)/, '')
        .replace(/\b(MOHAMMAD|MOHD|MD|GH\.)\b/g, 'MOHAMMAD')
        .replace(/\b(AHMAD|AH)\b/g, 'AHMAD')
        .replace(/S\/P|B\/P|K\/P|®|\(R\)/g, '')
        .replace(/[\.\,\']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const PartyIcon = ({ type }: { type: Party['type'] }) => {
    if (type === 'Grower') return <Leaf className="h-4 w-4 mr-2 text-green-500" />;
    if (type === 'Customer') return <ShoppingCart className="h-4 w-4 mr-2 text-blue-500" />;
    if (type === 'Outside Party') return <Handshake className="h-4 w-4 mr-2 text-orange-500" />;
    return <Users className="h-4 w-4 mr-2 text-purple-500" />;
};


interface PartySelectorProps {
    value: string;
    onChange: (value: string) => void;
    filter?: PartyTypeFilter;
    disabled?: boolean;
}

export function PartySelector({ value, onChange, filter = 'all', disabled = false }: PartySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [parties, setParties] = React.useState<Party[]>([]);

  React.useEffect(() => {
    const loadedParties: {[key: string]: Party} = {};

    defaultGrowers.forEach(g => {
        const normalized = normalizeName(g.name);
        if (!loadedParties[normalized]) {
            loadedParties[normalized] = { ...g, id: `${PARTY_STORAGE_PREFIX}${normalized}`, type: 'Grower' };
        }
    });
    
    const transactionCounts: {[key: string]: {sales: number, purchases: number, expenses: number}} = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith(PARTY_STORAGE_PREFIX)) {
        const party = JSON.parse(localStorage.getItem(key)!);
        const normalized = normalizeName(party.name);
        if (!loadedParties[normalized]) {
            loadedParties[normalized] = party;
        }
      }

      let partyName: string | undefined;
      let isSale = false;
      let isPurchase = false;
      let isExpense = false;

      if (key.startsWith('invoice-')) {
          const doc = JSON.parse(localStorage.getItem(key)!);
          partyName = doc.customerName;
          isSale = true;
      } else if (key.startsWith('purchase-') || key.startsWith('challan-')) {
          const doc = JSON.parse(localStorage.getItem(key)!);
          partyName = doc.growerName || doc.toMs;
          isPurchase = true;
      } else if (key.startsWith('advance-')) {
          const doc = JSON.parse(localStorage.getItem(key)!);
          partyName = doc.partyName;
          if(doc.type === 'Advance Given') isPurchase = true; else isSale = true;
      } else if (key.startsWith('expense-')) {
          const doc = JSON.parse(localStorage.getItem(key)!);
          if (doc.partyName) {
              partyName = doc.partyName;
              isExpense = true;
          }
      }
      
      if(partyName) {
          const normalized = normalizeName(partyName);
          if (!transactionCounts[normalized]) transactionCounts[normalized] = { sales: 0, purchases: 0, expenses: 0 };
          if(isSale) transactionCounts[normalized].sales++;
          if(isPurchase) transactionCounts[normalized].purchases++;
          if(isExpense) transactionCounts[normalized].expenses++;
          
          if (!loadedParties[normalized]) {
               loadedParties[normalized] = {
                  id: `${PARTY_STORAGE_PREFIX}${normalized}`,
                  name: partyName,
                  type: 'Grower'
              };
          }
      }
    }
    
    Object.keys(loadedParties).forEach(normalized => {
        const counts = transactionCounts[normalized];
        const party = loadedParties[normalized];

        if (party.type && party.type !== 'Grower') return; // Do not override manual setting

        if (counts) {
            const hasSales = counts.sales > 0;
            const hasPurchases = counts.purchases > 0;
            const hasExpenses = counts.expenses > 0;
            
            if (hasSales && hasPurchases) party.type = 'Both';
            else if (hasSales) party.type = 'Grower';
            else if (hasPurchases) party.type = 'Customer';
            else if (hasExpenses) party.type = 'Outside Party';
        }
    });
    
    const allPartiesList = Object.values(loadedParties).sort((a,b) => a.name.localeCompare(b.name));
    
    const filtered = allPartiesList.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'grower') return p.type === 'Grower' || p.type === 'Both';
        if (filter === 'customer') return p.type === 'Customer' || p.type === 'Both' || p.type === 'Outside Party'; // Let customers also be outside parties
        if (filter === 'outside') return p.type === 'Outside Party' || p.type === 'Customer' || p.type === 'Both'; // Let outside parties be customers
        return false;
    });

    setParties(filtered);

  }, [filter]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? parties.find((party) => party.name.toLowerCase() === value.toLowerCase())?.name
            : "Select party..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search party..." />
          <CommandList>
            <CommandEmpty>No party found.</CommandEmpty>
            <CommandGroup>
              {parties.map((party) => (
                <CommandItem
                  key={party.id}
                  value={party.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : party.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === party.name.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <PartyIcon type={party.type} />
                  {party.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
