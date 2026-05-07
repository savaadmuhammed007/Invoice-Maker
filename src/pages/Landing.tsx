import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DemoModal } from '@/components/DemoModal';
import { 
  Receipt, 
  FileText,
  Download, 
  Shield, 
  Zap, 
  Globe,
  ArrowRight,
  Check
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Professional Invoices',
    description: 'Create beautiful, branded invoices in minutes with our intuitive editor.',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description: 'Download or print invoices instantly with one click.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and stored securely in the cloud.',
  },
  {
    icon: Zap,
    title: 'Fast & Simple',
    description: 'No complicated setup. Start invoicing in seconds.',
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Support for multiple currencies and tax configurations.',
  },
  {
    icon: Receipt,
    title: 'Track Payments',
    description: 'Monitor invoice status and get paid faster.',
  },
];

const benefits = [
  'Unlimited invoices',
  'Custom branding & logo',
  'Real-time preview',
  'PDF download & print',
  'Tax & discount calculation',
  'Invoice status tracking',
];

export default function Landing() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">InvoPilot</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
              <Button variant="ghost" size="sm" className="sm:hidden px-2">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="px-3 sm:px-4">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient py-12 sm:py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight leading-tight">
              Create Professional{' '}
              <span className="text-primary">Invoices</span>{' '}
              in Seconds
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              The simplest way to create, manage, and track invoices for your business. 
              Beautiful designs, instant PDF downloads, and powerful tracking features.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
                  Start for Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                onClick={() => setDemoOpen(true)}
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Everything You Need
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Powerful features to help you manage your invoicing workflow efficiently.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="invoice-card p-4 sm:p-6 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-accent flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                  Focus on Your Business, Not Paperwork
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                  InvoPilot streamlines your invoicing process so you can spend more time 
                  doing what you love and less time on administrative tasks.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 md:order-2 bg-card rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-elegant border border-border">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted rounded-lg gap-2 sm:gap-0">
                    <span className="text-xs sm:text-sm font-medium">INV-2024-001</span>
                    <span className="status-badge status-paid text-xs w-fit">Paid</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted rounded-lg gap-2 sm:gap-0">
                    <span className="text-xs sm:text-sm font-medium">INV-2024-002</span>
                    <span className="status-badge status-sent text-xs w-fit">Sent</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted rounded-lg gap-2 sm:gap-0">
                    <span className="text-xs sm:text-sm font-medium">INV-2024-003</span>
                    <span className="status-badge status-draft text-xs w-fit">Draft</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-3 sm:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg text-primary-foreground/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Join thousands of businesses using InvoPilot to manage their invoices.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8">
              Create Your First Invoice
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary">
                <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">InvoPilot</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} InvoPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}
