'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateAssessmentInsights(
  businessId: string,
  category: string,
  insights: string
) {
  try {
    const assessment = await prisma.assessment.upsert({
      where: {
        businessId_name: {
          businessId,
          name: category,
        },
      },
      update: {
        description: insights,
      },
      create: {
        businessId,
        name: category,
        description: insights,
      },
    });

    revalidatePath('/admin/assessments');
    return { success: true, assessment };
  } catch (error) {
    console.error('Failed to update assessment insights:', error);
    return { success: false, error: 'Failed to update assessment insights' };
  }
}

export async function publishAssessments(businessId: string) {
  try {
    await prisma.assessment.updateMany({
      where: { businessId },
      data: { isPublished: true },
    });

    revalidatePath('/admin/assessments');
    return { success: true };
  } catch (error) {
    console.error('Failed to publish assessments:', error);
    return { success: false, error: 'Failed to publish assessments' };
  }
}

export async function unpublishAssessments(businessId: string) {
  try {
    await prisma.assessment.updateMany({
      where: { businessId },
      data: { isPublished: false },
    });

    revalidatePath('/admin/assessments');
    return { success: true };
  } catch (error) {
    console.error('Failed to unpublish assessments:', error);
    return { success: false, error: 'Failed to unpublish assessments' };
  }
} 