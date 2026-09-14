import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable/index';
import GoogleIcon from '@/components/auth/GoogleIcon';

const SignupPage = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error('Could not sign up with Google. Please try again.');
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = '/app';
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><GraduationCap className="h-10 w-10 text-primary" /></div>
          <CardTitle className="font-display text-2xl">Create your account</CardTitle>
          <CardDescription>Start planning your transfer today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="w-full h-11 gap-3 text-base"
          >
            <GoogleIcon className="h-5 w-5" />
            {loading ? 'Opening Google...' : 'Continue with Google'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
