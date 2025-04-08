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

export async function saveAssessmentData(
  businessId: string,
  category: string,
  data: {
    questions: Array<{
      text: string;
      score: number;
      note: string;
    }>;
  }
) {
  try {
    console.log('Saving assessment data:', { businessId, category, data });
    
    // Calculate average score for the category
    const totalScore = data.questions.reduce((sum, q) => sum + q.score, 0);
    const averageScore = data.questions.length > 0 ? totalScore / data.questions.length : 0;
    
    // Format notes and scores as a JSON object for storage
    const notes = data.questions.map(q => q.note).filter(note => note.trim() !== '');
    const scores = data.questions.map(q => q.score);
    
    // Create a JSON object with both notes and scores
    const assessmentData = {
      notes: notes,
      scores: scores
    };
    
    const description = JSON.stringify(assessmentData);
    console.log('Saving to database:', { description, averageScore });
    
    const assessment = await prisma.assessment.upsert({
      where: {
        businessId_name: {
          businessId,
          name: category,
        },
      },
      update: {
        score: averageScore,
        description,
      },
      create: {
        businessId,
        name: category,
        score: averageScore,
        description,
      },
    });

    console.log('Saved assessment:', assessment);
    revalidatePath('/admin/dvcp/assessments');
    return { success: true, assessment };
  } catch (error) {
    console.error('Failed to save assessment data:', error);
    return { success: false, error: 'Failed to save assessment data' };
  }
}

export async function loadAssessmentData(
  businessId: string,
  category: string
) {
  try {
    console.log('Loading assessment data:', { businessId, category });
    
    const assessment = await prisma.assessment.findUnique({
      where: {
        businessId_name: {
          businessId,
          name: category,
        },
      },
    });

    console.log('Loaded assessment:', assessment);
    
    if (!assessment) {
      return { success: true, assessment: null };
    }
    
    return { success: true, assessment };
  } catch (error) {
    console.error('Failed to load assessment data:', error);
    return { success: false, error: 'Failed to load assessment data' };
  }
} 