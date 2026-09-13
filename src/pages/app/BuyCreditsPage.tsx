import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Loader2, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const products = [
  {
    code: 'route_unlock_5pack',
    name: '5 Route Unlocks',
    price: '$3',
    description: 'Unlock every section on any 5 routes. Slots never expire.',
    badge: 'BEST VALUE',
  },
  {
    code: 'route_unlock_unlimited',
    name: 'Unlimited Unlocks',
    price: '$10',
    description: 'Every section on every route you ever create.',
    badge: null,
  },
];

const features = [
  'Affordability & cost gap analysis',
  'Major course requirements',
  'Term-by-term course sequence',
  'Transfer guide & milestones',
  'Official resource links',
  'Progress tracking that saves',
];

const BuyCreditsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');

  const handleBuy = async (productCode: string) => {
    if (!user) return;
    setLoading(productCode);

    try {
      const body: any = {
        product_code: productCode,
        user_id: user.id,
        user_email: user.email,
      };
      if (couponCode.trim()) {
        body.coupon_code = couponCode.trim();
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body,
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      // Navigate the top-level window to Stripe (works in iframes and mobile)
      if (window.top) {
        window.top.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Route Unlocks</h1>
        <p className="text-muted-foreground">
          Creating routes is free. Every route includes a free Overview and GE plan — unlocks open
          Affordability, Major Courses, Course Sequence, Transfer Guide and Resources. No subscriptions.
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
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
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

      <p className="text-center text-sm text-muted-foreground mt-6">
        Want just one route? Open any route dashboard and unlock it there for $1.
      </p>

      <div className="flex items-center gap-2 max-w-sm mx-auto mt-6">
        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="text-sm"
        />
      </div>

      <p className="text-center mt-4 text-xs text-muted-foreground">
        Payments processed securely via Stripe. Always verify requirements with your academic counselor.
      </p>
    </div>
  );
};

export default BuyCreditsPage;
