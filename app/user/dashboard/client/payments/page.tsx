/**
 * Client Payments Page Component
 * @module Pages
 * @group Dashboard/Client
 * 
 * This page displays all payments made by the current user in their client role.
 * It shows payment history with details like date, amount, and payment status.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader, Plus } from 'lucide-react';
import Link from 'next/link';

interface Payment {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  paymentMethod: string;
  invoices: {
    id: string;
    invoiceNumber: string;
  }[];
}

export default function PaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/payments');
        if (!response.ok) {
          throw new Error('Failed to fetch payments');
        }
        const data = await response.json();
        setPayments(data.payments);
      } catch (error) {
        toast({
          variant: 'destructive',
          description: 'Failed to load payments',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [toast]);

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Link href="/user/dashboard/client/invoices">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Payment
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold mb-2">
                    Payment #{payment.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">
                      {payment.invoices.length} invoice(s)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                  <p className="text-sm text-gray-500">{payment.paymentMethod}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {payments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No payments found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
