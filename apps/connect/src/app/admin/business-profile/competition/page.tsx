'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, X, AlertCircle, Sparkles, ChevronDown, ChevronRight, GitCompareArrowsIcon } from 'lucide-react';
import { getBusinessById, getBusinessAnalysis, analyzeWebsite, compareBusinesses } from '@/app/actions/business';
import { useSession } from 'next-auth/react';

// Define the sparkle gradient icon as a custom component
const SparkleGradientIcon = ({className}: {className?: string}) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="url(#sparkleGradient)" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
        <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
      </linearGradient>
    </defs>
    <path d="M12 3v18M3 12h18M5.63 5.63l12.73 12.73M18.37 5.63L5.63 18.36" />
  </svg>
);

// Create an inline Spinner component to avoid import issues
function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${className}`}
    ></div>
  );
}

// Simple Toast notification component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 z-50 max-w-md">
      <AlertCircle className="h-5 w-5" />
      <p>{message}</p>
      <button 
        onClick={onClose}
        className="ml-2 text-white hover:text-gray-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface CompetitorData {
  id: string;
  name: string;
  website: string;
  isAnalyzing: boolean;
  isComparing?: boolean;
  analysisData?: {
    description?: string;
    businessModel?: string;
    productOffering?: string;
    valuePropositions?: string[];
    differentiationHighlights?: string[];
  };
  comparisonData?: {
    strengthsVsPrimary?: string[];
    weaknessesVsPrimary?: string[];
    keyDifferences?: string[];
  };
}

// Add a new interface for collapsible section states
interface CollapsibleSections {
  description: boolean;
  businessModel: boolean;
  productOffering: boolean;
  valuePropositions: boolean;
  differentiationHighlights: boolean;
  comparisonInsights: boolean;
}

export default function CompetitionPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  const { data: session } = useSession();
  const [primaryBusiness, setPrimaryBusiness] = useState<CompetitorData | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<CollapsibleSections>({
    description: true,
    businessModel: true,
    productOffering: true,
    valuePropositions: true,
    differentiationHighlights: true,
    comparisonInsights: true
  });
  const [competitorSections, setCompetitorSections] = useState<{[key: string]: CollapsibleSections}>({});
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchBusinessData = useCallback(async () => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      const result = await getBusinessById(businessId);
      
      if (result.success && result.business) {
        const business = result.business;
        
        // Set up primary business
        const primaryData: CompetitorData = {
          id: business.id,
          name: business.name,
          website: business.website || '',
          isAnalyzing: false
        };
        
        // Get existing analysis if available
        const analysisResult = await getBusinessAnalysis(business.id);
        if (analysisResult.success && analysisResult.analysis) {
          primaryData.analysisData = {
            description: business.description || '',
            businessModel: analysisResult.analysis.businessModel,
            productOffering: analysisResult.analysis.productOffering,
            valuePropositions: analysisResult.analysis.valuePropositions,
            differentiationHighlights: analysisResult.analysis.differentiationHighlights
          };
        }
        
        setPrimaryBusiness(primaryData);
      } else {
        setError('Failed to load business data');
      }
    } catch (err) {
      console.error('Error fetching business data:', err);
      setError('An error occurred while loading business data');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      fetchBusinessData();
    } else {
      setLoading(false);
      setError('No business ID provided');
    }
  }, [businessId, fetchBusinessData]);
  
  const addCompetitor = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newCompetitor: CompetitorData = {
      id: newId,
      name: '',
      website: '',
      isAnalyzing: false
    };
    
    setCompetitors([...competitors, newCompetitor]);
    
    // Initialize collapsible sections for the new competitor - all collapsed by default
    setCompetitorSections(prev => ({
      ...prev,
      [newId]: {
        description: true,
        businessModel: true,
        productOffering: true,
        valuePropositions: true,
        differentiationHighlights: true,
        comparisonInsights: true
      }
    }));
    
    // Scroll to the end after component updates
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }, 100);
  };
  
  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter(comp => comp.id !== id));
    
    // Clean up collapsible sections state
    const updatedSections = { ...competitorSections };
    delete updatedSections[id];
    setCompetitorSections(updatedSections);
  };
  
  const updateCompetitor = (id: string, field: 'name' | 'website', value: string) => {
    setCompetitors(competitors.map(comp => 
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };
  
  const analyzeCompetitor = async (id: string) => {
    const competitor = competitors.find(comp => comp.id === id);
    if (!competitor) return;
    
    try {
      setCompetitors(competitors.map(comp => 
        comp.id === id ? { ...comp, isAnalyzing: true } : comp
      ));
      
      console.log('Session data:', session);
      console.log('Analyzing competitor website:', competitor.website);
      
      if (!session?.user?.id) {
        console.error('No user ID available in session');
        setCompetitors(competitors.map(comp => 
          comp.id === id ? { ...comp, isAnalyzing: false } : comp
        ));
        setToast('Authentication error: No user ID available');
        return;
      }
      
      const result = await analyzeWebsite(competitor.website, session.user.id);
      console.log('Analysis result:', result);
      
      if (result.success) {
        setCompetitors(competitors.map(comp => 
          comp.id === id ? { 
            ...comp, 
            isAnalyzing: false,
            analysisData: {
              description: result.description || '',
              businessModel: result.businessModel || '',
              productOffering: result.productOffering || '',
              valuePropositions: result.valuePropositions || [],
              differentiationHighlights: result.differentiationHighlights || []
            }
          } : comp
        ));
      } else {
        setCompetitors(competitors.map(comp => 
          comp.id === id ? { ...comp, isAnalyzing: false } : comp
        ));
        console.error('Analysis failed:', result.error);
        setToast(result.error || 'Failed to analyze website');
      }
    } catch (err) {
      console.error('Error analyzing competitor:', err);
      setCompetitors(competitors.map(comp => 
        comp.id === id ? { ...comp, isAnalyzing: false } : comp
      ));
      setToast('An error occurred during analysis. Please check console for details.');
    }
  };
  
  const analyzePrimaryBusiness = async () => {
    if (!primaryBusiness || !primaryBusiness.website) return;
    
    try {
      setPrimaryBusiness({ ...primaryBusiness, isAnalyzing: true });
      
      console.log('Session data:', session);
      console.log('Analyzing primary business website:', primaryBusiness.website);
      
      if (!session?.user?.id) {
        console.error('No user ID available in session');
        setPrimaryBusiness({ ...primaryBusiness, isAnalyzing: false });
        setToast('Authentication error: No user ID available');
        return;
      }
      
      const result = await analyzeWebsite(primaryBusiness.website, session.user.id);
      console.log('Primary business analysis result:', result);
      
      if (result.success) {
        const updatedBusiness = { 
          ...primaryBusiness, 
          isAnalyzing: false,
          analysisData: {
            description: result.description || '',
            businessModel: result.businessModel || '',
            productOffering: result.productOffering || '',
            valuePropositions: result.valuePropositions || [],
            differentiationHighlights: result.differentiationHighlights || []
          }
        };
        
        setPrimaryBusiness(updatedBusiness);
        
        // Check for competitors with analysis data
        for (const competitor of competitors) {
          if (competitor.analysisData) {
            // Auto-generate comparison for existing analyzed competitors
            getComparisonInsights(competitor.id);
          }
        }
      } else {
        setPrimaryBusiness({ ...primaryBusiness, isAnalyzing: false });
        console.error('Primary business analysis failed:', result.error);
        setToast(result.error || 'Failed to analyze website');
      }
    } catch (err) {
      console.error('Error analyzing primary business:', err);
      setPrimaryBusiness({ ...primaryBusiness, isAnalyzing: false });
      setToast('An error occurred during analysis. Please check console for details.');
    }
  };
  
  const toggleSection = (section: keyof CollapsibleSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCompetitorSection = (competitorId: string, section: keyof CollapsibleSections) => {
    setCompetitorSections(prev => ({
      ...prev,
      [competitorId]: {
        ...prev[competitorId],
        [section]: !prev[competitorId]?.[section]
      }
    }));
  };
  
  const getComparisonInsights = async (competitorId: string) => {
    const competitor = competitors.find(comp => comp.id === competitorId);
    if (!competitor || !competitor.analysisData || !primaryBusiness?.analysisData) return;
    
    try {
      // Mark as comparing
      setCompetitors(competitors.map(comp => 
        comp.id === competitorId ? { ...comp, isComparing: true } : comp
      ));
      
      console.log('Session data:', session);
      
      if (!session?.user?.id) {
        console.error('No user ID available in session');
        setCompetitors(competitors.map(comp => 
          comp.id === competitorId ? { ...comp, isComparing: false } : comp
        ));
        setToast('Authentication error: No user ID available');
        return;
      }
      
      const primaryData = {
        name: primaryBusiness.name,
        description: primaryBusiness.analysisData.description,
        businessModel: primaryBusiness.analysisData.businessModel,
        productOffering: primaryBusiness.analysisData.productOffering,
        valuePropositions: primaryBusiness.analysisData.valuePropositions,
        differentiationHighlights: primaryBusiness.analysisData.differentiationHighlights
      };
      
      const competitorData = {
        name: competitor.name,
        description: competitor.analysisData.description,
        businessModel: competitor.analysisData.businessModel,
        productOffering: competitor.analysisData.productOffering,
        valuePropositions: competitor.analysisData.valuePropositions,
        differentiationHighlights: competitor.analysisData.differentiationHighlights
      };
      
      console.log('Getting comparison insights between', primaryBusiness.name, 'and', competitor.name);
      const result = await compareBusinesses(primaryData, competitorData, session.user.id);
      console.log('Comparison result:', result);
      
      if (result.success) {
        setCompetitors(competitors.map(comp => 
          comp.id === competitorId ? { 
            ...comp, 
            isComparing: false,
            comparisonData: {
              strengthsVsPrimary: result.strengthsVsPrimary,
              weaknessesVsPrimary: result.weaknessesVsPrimary,
              keyDifferences: result.keyDifferences
            }
          } : comp
        ));
      } else {
        setCompetitors(competitors.map(comp => 
          comp.id === competitorId ? { ...comp, isComparing: false } : comp
        ));
        console.error('Comparison failed:', result.error);
        setToast(result.error || 'Failed to generate comparison insights');
      }
    } catch (err) {
      console.error('Error generating comparison insights:', err);
      setCompetitors(competitors.map(comp => 
        comp.id === competitorId ? { ...comp, isComparing: false } : comp
      ));
      setToast('An error occurred during comparison. Please check console for details.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!primaryBusiness) {
    return (
      <div className="text-center p-6">
        <p>No business data available</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-hidden">
      <div className="mb-8 px-6">
        <h1 className="heading-1">Competition Explorer</h1>
        <p className="text-body mt-2">
          Compare multiple businesses to assess differentiation
        </p>
      </div>
      
      <div className="relative overflow-hidden" style={{ zIndex: 5, maxWidth: 'calc(100vw - 280px)' }}>
        <div className="card mb-8">
          <div className="card-body p-6 overflow-hidden">
            <div className="overflow-hidden">
              <div 
                ref={scrollContainerRef} 
                className="flex space-x-4 overflow-x-auto no-scrollbar"
                style={{ 
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* IE and Edge */
                  position: 'relative',
                  zIndex: 10,
                  WebkitOverflowScrolling: 'touch',
                  display: 'flex',
                  flexWrap: 'nowrap',
                  maxWidth: '100%',
                  width: '100%',
                  boxSizing: 'border-box',
                  alignItems: 'flex-start'
                }}
              >
                {/* Hide scrollbar for Chrome, Safari and Opera */}
                <style jsx global>{`
                  .no-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                  .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                `}</style>
                
                {/* Primary Business Column with blue border */}
                <div className="flex-shrink-0 w-64 border-2 border-blue-500 rounded-lg p-4 bg-white shadow-sm self-start relative min-h-[260px] flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold p-1">{primaryBusiness.name}</h3>
                    <p className="text-sm text-gray-500 break-words p-1">{primaryBusiness.website}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Description Section with animation */}
                    <div className="border-b pb-2">
                      <button 
                        onClick={() => toggleSection('description')} 
                        className="w-full flex items-center justify-between text-left"
                      >
                        <h4 className="font-medium text-sm text-gray-700">Description</h4>
                        {collapsedSections.description ? (
                          <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                        )}
                      </button>
                      
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          collapsedSections.description ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                        }`}
                      >
                        <p className="text-sm text-gray-600">
                          {primaryBusiness.analysisData?.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                    
                    {primaryBusiness.analysisData ? (
                      <>
                        {/* Business Model Section with animation */}
                        <div className="border-b pb-2">
                          <button 
                            onClick={() => toggleSection('businessModel')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Business Model</h4>
                            {collapsedSections.businessModel ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              collapsedSections.businessModel ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            <p className="text-sm text-gray-600">
                              {primaryBusiness.analysisData.businessModel || 'Not available'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Product/Service Offering Section with animation */}
                        <div className="border-b pb-2">
                          <button 
                            onClick={() => toggleSection('productOffering')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Product/Service Offering</h4>
                            {collapsedSections.productOffering ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              collapsedSections.productOffering ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            <p className="text-sm text-gray-600">
                              {primaryBusiness.analysisData.productOffering || 'Not available'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Value Propositions Section with animation */}
                        <div className="border-b pb-2">
                          <button 
                            onClick={() => toggleSection('valuePropositions')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Value Propositions</h4>
                            {collapsedSections.valuePropositions ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              collapsedSections.valuePropositions ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            {primaryBusiness.analysisData.valuePropositions && 
                            primaryBusiness.analysisData.valuePropositions.length > 0 ? (
                              <ul className="text-sm list-disc pl-5 space-y-1 text-gray-600">
                                {primaryBusiness.analysisData.valuePropositions.map((prop, idx) => (
                                  <li key={idx}>{prop}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No value propositions available</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Differentiation Highlights Section with animation */}
                        <div className="pb-2">
                          <button 
                            onClick={() => toggleSection('differentiationHighlights')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Differentiation Highlights</h4>
                            {collapsedSections.differentiationHighlights ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              collapsedSections.differentiationHighlights ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            {primaryBusiness.analysisData.differentiationHighlights && 
                            primaryBusiness.analysisData.differentiationHighlights.length > 0 ? (
                              <ul className="text-sm list-disc pl-5 space-y-1 text-gray-600">
                                {primaryBusiness.analysisData.differentiationHighlights.map((highlight, idx) => (
                                  <li key={idx}>{highlight}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No differentiation highlights available</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="flex justify-center items-center flex-grow mt-6">
                          <button
                            className="flex items-center text-sm font-medium gap-1 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                            onClick={analyzePrimaryBusiness}
                            disabled={primaryBusiness.isAnalyzing || !primaryBusiness.website}
                          >
                            {primaryBusiness.isAnalyzing ? (
                              <>
                                <Spinner className="h-4 w-4" /> 
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <SparkleGradientIcon className="h-4 w-4 mr-1" />
                                Analyze
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Competitor Columns - update with animations */}
                {competitors.map(competitor => (
                  <div key={competitor.id} className="flex-shrink-0 w-64 border rounded-lg p-4 pb-0 bg-white relative self-start overflow-visible min-h-[260px] flex flex-col">
                    <button 
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-20"
                      onClick={() => removeCompetitor(competitor.id)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    <div className="mb-4">
                      <input
                        type="text"
                        className="w-full p-1 text-lg font-semibold border-b border-transparent focus:border-gray-300 focus:outline-none"
                        placeholder="Competitor name"
                        value={competitor.name}
                        onChange={(e) => updateCompetitor(competitor.id, 'name', e.target.value)}
                      />
                      <input
                        type="url"
                        className="w-full p-1 text-sm text-gray-500 border-b border-transparent focus:border-gray-300 focus:outline-none"
                        placeholder="Website URL"
                        value={competitor.website}
                        onChange={(e) => updateCompetitor(competitor.id, 'website', e.target.value)}
                      />
                    </div>
                    
                    {competitor.analysisData ? (
                      <div className="space-y-4 flex-grow">
                        {/* Business Model Section with animation */}
                        <div className="border-b pb-2">
                          <button 
                            onClick={() => toggleCompetitorSection(competitor.id, 'businessModel')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Business Model</h4>
                            {competitorSections[competitor.id]?.businessModel ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              competitorSections[competitor.id]?.businessModel ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            <p className="text-sm text-gray-600">
                              {competitor.analysisData.businessModel || 'Not available'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Product/Service Offering Section with animation */}
                        <div className="border-b pb-2">
                          <button 
                            onClick={() => toggleCompetitorSection(competitor.id, 'productOffering')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Product/Service Offering</h4>
                            {competitorSections[competitor.id]?.productOffering ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              competitorSections[competitor.id]?.productOffering ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            <p className="text-sm text-gray-600">
                              {competitor.analysisData.productOffering || 'Not available'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Value Propositions Section with animation */}
                        <div className="border-b pb-2">
                          <button 
                            onClick={() => toggleCompetitorSection(competitor.id, 'valuePropositions')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Value Propositions</h4>
                            {competitorSections[competitor.id]?.valuePropositions ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              competitorSections[competitor.id]?.valuePropositions ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            {competitor.analysisData.valuePropositions && 
                            competitor.analysisData.valuePropositions.length > 0 ? (
                              <ul className="text-sm list-disc pl-5 space-y-1 text-gray-600">
                                {competitor.analysisData.valuePropositions.map((prop, idx) => (
                                  <li key={idx}>{prop}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No value propositions available</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Differentiation Highlights Section with animation */}
                        <div className="pb-2">
                          <button 
                            onClick={() => toggleCompetitorSection(competitor.id, 'differentiationHighlights')} 
                            className="w-full flex items-center justify-between text-left"
                          >
                            <h4 className="font-medium text-sm text-gray-700">Differentiation Highlights</h4>
                            {competitorSections[competitor.id]?.differentiationHighlights ? (
                              <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                            )}
                          </button>
                          
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              competitorSections[competitor.id]?.differentiationHighlights ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'
                            }`}
                          >
                            {competitor.analysisData.differentiationHighlights && 
                            competitor.analysisData.differentiationHighlights.length > 0 ? (
                              <ul className="text-sm list-disc pl-5 space-y-1 text-gray-600">
                                {competitor.analysisData.differentiationHighlights.map((highlight, idx) => (
                                  <li key={idx}>{highlight}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No differentiation highlights available</p>
                            )}
                          </div>
                        </div>

                        {/* Comparison Insights Section */}
                        {competitor.comparisonData ? (
                          <div className="mt-6 mb-4 -mx-4">
                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-lg">
                              <button 
                                onClick={() => toggleCompetitorSection(competitor.id, 'comparisonInsights')} 
                                className="w-full flex items-center justify-between text-left"
                              >
                                <h4 className="font-medium text-sm text-gray-700 flex items-center">
                                  <GitCompareArrowsIcon className="h-4 w-4 mr-1.5 text-blue-500" />
                                  Comparison Insights
                                </h4>
                                {competitorSections[competitor.id]?.comparisonInsights ? (
                                  <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                                )}
                              </button>
                              
                              <div 
                                className={`transition-all duration-300 ease-in-out ${
                                  competitorSections[competitor.id]?.comparisonInsights ? 'max-h-0 opacity-0' : 'max-h-[1200px] opacity-100 mt-2'
                                }`}
                              >
                                {/* Strengths */}
                                {competitor.comparisonData.strengthsVsPrimary && 
                                competitor.comparisonData.strengthsVsPrimary.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-green-600 uppercase mb-1">Strengths vs {primaryBusiness.name}</h5>
                                    <ul className="text-xs list-disc pl-5 space-y-1 text-gray-600">
                                      {competitor.comparisonData.strengthsVsPrimary.map((strength, idx) => (
                                        <li key={idx}>{strength}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Weaknesses */}
                                {competitor.comparisonData.weaknessesVsPrimary && 
                                competitor.comparisonData.weaknessesVsPrimary.length > 0 ? (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-red-600 uppercase mb-1">Weaknesses vs {primaryBusiness.name}</h5>
                                    <ul className="text-xs list-disc pl-5 space-y-1 text-gray-600">
                                      {competitor.comparisonData.weaknessesVsPrimary.map((weakness, idx) => (
                                        <li key={idx}>{weakness}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-red-600 uppercase mb-1">Weaknesses vs {primaryBusiness.name}</h5>
                                    <p className="text-xs text-gray-500 pl-5">No significant weaknesses identified</p>
                                  </div>
                                )}
                                
                                {/* Key Differences */}
                                {competitor.comparisonData.keyDifferences && 
                                competitor.comparisonData.keyDifferences.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-semibold text-blue-600 uppercase mb-1">Key Differences</h5>
                                    <ul className="text-xs list-disc pl-5 space-y-1 text-gray-600">
                                      {competitor.comparisonData.keyDifferences.map((difference, idx) => (
                                        <li key={idx}>{difference}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 mb-4 -mx-4">
                            <div className="bg-gray-50 px-4 py-4 border-t border-gray-200 rounded-b-lg">
                              <button
                                className="flex items-center text-sm font-medium gap-2 w-full justify-center py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                                onClick={() => getComparisonInsights(competitor.id)}
                                disabled={competitor.isComparing}
                              >
                                {competitor.isComparing ? (
                                  <>
                                    <Spinner className="h-4 w-4" /> 
                                    Generating insights...
                                  </>
                                ) : (
                                  <>
                                    <GitCompareArrowsIcon className="h-4 w-4" />
                                    Compare
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="flex justify-center items-center flex-grow mt-6">
                          <button
                            className="flex items-center text-sm font-medium gap-1 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                            onClick={() => analyzeCompetitor(competitor.id)}
                            disabled={competitor.isAnalyzing || !competitor.website}
                          >
                            {competitor.isAnalyzing ? (
                              <>
                                <Spinner className="h-4 w-4" /> 
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <SparkleGradientIcon className="h-4 w-4 mr-1" />
                                Analyze
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add Competitor Button - keep as is */}
                <div className="flex-shrink-0 w-16 flex items-center justify-center sticky right-0 self-start" style={{ zIndex: 20, top: '1rem' }}>
                  <button 
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                    onClick={addCompetitor}
                  >
                    <PlusCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
} 