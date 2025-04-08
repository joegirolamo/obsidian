'use client';

import { useParams } from 'next/navigation';
import MetricWorkbook from '@/components/MetricWorkbook';

export default function MetricWorkbookPage() {
  const { businessId } = useParams() as { businessId: string };

  return <MetricWorkbook />;
} 