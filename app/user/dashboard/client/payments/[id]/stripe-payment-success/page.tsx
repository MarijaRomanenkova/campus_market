import StripePaymentSuccessPage from './stripe-payment-success';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    payment_intent?: string;
    payment_intent_client_secret?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { id } = resolvedParams;
  const paymentIntent = resolvedSearchParams.payment_intent;
  const paymentIntentClientSecret = resolvedSearchParams.payment_intent_client_secret;

  return (
    <StripePaymentSuccessPage
      id={id}
      paymentIntent={paymentIntent || ''}
      paymentIntentClientSecret={paymentIntentClientSecret || ''}
    />
  );
} 
