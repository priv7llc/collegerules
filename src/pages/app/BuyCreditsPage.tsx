import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const products = [
  {
    code: 'single_route',
    name: '1 Transfer Route',
    price: '$10',
    description: 'One route = one community college + one major + one destination university',
    badge: null,
  },
  {
    code: 'five_route_pack',
    name: '5 Transfer Routes',
    price: '$25',
    description: 'Five separate routes. Explore different colleges, majors, or universities.',
    badge: 'BEST VALUE',
    extra: '5 separate dashboards with isolated progress',
  },
];

const features = [
  'Personalized transfer dashboard',
  'Interactive course checklists',
  'Major course tracking with progress',
  'GE/Transfer pattern completion',
  'Term-by-term course sequence',
  'Official resource links',
  'Transfer guide & milestones',
  'Save & return anytime',
];

const BuyCreditsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (productCode: string) => {
    if (!user) return;
    setLoading(productCode);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          product_code: productCode,
          user_id: user.id,
          user_email: user.email,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Buy Route Credits</h1>
        <p className="text-muted-foreground">
          No subscriptions. Buy once and access your dashboards anytime.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => (
          <Card
            key={product.code}
            className={`border-2 relative ${product.badge ? 'border-accent shadow-lg' : 'shadow-md'}`}
          >
            {product.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                {product.badge}
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-xl">{product.name}</CardTitle>
              <div className="text-4xl font-bold text-primary mt-2">{product.price}</div>
              <p className="text-sm text-muted-foreground mt-1">One-time payment</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">{product.description}</p>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
                {product.extra && (
                  <li className="flex items-start gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    {product.extra}
                  </li>
                )}
              </ul>
              <Button
                className="w-full mt-4"
                disabled={loading !== null}
                onClick={() => handleBuy(product.code)}
              >
                {loading === product.code ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening checkout...
                  </>
                ) : (
                  `Buy ${product.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center mt-8 text-xs text-muted-foreground">
        Payments processed securely via Stripe. Always verify requirements with your academic counselor.
      </p>
    </div>
  );
};

export default BuyCreditsPage;
