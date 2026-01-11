'use client';

/**
 * Dashboard Charts Component
 * @module Components
 * @group Charts
 * 
 * This client-side component renders payment history charts
 * showing both incoming and outgoing payment trends over time.
 */

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Line } from 'recharts';

/**
 * Props for the Charts component
 * @interface ChartProps
 * @property {Array<{month: string, amount: number}>} incomingData - Monthly incoming payment data
 * @property {Array<{month: string, amount: number}>} outgoingData - Monthly outgoing payment data
 */
type ChartProps = {
  incomingData: { month: string; amount: number; }[];
  outgoingData: { month: string; amount: number; }[];
};

/**
 * Charts Component
 * 
 * Renders a line chart comparing incoming and outgoing payment amounts over time.
 * Formats the data from the incoming and outgoing payment arrays into the format
 * required by the charting library.
 * 
 * @param {ChartProps} props - Component properties
 * @returns {JSX.Element} The rendered chart
 */
export default function Charts({ incomingData, outgoingData }: ChartProps) {
  const data = {
    labels: incomingData.map(item => item.month),
    datasets: [
      {
        label: 'Incoming Payments',
        data: incomingData.map(item => item.amount),
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.1
      },
      {
        label: 'Outgoing Payments',
        data: outgoingData.map(item => item.amount),
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.1
      }
    ]
  };

  return <Line data={data} />;
}
