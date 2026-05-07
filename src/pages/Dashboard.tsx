import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useInvoices } from '@/hooks/useInvoices';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  FileText, 
  DollarSign, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { getCurrencySymbol } from '@/lib/constants';

// Generate month options for the filter
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
    });
  }
  return options;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { company, isLoading: companyLoading, isReady: companyReady } = useCompany();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Only redirect to settings if we're sure the company data has been fetched and is null
    if (companyReady && !company) {
      navigate('/settings');
    }
  }, [company, companyReady, navigate]);

  // Filter invoices by selected month
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (selectedMonth === 'all') return invoices;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    
    return invoices.filter((invoice) => {
      const issueDate = parseISO(invoice.issue_date);
      return isWithinInterval(issueDate, { start: monthStart, end: monthEnd });
    });
  }, [invoices, selectedMonth]);

  if (authLoading || companyLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter((i) => i.status === 'paid');
  const unpaidInvoices = filteredInvoices.filter((i) => i.status === 'unpaid' || i.status === 'sent');
  const overdueInvoices = filteredInvoices.filter((i) => i.status === 'overdue');
  
  const currency = company?.default_currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  
  const totalPaid = paidInvoices.reduce((sum, i) => sum + Number(i.total), 0);
  const totalUnpaid = unpaidInvoices.reduce((sum, i) => sum + Number(i.total), 0);
  const recentInvoices = filteredInvoices.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Welcome back{company?.name ? `, ${company.name}` : ''}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Here's an overview of your invoicing activity.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link to="/create-invoice" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                All time invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Paid
              </CardTitle>
              <DollarSign className="h-4 w-4 text-status-paid hidden sm:block" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-status-paid truncate">
                {currencySymbol}{totalPaid.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {paidInvoices.length} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Outstanding
              </CardTitle>
              <Clock className="h-4 w-4 text-status-unpaid hidden sm:block" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-status-unpaid truncate">
                {currencySymbol}{totalUnpaid.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {unpaidInvoices.length} unpaid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-status-overdue hidden sm:block" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-status-overdue">
                {overdueInvoices.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base sm:text-lg">Recent Invoices</CardTitle>
            <Link to="/invoices">
              <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3">
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">All</span>
                <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {invoicesLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 sm:h-16" />
                ))}
              </div>
            ) : recentInvoices.length > 0 ? (
              <div className="space-y-2 sm:space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                    className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer active:scale-[0.98] touch-manipulation"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {invoice.client_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="font-medium text-foreground">
                          {currencySymbol}{Number(invoice.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right sm:hidden">
                        <p className="font-medium text-foreground text-sm">
                          {currencySymbol}{Number(invoice.total).toFixed(0)}
                        </p>
                      </div>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No invoices yet</p>
                <Link to="/create-invoice" className="mt-3 sm:mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Create your first invoice
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
