import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MetricType } from "@prisma/client";

export async function saveMetric(businessId: string, metric: {
  name: string;
  description?: string;
  type: MetricType;
  isClientRequested: boolean;
  value?: string;
}) {
  try {
    const savedMetric = await prisma.metric.create({
      data: {
        businessId,
        name: metric.name,
        description: metric.description,
        type: metric.type || 'TEXT',
        isClientRequested: metric.isClientRequested,
        value: metric.value,
      },
    });

    revalidatePath(`/admin/business-details/${businessId}`);
    return { success: true, metric: savedMetric };
  } catch (error) {
    console.error('Failed to save metric:', error);
    return { success: false, error: 'Failed to save metric' };
  }
}

export async function updateMetric(metricId: string, businessId: string, data: {
  name?: string;
  description?: string;
  type?: MetricType;
  isClientRequested?: boolean;
  value?: string;
}) {
  try {
    const updatedMetric = await prisma.metric.update({
      where: { id: metricId },
      data
    });

    revalidatePath(`/admin/business-details/${businessId}`);
    return { success: true, metric: updatedMetric };
  } catch (error) {
    console.error('Failed to update metric:', error);
    return { success: false, error: 'Failed to update metric' };
  }
}

export async function deleteMetric(metricId: string, businessId: string) {
  try {
    await prisma.metric.delete({
      where: { id: metricId }
    });

    revalidatePath(`/admin/business-details/${businessId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete metric:', error);
    return { success: false, error: 'Failed to delete metric' };
  }
}

// Function to create default metrics for a business
export async function createDefaultMetrics(businessId: string) {
  const defaultMetrics = [
    {
      name: 'Monthly Revenue',
      description: 'Total revenue for the month',
      type: 'NUMBER' as MetricType,
      isClientRequested: true,
    },
    {
      name: 'Customer Acquisition Cost',
      description: 'Average cost to acquire a new customer',
      type: 'NUMBER' as MetricType,
      isClientRequested: true,
    },
    {
      name: 'Churn Rate',
      description: 'Monthly customer churn rate',
      type: 'NUMBER' as MetricType,
      isClientRequested: true,
    }
  ];

  try {
    const metrics = await Promise.all(
      defaultMetrics.map(metric => 
        prisma.metric.create({
          data: {
            ...metric,
            businessId,
          }
        })
      )
    );

    revalidatePath(`/admin/business-details/${businessId}`);
    return { success: true, metrics };
  } catch (error) {
    console.error('Failed to create default metrics:', error);
    return { success: false, error: 'Failed to create default metrics' };
  }
} 