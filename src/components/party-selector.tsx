

"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Leaf, ShoppingCart, Users, Handshake, PlusCircle } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"


const PARTY_STORAGE_PREFIX = 'party-';

type Party = {
  id: string;
  name: string;
  type: 'Grower' | 'Customer' | 'Both' | 'Outside Party' | 'Both (Outside & Customer)';
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
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
    { name: 'Mohd. Maqbool Baigh', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Ahangar', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Tanveer Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Arif Lone (Uffa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Subhan Parry', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (Potty)', address: 'R/o Nadihal Bla.' },
    { name: 'Majoor Ahmad Lone ®', address: 'R/o Nadihal Bla.' },
    { name: 'Jaana ® B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Rayees Rajab ®', address: 'R/o Nadihal Bla.' },
    { name: 'Hilal Ahmad Wani', address: 'R/o Nadihal Bla.' },
    { name: 'Javid Ahmad Sheikh', address: 'R/o Shanoo, Mawer Handwara' },
    { name: 'Mohd. Ashraf wani', address: 'R/o Nadihal Bla.' },
    { name: 'Bashir Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Lone', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (H)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd Yousuf Lone (Waza)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmed Lone B/P', address: 'R/o Nadihal Bla.'},
    { name: 'Manzoor Ahmad Lone B/P', address: 'R/o Nadihal Bla.'},
    { name: 'Mohd. Yousuf Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Wani', address: 'R/o Nadihal Bla.' }
];


const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};

const PartyIcon = ({ type }: { type: Party['type'] }) => {
    if (type === 'Grower') return <Leaf className="h-4 w-4 mr-2 text-green-500" />;
    if (type === 'Customer') return <ShoppingCart className="h-4 w-4 mr-2 text-blue-500" />;
    if (type === 'Outside Party') return <Handshake className="h-4 w-4 mr-2 text-orange-500" />;
    if (type === 'Both (Outside & Customer)') return <Users className="h-4 w-4 mr-2 text-cyan-500" />;
    return <Users className="h-4 w-4 mr-2 text-purple-500" />;
};

const AddPartyDialog = ({ open, setOpen, onPartyAdded }: { open: boolean, setOpen: (open: boolean) => void, onPartyAdded: (newParty: Party) => void }) => {
    const { toast } = useToast();
    const emptyFormState: Omit<Party, 'id'> = { name: '', type: 'Grower', address: '', phone: '', email: '', notes: '' };
    const [formState, setFormState] = React.useState<Omit<Party, 'id'>>(emptyFormState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
    };
    
    const handleSelectChange = (name: keyof Omit<Party, 'id'>, value: string) => {
        setFormState(prev => ({...prev, [name]: value as Party['type']}));
    };

    const handleSaveParty = () => {
        if (!formState.name) {
            toast({ variant: 'destructive', title: 'Missing Name' });
            return;
        }

        const id = `${PARTY_STORAGE_PREFIX}${getCanonicalName(formState.name)}`;
        const newParty: Party = { id, ...formState };

        localStorage.setItem(id, JSON.stringify(newParty));
        toast({ title: 'Party Added', description: `${newParty.name} has been saved.` });
        
        onPartyAdded(newParty);
        setOpen(false);
        setFormState(emptyFormState);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Party</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Name (M/s)</Label>
                            <Input id="name" name="name" value={formState.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" value={formState.type} onValueChange={(v) => handleSelectChange('type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Grower">Grower (Sells to you)</SelectItem>
                                    <SelectItem value="Customer">Customer (Buys from you)</SelectItem>
                                    <SelectItem value="Both">Both (Grower & Customer)</SelectItem>
                                    <SelectItem value="Outside Party">Outside Party</SelectItem>
                                    <SelectItem value="Both (Outside & Customer)">Both (Outside & Customer)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone / WhatsApp</Label>
                            <Input id="phone" name="phone" value={formState.phone || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" value={formState.address || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" value={formState.notes || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSaveParty}>Save Party</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


interface PartySelectorProps {
    value: string;
    onChange: (value: string) => void;
    filter?: PartyTypeFilter;
    disabled?: boolean;
}

export function PartySelector({ value, onChange, filter = 'all', disabled = false }: PartySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [parties, setParties] = React.useState<Party[]>([]);

  const fetchParties = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const loadedParties: {[key: string]: Party} = {};

    defaultGrowers.forEach(g => {
        const canonical = getCanonicalName(g.name);
        if (!loadedParties[canonical]) {
            loadedParties[canonical] = { ...g, id: `${PARTY_STORAGE_PREFIX}${canonical}`, type: 'Grower' };
        }
    });
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PARTY_STORAGE_PREFIX)) {
        const party = JSON.parse(localStorage.getItem(key)!);
        const canonical = getCanonicalName(party.name);
        // Saved parties should overwrite defaults
        loadedParties[canonical] = party;
      }
    }
    
    const allPartiesList = Object.values(loadedParties).sort((a,b) => a.name.localeCompare(b.name));
    
    const filtered = allPartiesList.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'grower') return p.type === 'Grower' || p.type === 'Both';
        if (filter === 'customer') return p.type === 'Customer' || p.type === 'Both' || p.type === 'Outside Party' || p.type === 'Both (Outside & Customer)';
        if (filter === 'outside') return p.type === 'Outside Party' || p.type === 'Customer' || p.type === 'Both' || p.type === 'Both (Outside & Customer)';
        return false;
    });

    setParties(filtered);
  }, [filter]);

  React.useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const handlePartyAdded = (newParty: Party) => {
      fetchParties();
      onChange(newParty.name);
  };


  return (
    <>
    <AddPartyDialog open={isAddDialogOpen} setOpen={setIsAddDialogOpen} onPartyAdded={handlePartyAdded} />
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
            ? parties.find((party) => party.name === value)?.name
            : "Select party..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search party..." />
          <CommandList>
            <CommandEmpty>
                <Button variant="ghost" className="w-full" onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Party
                </Button>
            </CommandEmpty>
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
                      value === party.name ? "opacity-100" : "opacity-0"
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
    </>
  )
}

    