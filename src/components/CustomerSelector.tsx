import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCustomers, type Customer, type CreateCustomerData } from '@/hooks/useCustomers';

interface CustomerSelectorProps {
  onSelect: (customer: Customer | null) => void;
  selectedCustomerId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
}

export function CustomerSelector({
  onSelect,
  selectedCustomerId,
  clientName,
  clientEmail,
  clientPhone,
  clientAddress,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const { customers, isLoading, createCustomer } = useCustomers();

  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);

  const handleSaveCustomer = async () => {
    if (!clientName.trim()) return;

    const customerData: CreateCustomerData = {
      name: clientName.trim(),
      email: clientEmail.trim() || undefined,
      phone: clientPhone.trim() || undefined,
      address: clientAddress.trim() || undefined,
    };

    await createCustomer.mutateAsync(customerData);
    setSaveDialogOpen(false);
  };

  const canSaveCustomer = clientName.trim() && !customers?.some(
    (c) => c.name.toLowerCase() === clientName.trim().toLowerCase()
  );

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
          >
            {selectedCustomer ? selectedCustomer.name : 'Select saved customer...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search customers..." />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup heading="Saved Customers">
                {customers?.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => {
                      onSelect(customer.id === selectedCustomerId ? null : customer);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCustomerId === customer.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      {customer.email && (
                        <span className="text-xs text-muted-foreground">{customer.email}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {selectedCustomerId && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onSelect(null);
                        setOpen(false);
                      }}
                    >
                      <span className="text-muted-foreground">Clear selection</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {canSaveCustomer && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSaveDialogOpen(true)}
          title="Save as new customer"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Save this client as a customer for future invoices?
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{clientName}</span>
              </div>
              {clientEmail && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{clientEmail}</span>
                </div>
              )}
              {clientPhone && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{clientPhone}</span>
                </div>
              )}
              {clientAddress && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <span>{clientAddress}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer} disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Saving...' : 'Save Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
