import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBusinessById, getBusinessAnalysis } from '@/app/actions/business';
import { getBusinessGoalsAction, getBusinessKPIsAction, getBusinessMetricsAction } from '@/app/actions/serverActions';

export async function GET(
  request: Request,
  context: { params: { businessId: string } }
) {
  try {
    // Get businessId from params in the recommended async way
    const { businessId } = await context.params;
    
    // Fetch business data 
    const businessResult = await getBusinessById(businessId);
    
    if (!businessResult.success || !businessResult.business) {
      return NextResponse.json(
        { error: businessResult.error || 'Business not found' },
        { status: 404 }
      );
    }

    const business = businessResult.business;

    // Get website analysis data if available
    let websiteAnalysis = null;
    try {
      const analysisResult = await getBusinessAnalysis(businessId);
      if (analysisResult.success && analysisResult.analysis) {
        websiteAnalysis = {
          businessModel: analysisResult.analysis.businessModel,
          productOffering: analysisResult.analysis.productOffering,
          valuePropositions: analysisResult.analysis.valuePropositions,
          differentiationHighlights: analysisResult.analysis.differentiationHighlights
        };
      }
    } catch (error) {
      console.warn('Error fetching website analysis:', error);
    }

    // Get business goals and simplify structure
    const goalsResult = await getBusinessGoalsAction(businessId);
    const goals = goalsResult.success 
      ? goalsResult.goals.map(goal => ({
          name: goal.name,
          description: goal.description,
          status: goal.status,
          targetDate: goal.targetDate
        }))
      : [];

    // Get business KPIs and simplify structure
    const kpisResult = await getBusinessKPIsAction(businessId);
    const kpis = kpisResult.success 
      ? kpisResult.kpis.map(kpi => ({
          name: kpi.name,
          description: kpi.description,
          target: kpi.target,
          current: kpi.current,
          unit: kpi.unit
        }))
      : [];

    // Get business metrics and simplify structure
    const metricsResult = await getBusinessMetricsAction(businessId);
    const metrics = metricsResult.success && metricsResult.metrics
      ? metricsResult.metrics.map(metric => ({
          name: metric.name,
          description: metric.description,
          type: metric.type,
          value: metric.value,
          target: metric.target,
          benchmark: metric.benchmark
        }))
      : [];

    // Try to get opportunities
    let opportunities = [];
    try {
      const opps = await prisma.opportunity.findMany({
        where: { businessId }
      });
      opportunities = opps.map(opp => ({
        title: opp.title,
        description: opp.description,
        status: opp.status,
        category: opp.category
      }));
    } catch (error) {
      console.warn('Error fetching opportunities:', error);
    }

    // Try to get intake questions and answers
    let questionsWithAnswers = [];
    try {
      // Get all questions for the business
      const questions = await prisma.intakeQuestion.findMany({
        where: { businessId }
      });
      
      // Get all answers for this business's questions
      if (questions.length > 0) {
        const questionIds = questions.map(q => q.id);
        const allAnswers = await prisma.intakeAnswer.findMany({
          where: { 
            questionId: { in: questionIds } 
          }
        });
        
        // Match answers to their questions and simplify the structure
        questionsWithAnswers = questions.map(question => {
          const questionAnswers = allAnswers
            .filter(a => a.questionId === question.id)
            .map(a => ({
              answer: a.answer
            }));
          
          return {
            question: question.question,
            type: question.type,
            area: question.area,
            isActive: question.isActive,
            answers: questionAnswers
          };
        });
      }
    } catch (error) {
      console.warn('Error fetching questions or answers:', error);
    }

    // Format the business brain data with the simplified structure
    const businessBrain = {
      business: {
        id: business.id,
        name: business.name,
        industry: business.industry || null,
        website: business.website || null,
        description: business.description || null,
        properties: business.properties || []
      },
      websiteAnalysis,
      goals,
      kpis,
      metrics,
      opportunities,
      questions: questionsWithAnswers
    };

    return NextResponse.json(businessBrain);
  } catch (error) {
    console.error('Error fetching AI Brain data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI Brain data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 