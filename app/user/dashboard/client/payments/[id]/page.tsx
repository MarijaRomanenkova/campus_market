'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Payment } from '@/types';
import { useTransition } from 'react';
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useTheme } from 'next-themes';
import { Loader } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { theme, systemTheme } = useTheme();
  const session = useSession();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    
    resolveParams();
  }, [params]);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/payments/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch payment details');
        }
        const data = await response.json();
        setPayment(data);

        if (data.paymentMethod === 'Stripe' && !data.isPaid) {
          const intentResponse = await fetch(`/api/payments/${id}/stripe-intent`, {
            method: 'POST',
          });
          if (!intentResponse.ok) {
            throw new Error('Failed to create Stripe payment intent');
          }
          const intentData = await intentResponse.json();
          setStripeClientSecret(intentData.clientSecret);
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
        toast({
          variant: 'destructive',
          description: 'Failed to load payment details',
        });
        router.push('/user/dashboard/client/invoices');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id, router, toast]);

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
  );

  const StripePaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements || !payment) return;

      setIsLoading(true);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/dashboard/client/payments/${payment.id}/stripe-payment-success`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred');
      }

      setIsLoading(false);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="text-destructive">{errorMessage}</div>
        )}
        <PaymentElement />
        <Button
          type="submit"
          className="w-full"
          disabled={!stripe || !elements || isLoading}
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin mr-2" />
          ) : (
            `Pay ${formatCurrency(Number(payment?.totalPrice) || 0)}`
          )}
        </Button>
      </form>
    );
  };

  const PayPalPaymentButtons = () => {
    const [{ isPending }] = usePayPalScriptReducer();

    if (isPending) {
      return <div className="text-center py-4">Loading PayPal...</div>;
    }

    return (
      <PayPalButtons
        createOrder={async () => {
          if (!payment) {
            throw new Error('Payment not available');
          }

          const response = await fetch(`/api/payments/${payment.id}/paypal-create`, {
            method: 'POST',
          });

          if (!response.ok) {
            const errorData = await response.json();
            toast({
              variant: 'destructive',
              description: errorData.message || 'Failed to create PayPal order',
            });
            throw new Error('Failed to create PayPal order');
          }

          const data = await response.json();
          return data.id;
        }}
        onApprove={async (data) => {
          if (!payment) {
            throw new Error('Payment not available');
          }

          await fetch(`/api/payments/${payment.id}/paypal-capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: data.orderID,
            }),
          });

          toast({
            description: 'Payment completed successfully!',
          });

          router.push(`/user/dashboard/client/payments/${payment.id}`);
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Not Found</h1>
              <p className="text-gray-600 mb-6">
                The payment you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
              <Button onClick={() => router.push('/user/dashboard/client/invoices')}>
                Return to Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Payment {formatId(payment.id)}</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Payment Details</h2>
                <Badge variant={payment.isPaid ? 'paid' : 'unpaid'}>
                  {payment.isPaid
                    ? `Paid at ${formatDateTime(payment.paidAt!)}`
                    : 'Not paid'}
                </Badge>
              </div>

              <div className="space-y-2">
                <p>
                  <span className="font-medium">Created:</span>{' '}
                  {formatDateTime(payment.createdAt)}
                </p>
                <p>
                  <span className="font-medium">Payment Method:</span>{' '}
                  {payment.paymentMethod}
                </p>
                <p>
                  <span className="font-medium">User:</span> {payment.user.name}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Invoices</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Invoice #</th>
                      <th className="text-left py-2">Client</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b">
                        <td className="py-2">{invoice.invoiceNumber}</td>
                        <td className="py-2">{invoice.client.name}</td>
                        <td className="py-2 text-right">
                          {formatCurrency(invoice.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Payment Summary</h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(payment.totalPrice))}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(Number(payment.totalPrice))}</span>
                </div>
              </div>

              {!payment.isPaid && (
                <div className="space-y-4 mt-6">
                  {payment.paymentMethod === 'Stripe' && stripeClientSecret && (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: stripeClientSecret,
                        appearance: {
                          theme:
                            theme === 'dark'
                              ? 'night'
                              : theme === 'light'
                              ? 'stripe'
                              : systemTheme === 'light'
                              ? 'stripe'
                              : 'night',
                        },
                      }}
                    >
                      <StripePaymentForm />
                    </Elements>
                  )}

                  {payment.paymentMethod === 'PayPal' && (
                    <PayPalScriptProvider
                      options={{
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb',
                        components: 'buttons',
                        currency: 'USD',
                      }}
                    >
                      <PayPalPaymentButtons />
                    </PayPalScriptProvider>
                  )}

                  {session.data?.user?.role === 'admin' && (
                    <Button
                      className="w-full"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            const response = await fetch(
                              `/api/payments/${payment.id}/mark-paid`,
                              {
                                method: 'POST',
                              }
                            );

                            if (!response.ok) {
                              throw new Error('Failed to mark payment as paid');
                            }

                            toast({
                              description: 'Payment marked as paid',
                            });

                            router.refresh();
                          } catch (error) {
                            console.error('Error marking payment as paid:', error);
                            toast({
                              variant: 'destructive',
                              description: 'Failed to mark payment as paid',
                            });
                          }
                        });
                      }}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
