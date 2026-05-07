import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useInvoices } from '@/hooks/useInvoices';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrencySymbol } from '@/lib/constants';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  paid: 'hsl(142, 76%, 36%)',
  unpaid: 'hsl(48, 96%, 53%)',
  overdue: 'hsl(0, 84%, 60%)',
  sent: 'hsl(217, 91%, 60%)',
  draft: 'hsl(220, 9%, 46%)',
};

export default function Analytics() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { company, isLoading: companyLoading, isReady: companyReady } = useCompany();
  const { invoices, isLoading: invoicesLoading } = useInvoices();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (companyReady && !company) {
      navigate('/settings');
    }
  }, [company, companyReady, navigate]);

  if (authLoading || companyLoading || invoicesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currency = company?.default_currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  // Calculate monthly revenue for the last 6 months
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthInvoices = invoices?.filter((inv) => {
        const invoiceDate = new Date(inv.issue_date);
        return isWithinInterval(invoiceDate, { start, end });
      }) || [];

      const revenue = monthInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.total), 0);

      const outstanding = monthInvoices
        .filter((inv) => inv.status !== 'paid' && inv.status !== 'draft')
        .reduce((sum, inv) => sum + Number(inv.total), 0);

      months.push({
        name: format(date, 'MMM yyyy'),
        revenue,
        outstanding,
        invoices: monthInvoices.length,
      });
    }
    return months;
  };

  // Calculate status distribution
  const getStatusData = () => {
    const statusCounts: Record<string, number> = {
      paid: 0,
      unpaid: 0,
      overdue: 0,
      sent: 0,
      draft: 0,
    };

    invoices?.forEach((inv) => {
      if (statusCounts[inv.status] !== undefined) {
        statusCounts[inv.status]++;
      }
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
      }));
  };

  // Calculate revenue by status
  const getRevenueByStatus = () => {
    const revenueByStatus: Record<string, number> = {
      paid: 0,
      unpaid: 0,
      overdue: 0,
      sent: 0,
      draft: 0,
    };

    invoices?.forEach((inv) => {
      if (revenueByStatus[inv.status] !== undefined) {
        revenueByStatus[inv.status] += Number(inv.total);
      }
    });

    return Object.entries(revenueByStatus)
      .filter(([_, amount]) => amount > 0)
      .map(([status, amount]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        amount,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
      }));
  };

  // Calculate summary stats
  const totalRevenue = invoices?.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0) || 0;
  const totalOutstanding = invoices?.filter((i) => i.status !== 'paid' && i.status !== 'draft').reduce((sum, i) => sum + Number(i.total), 0) || 0;
  const avgInvoiceValue = invoices?.length ? (invoices.reduce((sum, i) => sum + Number(i.total), 0) / invoices.length) : 0;
  const paidRate = invoices?.length ? ((invoices.filter((i) => i.status === 'paid').length / invoices.length) * 100) : 0;

  const monthlyData = getMonthlyData();
  const statusData = getStatusData();
  const revenueByStatus = getRevenueByStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Track your invoicing performance and revenue trends.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-paid">
                {currencySymbol}{totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-unpaid">
                {currencySymbol}{totalOutstanding.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Invoice Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currencySymbol}{avgInvoiceValue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payment Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paidRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Trend */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${currencySymbol}${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, '']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Paid Revenue"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142, 76%, 36%)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="outstanding"
                      name="Outstanding"
                      stroke="hsl(48, 96%, 53%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(48, 96%, 53%)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No invoice data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {revenueByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        type="number"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `${currencySymbol}${value}`}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Amount']}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {revenueByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No invoice data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Invoice Count */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Monthly Invoice Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="invoices" 
                      name="Invoices Created"
                      fill="hsl(217, 91%, 60%)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
