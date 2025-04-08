'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Image from "next/image";
import { updateAssessmentInsights, publishAssessments, unpublishAssessments, saveAssessmentData, loadAssessmentData } from '@/app/actions/assessment';
import { getBusinessByAdminId } from '@/app/actions/business';
import { useDebounce } from '@/hooks/useDebounce';
import PublishToggle from '@/components/PublishToggle';
import { Slider } from '@/components/ui/slider';

interface Question {
  text: string;
  score: number;
  note: string;
}

interface Category {
  name: string;
  questions: Question[];
}

export default function AssessmentsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const { data: session } = useSession();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    {
      name: 'Brand Strategy',
      questions: [
        { text: 'Do you have defined brand guidelines (e.g. logo use, colors, tone of voice)?', score: 0, note: '' },
        { text: 'Have you clearly identified your brand\'s mission, vision, and values?', score: 0, note: '' },
        { text: 'Do you have a documented brand positioning statement?', score: 0, note: '' },
        { text: 'Do you know who your target audience is and what they care about?', score: 0, note: '' },
        { text: 'Have you developed a unique value proposition (UVP)?', score: 0, note: '' },
        { text: 'Do you consistently apply your brand voice across all channels?', score: 0, note: '' },
        { text: 'Do you regularly track brand awareness or perception in the market?', score: 0, note: '' },
      ],
    },
    {
      name: 'Martech',
      questions: [
        { text: 'Do you have a documented MarTech strategy that aligns with your marketing goals?', score: 0, note: '' },
        { text: 'Do you maintain a current inventory or map of all marketing tools and platforms used?', score: 0, note: '' },
        { text: 'Do you regularly assess whether your marketing tools are integrated and working together effectively?', score: 0, note: '' },
        { text: 'Is your CRM connected with your marketing automation and analytics platforms?', score: 0, note: '' },
        { text: 'Do you have a data governance process for collecting, storing, and using customer data?', score: 0, note: '' },
        { text: 'Do you evaluate the ROI of your marketing tools and platforms?', score: 0, note: '' },
        { text: 'Do you have a team or individual responsible for managing your MarTech stack?', score: 0, note: '' },
        { text: 'Do you use automation tools for campaigns, lead nurturing, or customer segmentation?', score: 0, note: '' },
        { text: 'Are your marketing tools scalable as your business grows?', score: 0, note: '' },
        { text: 'Do you have clear security and compliance standards for your marketing tools?', score: 0, note: '' },
      ],
    },
    {
      name: 'Data & Analytics',
      questions: [
        { text: 'Do you have a documented data and analytics strategy aligned with business goals?', score: 0, note: '' },
        { text: 'Do you know what key metrics or KPIs drive your business performance?', score: 0, note: '' },
        { text: 'Do you have a centralized system or data warehouse for collecting and storing data?', score: 0, note: '' },
        { text: 'Do your teams have access to real-time or regularly updated dashboards and reports?', score: 0, note: '' },
        { text: 'Do you have defined data governance policies?', score: 0, note: '' },
        { text: 'Is your customer data unified across platforms?', score: 0, note: '' },
        { text: 'Do you use analytics to guide business decisions and strategic planning?', score: 0, note: '' },
        { text: 'Do you use predictive or advanced analytics?', score: 0, note: '' },
        { text: 'Do you have dedicated data analysts or a data team supporting your organization?', score: 0, note: '' },
        { text: 'Do you regularly evaluate and improve your data tools and practices?', score: 0, note: '' },
      ],
    },
    {
      name: 'Performance Media',
      questions: [
        { text: 'Do you have specific performance marketing goals?', score: 0, note: '' },
        { text: 'Are you actively running measurable, paid marketing campaigns?', score: 0, note: '' },
        { text: 'Do you track performance marketing metrics in real time or near-real time?', score: 0, note: '' },
        { text: 'Do you use A/B testing or multivariate testing to optimize ad performance?', score: 0, note: '' },
        { text: 'Do you allocate your budget dynamically based on channel or campaign performance?', score: 0, note: '' },
        { text: 'Do you have defined customer acquisition costs (CAC) and lifetime value (LTV) targets?', score: 0, note: '' },
        { text: 'Are pixels and tracking tools correctly set up and maintained?', score: 0, note: '' },
        { text: 'Do you have clear attribution models to track which channels drive results?', score: 0, note: '' },
        { text: 'Do you regularly optimize creative and messaging based on performance data?', score: 0, note: '' },
        { text: 'Do you have internal or external resources dedicated to managing performance marketing?', score: 0, note: '' },
      ],
    },
    {
      name: 'Campaigns',
      questions: [
        { text: 'Do you have a documented process for planning and executing creative campaigns?', score: 0, note: '' },
        { text: 'Do your campaigns align with overall brand strategy and business objectives?', score: 0, note: '' },
        { text: 'Do you define campaign goals and success metrics before launching?', score: 0, note: '' },
        { text: 'Do you conduct audience research to inform your creative concepts and messaging?', score: 0, note: '' },
        { text: 'Do you develop creative concepts across multiple channels?', score: 0, note: '' },
        { text: 'Do you test and iterate creative elements based on performance data?', score: 0, note: '' },
        { text: 'Do you use a content calendar or campaign timeline for planning execution?', score: 0, note: '' },
        { text: 'Do you collaborate across departments when developing campaigns?', score: 0, note: '' },
        { text: 'Do you have a feedback loop or post-mortem process for evaluating creative effectiveness?', score: 0, note: '' },
        { text: 'Do you maintain a library or archive of past creative assets and results?', score: 0, note: '' },
      ],
    },
    {
      name: 'PR & Earned',
      questions: [
        { text: 'Do you have a strategy for gaining media coverage or third-party mentions?', score: 0, note: '' },
        { text: 'Do you maintain relationships with journalists, editors, or media outlets?', score: 0, note: '' },
        { text: 'Do you regularly pitch stories, press releases, or thought leadership to the media?', score: 0, note: '' },
        { text: 'Do you have a process for monitoring earned media mentions and sentiment?', score: 0, note: '' },
        { text: 'Do you measure the reach, engagement, or ROI of earned media placements?', score: 0, note: '' },
        { text: 'Do you have a list of influencers, creators, or thought leaders relevant to your audience?', score: 0, note: '' },
        { text: 'Do you collaborate with influencers or creators to promote your brand or products?', score: 0, note: '' },
        { text: 'Do you provide influencers with creative guidelines, briefs, or messaging frameworks?', score: 0, note: '' },
        { text: 'Do you track influencer performance?', score: 0, note: '' },
        { text: 'Do you have tools or platforms in place for influencer discovery, management, or payments?', score: 0, note: '' },
        { text: 'Do you encourage and amplify organic user-generated content (UGC)?', score: 0, note: '' },
        { text: 'Do you have a process for vetting influencers for brand alignment and audience authenticity?', score: 0, note: '' },
        { text: 'Do you integrate influencer and earned media into broader marketing campaigns?', score: 0, note: '' },
        { text: 'Do you have a crisis or escalation plan in case of negative or controversial mentions?', score: 0, note: '' },
      ],
    },
    {
      name: 'Website',
      questions: [
        { text: 'Do you have a documented strategy for your website tied to business goals?', score: 0, note: '' },
        { text: 'Is your website regularly updated with fresh content?', score: 0, note: '' },
        { text: 'Do you use clear calls to action (CTAs) aligned with user intent throughout the site?', score: 0, note: '' },
        { text: 'Do you track website performance using analytics tools?', score: 0, note: '' },
        { text: 'Is your site optimized for mobile and responsive across devices?', score: 0, note: '' },
        { text: 'Do you run regular audits for SEO, page speed, and accessibility?', score: 0, note: '' },
        { text: 'Is your site structured around clear user journeys and conversion paths?', score: 0, note: '' },
        { text: 'Do you A/B test or optimize pages based on user behavior and performance?', score: 0, note: '' },
        { text: 'Is your website integrated with your CRM, marketing automation, or e-commerce platforms?', score: 0, note: '' },
        { text: 'Do you have clear ownership or a team responsible for website strategy, content, and performance?', score: 0, note: '' },
      ],
    },
    {
      name: 'Digital Product',
      questions: [
        { text: 'Do you have a documented digital product strategy aligned with business goals and customer needs?', score: 0, note: '' },
        { text: 'Have you defined your product\'s value proposition and core use cases?', score: 0, note: '' },
        { text: 'Do you conduct user research or gather customer feedback to inform product decisions?', score: 0, note: '' },
        { text: 'Do you maintain a product roadmap that\'s reviewed and updated regularly?', score: 0, note: '' },
        { text: 'Do you have clear KPIs or success metrics for your product?', score: 0, note: '' },
        { text: 'Do you prioritize features or updates based on user impact and business value?', score: 0, note: '' },
        { text: 'Is your product team cross-functional?', score: 0, note: '' },
        { text: 'Do you use analytics or behavioral data to drive product decisions?', score: 0, note: '' },
        { text: 'Do you test or experiment with features before full rollout?', score: 0, note: '' },
        { text: 'Do you have a process for onboarding, educating, and retaining users?', score: 0, note: '' },
        { text: 'Is your product strategy integrated with marketing, sales, and customer success strategies?', score: 0, note: '' },
      ],
    },
    {
      name: 'Commerce',
      questions: [
        { text: 'Do you have a documented ecommerce strategy tied to revenue and growth goals?', score: 0, note: '' },
        { text: 'Do you sell products or services directly through your website or an ecommerce platform?', score: 0, note: '' },
        { text: 'Do you track and optimize key ecommerce metrics?', score: 0, note: '' },
        { text: 'Do you have a defined customer journey from product discovery to checkout?', score: 0, note: '' },
        { text: 'Is your product catalog optimized for SEO and search on your site?', score: 0, note: '' },
        { text: 'Do you run targeted promotions, sales, or loyalty programs to drive repeat purchases?', score: 0, note: '' },
        { text: 'Is your checkout experience optimized for speed, simplicity, and trust?', score: 0, note: '' },
        { text: 'Do you use marketing automation for abandoned cart recovery, post-purchase emails, or personalized offers?', score: 0, note: '' },
        { text: 'Are you actively testing and improving ecommerce performance with tools like heatmaps or A/B testing?', score: 0, note: '' },
        { text: 'Do you integrate ecommerce data with your CRM, analytics, and fulfillment systems?', score: 0, note: '' },
        { text: 'Do you sell on additional marketplaces as part of your strategy?', score: 0, note: '' },
        { text: 'Do you have a plan for fulfillment, shipping logistics, and inventory management?', score: 0, note: '' },
      ],
    },
    {
      name: 'CRM',
      questions: [
        { text: 'Do you have a documented CRM strategy aligned with customer lifecycle goals?', score: 0, note: '' },
        { text: 'Do you use a CRM platform to manage customer data and interactions?', score: 0, note: '' },
        { text: 'Is your CRM integrated with other key tools?', score: 0, note: '' },
        { text: 'Do you have defined stages or segments for managing leads, prospects, and customers?', score: 0, note: '' },
        { text: 'Do you personalize communications based on CRM data?', score: 0, note: '' },
        { text: 'Do you use CRM data to score leads or prioritize sales outreach?', score: 0, note: '' },
        { text: 'Is your sales, marketing, and customer service activity tracked within the CRM?', score: 0, note: '' },
        { text: 'Do you use automation within your CRM for tasks like follow-ups, onboarding, or re-engagement?', score: 0, note: '' },
        { text: 'Do you maintain data hygiene standards?', score: 0, note: '' },
        { text: 'Do you track and report on CRM-driven performance metrics?', score: 0, note: '' },
        { text: 'Do you have someone (or a team) responsible for managing and optimizing your CRM strategy?', score: 0, note: '' },
      ],
    },
    {
      name: 'App',
      questions: [
        { text: 'Do you have a documented strategy for improving app performance, UX, and engagement?', score: 0, note: '' },
        { text: 'Do you track key app metrics?', score: 0, note: '' },
        { text: 'Do you use analytics tools to monitor in-app behavior?', score: 0, note: '' },
        { text: 'Do you run A/B tests or experiments to optimize features, flows, or UX elements?', score: 0, note: '' },
        { text: 'Is your app regularly updated to improve performance, address bugs, or release new features?', score: 0, note: '' },
        { text: 'Do you gather and act on user feedback through reviews, surveys, or in-app prompts?', score: 0, note: '' },
        { text: 'Is your app store presence optimized?', score: 0, note: '' },
        { text: 'Do you use push notifications or in-app messaging strategically to drive engagement?', score: 0, note: '' },
        { text: 'Do you personalize the app experience based on user data or behavior?', score: 0, note: '' },
        { text: 'Do you have a roadmap or backlog that prioritizes optimization work based on user impact?', score: 0, note: '' },
        { text: 'Do you monitor crash reports, load times, and other technical performance metrics?', score: 0, note: '' },
      ],
    },
    {
      name: 'Organic Social',
      questions: [
        { text: 'Do you have a documented organic social media strategy aligned with business or brand goals?', score: 0, note: '' },
        { text: 'Do you maintain an active presence on platforms where your audience spends time?', score: 0, note: '' },
        { text: 'Do you use a content calendar to plan and schedule posts across channels?', score: 0, note: '' },
        { text: 'Do you create platform-specific content tailored to each channel\'s strengths and audience behavior?', score: 0, note: '' },
        { text: 'Do you track performance metrics?', score: 0, note: '' },
        { text: 'Do you engage with your community regularly?', score: 0, note: '' },
        { text: 'Do you use storytelling, behind-the-scenes, or UGC to build authentic brand presence?', score: 0, note: '' },
        { text: 'Do you collaborate with internal teams to inform social content?', score: 0, note: '' },
        { text: 'Do you analyze post and channel performance to inform future content decisions?', score: 0, note: '' },
        { text: 'Do you test different formats to optimize reach and engagement?', score: 0, note: '' },
        { text: 'Do you have clear brand guidelines for tone, visual style, and voice on social media?', score: 0, note: '' },
      ],
    },
  ]);
  const [activeTab, setActiveTab] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set default active tab to the first category
  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].name);
    }
  }, [categories, activeTab]);

  // Load business data
  useEffect(() => {
    const loadBusiness = async () => {
      if (businessId) {
        setBusiness({ id: businessId });
      }
    };
    loadBusiness();
  }, [businessId]);

  // Load saved assessment data
  useEffect(() => {
    const loadSavedData = async () => {
      if (!businessId) return;
      
      console.log('Loading saved data for business:', businessId);
      setIsLoading(true);
      try {
        // Load saved data for each category
        const savedDataPromises = categories.map(async (category) => {
          console.log('Loading data for category:', category.name);
          const result = await loadAssessmentData(businessId, category.name);
          
          console.log('Load result for category:', category.name, result);
          
          if (result.success && result.assessment) {
            // Parse the saved data from the description field
            let savedNotes: string[] = [];
            let savedScores: number[] = [];
            
            if (result.assessment.description) {
              try {
                const assessmentData = JSON.parse(result.assessment.description);
                console.log('Parsed assessment data:', assessmentData);
                savedNotes = assessmentData.notes || [];
                savedScores = assessmentData.scores || [];
              } catch (e) {
                console.error('Error parsing saved assessment data:', e);
              }
            }
            
            // Update the questions with saved notes and scores
            const updatedQuestions = category.questions.map((q, index) => ({
              ...q,
              note: savedNotes[index] || '',
              score: savedScores[index] || 0
            }));
            
            console.log('Updated questions for category:', category.name, updatedQuestions);
            
            return {
              name: category.name,
              questions: updatedQuestions
            };
          }
          return category;
        });
        
        const updatedCategories = await Promise.all(savedDataPromises);
        console.log('All updated categories:', updatedCategories);
        setCategories(updatedCategories);
        
        // Check if any category has saved data
        const hasSavedData = updatedCategories.some(cat => 
          cat.questions.some(q => q.note || q.score > 0)
        );
        
        if (hasSavedData) {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Error loading saved assessment data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedData();
  }, [businessId]);

  // Add autosave functionality
  const debouncedCategories = useDebounce(categories, 2000);

  useEffect(() => {
    const saveData = async () => {
      if (!businessId || isLoading) return;
      
      console.log('Autosaving data for business:', businessId);
      setIsSaving(true);
      try {
        const activeCategory = categories.find(cat => cat.name === activeTab);
        if (!activeCategory) return;

        console.log('Saving active category:', activeCategory);
        const result = await saveAssessmentData(businessId, activeTab, {
          questions: activeCategory.questions,
        });

        console.log('Autosave result:', result);
        if (result.success) {
          setLastSaved(new Date());
        } else {
          console.error('Failed to auto-save assessment:', result.error);
        }
      } catch (error) {
        console.error('Error auto-saving assessment:', error);
      } finally {
        setIsSaving(false);
      }
    };

    saveData();
  }, [debouncedCategories, activeTab, businessId, isLoading]);

  const handleScoreChange = (categoryIndex: number, questionIndex: number, value: number) => {
    console.log('Score changed:', { categoryIndex, questionIndex, value });
    const newCategories = [...categories];
    newCategories[categoryIndex].questions[questionIndex].score = value;
    console.log('Updated categories:', newCategories);
    setCategories(newCategories);
  };

  const handleNoteChange = (categoryIndex: number, questionIndex: number, value: string) => {
    console.log('Note changed:', { categoryIndex, questionIndex, value });
    const newCategories = [...categories];
    newCategories[categoryIndex].questions[questionIndex].note = value;
    console.log('Updated categories:', newCategories);
    setCategories(newCategories);
  };

  const handleSave = async () => {
    if (!businessId) return;

    console.log('Manual save triggered for business:', businessId);
    const activeCategory = categories.find(cat => cat.name === activeTab);
    if (!activeCategory) return;

    console.log('Saving active category:', activeCategory);
    setIsSaving(true);
    try {
      const result = await saveAssessmentData(businessId, activeTab, {
        questions: activeCategory.questions,
      });

      console.log('Manual save result:', result);
      if (result.success) {
        setLastSaved(new Date());
      } else {
        console.error('Failed to save assessment:', result.error);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      const result = isPublished
        ? await unpublishAssessments(businessId)
        : await publishAssessments(businessId);
      if (result.success) {
        setIsPublished(!isPublished);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error publishing assessments:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const activeCategory = categories.find(cat => cat.name === activeTab);

  // Add click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getScoreColor = (score: number) => {
    // Convert score to a percentage (0-100)
    const percentage = (score / 10) * 100;
    
    // Define color stops
    if (percentage <= 33) {
      return 'text-red-500';
    } else if (percentage <= 66) {
      return 'text-yellow-500';
    } else {
      return 'text-green-500';
    }
  };

  const getSliderColor = (score: number) => {
    // Convert score to a percentage (0-100)
    const percentage = (score / 10) * 100;
    
    // Define color stops
    if (percentage <= 33) {
      return 'bg-red-500';
    } else if (percentage <= 66) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Category Selection Dropdown and Status */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex justify-between items-center">
            <div 
              ref={dropdownRef}
              className="relative inline-block w-full max-w-md"
            >
              <div 
                className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activeTab}
                  </p>
                </div>
                <div className="ml-2">
                  <svg
                    className={`h-5 w-5 text-gray-500 transform transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                          activeTab === category.name 
                            ? 'bg-gray-100 text-primary' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setActiveTab(category.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="truncate">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 ml-4">
              {isLoading ? (
                <span className="text-sm text-gray-500">Loading...</span>
              ) : isSaving ? (
                <span className="text-sm text-gray-500">Saving...</span>
              ) : lastSaved ? (
                <span className="text-sm text-gray-500">
                  Last saved {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
              <PublishToggle
                isPublished={isPublished}
                onToggle={handlePublishToggle}
                isLoading={isPublishing}
              />
            </div>
          </div>
        </div>

        {/* Questions and Scoring */}
        {activeCategory && (
          <div className="space-y-6">
            {activeCategory.questions.map((question, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <p className="text-gray-900 break-words">{question.text}</p>
                      <span className={`font-medium whitespace-nowrap ${getScoreColor(question.score)}`}>
                        {question.score}/10
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <Slider
                          value={[question.score]}
                          onValueChange={(value) => handleScoreChange(
                            categories.findIndex(cat => cat.name === activeTab),
                            index,
                            value[0]
                          )}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <style jsx>{`
                          [data-radix-slider-track] {
                            background-color: #f3f4f6;
                          }
                          [data-radix-slider-range] {
                            background-color: ${question.score <= 3 ? '#ef4444' : question.score <= 6 ? '#eab308' : '#22c55e'};
                          }
                          [data-radix-slider-thumb] {
                            border-color: ${question.score <= 3 ? '#ef4444' : question.score <= 6 ? '#eab308' : '#22c55e'};
                          }
                        `}</style>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>0</span>
                        <span className="flex-1 text-center">5</span>
                        <span>10</span>
                      </div>
                    </div>
                    <div>
                      <textarea
                        className="form-input w-full"
                        placeholder="Add notes (optional)"
                        value={question.note}
                        onChange={(e) => handleNoteChange(
                          categories.findIndex(cat => cat.name === activeTab),
                          index,
                          e.target.value
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 