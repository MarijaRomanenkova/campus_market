/**
 * Purchase Receipt Email Template
 * @module Email/Templates
 * 
 * This component renders an HTML email template for purchase receipts.
 * It displays payment details, invoice information, and total amounts in a formatted email.
 */

import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { Payment } from '@/types';
import { formatCurrency } from '@/lib/utils';

// Sample data for previewing the email template
PurchaseReceiptEmail.PreviewProps = {
  payment: {
    id: 'PAYMENT-123',
    createdAt: new Date(),
    isPaid: true,
    paidAt: new Date(),
    totalPrice: '100',
    taxPrice: '0',
    paymentMethod: 'PayPal',
    invoices: [
      {
        id: 'INV-123',
        invoiceNumber: 'INV-123',
        totalPrice: 100,
        client: {
          name: 'John Doe'
        }
      }
    ],
    user: {
      name: 'John Doe',
      email: 'test@test.com'
    },
    paymentResult: {
      id: 'TR-123',
      status: 'succeeded',
      amount: '100',
      email_address: 'test@test.com',
      created_at: new Date().toISOString()
    }
  }
} satisfies PaymentInformationProps;

// Date formatter for displaying dates in a consistent format
const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

/**
 * Props for the PurchaseReceiptEmail component
 * @interface PaymentInformationProps
 * @property {Payment} payment - Payment object containing all details needed for the receipt
 */
type PaymentInformationProps = {
  payment: Payment;
};

/**
 * Purchase Receipt Email Component
 * 
 * Renders a responsive HTML email template for payment receipts with:
 * - Payment ID and date information
 * - List of invoices included in the payment
 * - Subtotal and total amount calculations
 * 
 * @param {PaymentInformationProps} props - Component properties
 * @returns {JSX.Element} The rendered email template
 */
export default function PurchaseReceiptEmail({ payment }: PaymentInformationProps) {
  return (
    <Html>
      <Preview>View order receipt</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>Purchase Receipt</Heading>
            <Section>
              <Row>
                <Column>
                  <Text className='mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap'>
                    Order ID
                  </Text>
                  <Text className='mt-0 mr-4'>{payment.id.toString()}</Text>
                </Column>
                <Column>
                  <Text className='mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap'>
                    Purchase Date
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {dateFormatter.format(payment.createdAt)}
                  </Text>
                </Column>
                <Column>
                  <Text className='mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap'>
                    Price Paid
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {formatCurrency(Number(payment.totalPrice))}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section className='border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4'>
              {payment.invoices.map((invoice) => (
                <Row key={invoice.id} className='mt-8'>
                 
                  <Column className='align-top'>
                    {invoice.invoiceNumber}
                  </Column>
                  <Column align='right' className='align-top'>
                    {formatCurrency(Number(invoice.totalPrice))}
                  </Column>
                </Row>
              ))}
              {[
                { name: 'Subtotal', price: payment.totalPrice },
                { name: 'Total', price: payment.totalPrice },
              ].map(({ name, price }) => (
                <Row key={name} className='py-1'>
                  <Column align='right'>{name}: </Column>
                  <Column align='right' width={70} className='align-top'>
                    <Text className='m-0'>{formatCurrency(Number(price))}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
