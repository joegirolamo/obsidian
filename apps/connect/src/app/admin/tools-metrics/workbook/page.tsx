'use client';

import { useParams } from 'next/navigation';
import MetricWorkbook from '@/components/MetricWorkbook';

export default function MetricRequestsPage() {
  const { businessId } = useParams() as { businessId: string };

  return (
    <MetricWorkbook />
  );
} 