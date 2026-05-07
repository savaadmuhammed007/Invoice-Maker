import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoicePreview } from './InvoicePreview';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const demoCompany = {
  id: 'demo',
  user_id: 'demo',
  name: 'Acme Design Studio',
  email: 'hello@acmedesign.com',
  phone: '+1 (555) 123-4567',
  address: '123 Creative Avenue',
  city: 'San Francisco',
  postal_code: '94102',
  country: 'United States',
  tax_id: 'US-123456789',
  logo_url: null,
  default_currency: 'USD',
  default_tax_rate: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const demoItems = [
  { id: '1', description: 'Website Redesign', quantity: 1, unit_price: 2500, amount: 2500 },
  { id: '2', description: 'Brand Identity Package', quantity: 1, unit_price: 1500, amount: 1500 },
  { id: '3', description: 'SEO Optimization', quantity: 5, unit_price: 200, amount: 1000 },
];

const demoSubtotal = 5000;
const demoTaxRate = 10;
const demoTaxAmount = 500;
const demoDiscountPercent = 5;
const demoDiscountAmount = 250;
const demoTotal = 5250;

export function DemoModal({ open, onOpenChange }: DemoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl">Demo Invoice Preview</DialogTitle>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            This is a sample invoice showing what you can create with InvoPilot.
          </p>
        </DialogHeader>
        
        <div className="mt-3 sm:mt-4 overflow-x-auto">
          <div className="min-w-[320px]">
            <InvoicePreview
              company={demoCompany}
              invoiceNumber="INV-2024-DEMO"
              clientName="TechCorp Industries"
              clientEmail="billing@techcorp.com"
              clientAddress="456 Innovation Blvd, Suite 200"
              clientPhone="+1 (555) 987-6543"
              issueDate={new Date().toISOString().split('T')[0]}
              dueDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              status="sent"
              items={demoItems}
              subtotal={demoSubtotal}
              taxRate={demoTaxRate}
              taxAmount={demoTaxAmount}
              discountPercent={demoDiscountPercent}
              discountAmount={demoDiscountAmount}
              total={demoTotal}
              currency="USD"
              notes="Thank you for your business! Payment is due within 30 days."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
          <Link to="/auth" className="flex-1">
            <Button className="w-full" size="default">
              Create Your Own Invoice
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="default"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close Demo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
