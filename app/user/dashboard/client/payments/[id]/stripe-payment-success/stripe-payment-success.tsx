'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  id: string;
  paymentIntent: string;
  paymentIntentClientSecret: string;
}

export default function StripePaymentSuccessPage({
  id,
  paymentIntent,
  paymentIntentClientSecret,
}: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentIntent || !paymentIntentClientSecret) {
      setError('Invalid payment confirmation');
      setLoading(false);
      return;
    }

    const confirmPayment = async () => {
      try {
        const response = await fetch(`/api/payments/${id}/stripe-confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntent,
            paymentIntentClientSecret,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to confirm payment');
        }

        toast({
          description: 'Payment completed successfully!',
        });

        // Clear selected invoices from session storage
        sessionStorage.removeItem('selectedInvoices');
      } catch (error) {
        console.error('Error confirming payment:', error);
        setError('Failed to confirm payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [id, paymentIntent, paymentIntentClientSecret, toast]);

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button asChild>
                <Link href="/user/dashboard/client/invoices">
                  Return to Invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. You can view the payment details in your dashboard.
            </p>
            <div className="space-x-4">
              <Button asChild>
                <Link href={`/user/dashboard/client/payments/${id}`}>
                  View Payment Details
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/user/dashboard/client/invoices">
                  Return to Invoices
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
