'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, BarChart2, AlertCircle, Zap, ChevronUp, ChevronDown, X, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components';
import Toggle from './shared/Toggle';
import { 
  publishScorecard, 
  unpublishScorecard, 
  getScorecardPublishStatus,
  updateScorecardCategory,
  getScorecardData,
  initializeScorecards,
  updateScorecardScore
} from '@/app/actions/scorecard';
import { 
  addScorecardHighlight,
  deleteScorecardHighlight,
  updateScorecardHighlight 
} from '@/app/actions/scorecard-update';
import { useSearchParams } from 'next/navigation';
import { Metric } from '@prisma/client';
import ReportManagement from './ReportManagement';

interface Highlight {
  id: string;
  text: string;
  serviceArea: string;
  relatedMetricId?: string; // Optional reference to a metric signal
}

interface MetricSignal {
  id: string;
  name: string;
  value: string;
}

interface ScoreData {
  score: number;
  maxScore: number;
  highlights: Highlight[];
  metricSignals: MetricSignal[];
}

interface BucketData {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  textColor: string;
  serviceAreas: string[];
  data: ScoreData;
}

export default function Scorecard() {
  const [isAddingHighlight, setIsAddingHighlight] = useState<string | null>(null);
  const [isEditingHighlight, setIsEditingHighlight] = useState<string | null>(null);
  const [newHighlight, setNewHighlight] = useState({ 
    text: '', 
    serviceArea: 'Other',
    relatedMetricId: '' 
  });
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Separate loading states for different actions
  const [isSavingHighlight, setIsSavingHighlight] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState<string | null>(null); // Store bucket name being saved
  const [isRunningAudit, setIsRunningAudit] = useState<string | null>(null); // Store bucket name being audited
  const [isRunningFullAudit, setIsRunningFullAudit] = useState(false);
  
  // New state for adding metric signals
  const [isAddingMetricSignal, setIsAddingMetricSignal] = useState<string | null>(null);
  const [newMetricSignal, setNewMetricSignal] = useState({
    name: '',
    value: ''
  });
  
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  
  // Define static buckets with their default values
  const [buckets, setBuckets] = useState<BucketData[]>([
    {
      name: 'Foundation',
      color: '#FFDC00',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      hoverColor: 'hover:bg-yellow-100',
      textColor: 'text-yellow-800',
      serviceAreas: ['Brand/GTM Strategy', 'Martech', 'Data & Analytics'],
      data: { score: 0, maxScore: 100, highlights: [], metricSignals: [] }
    },
    {
      name: 'Acquisition',
      color: '#2ECC40',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
      textColor: 'text-green-800',
      serviceAreas: ['Performance Media', 'Campaigns', 'Earned Media'],
      data: { score: 0, maxScore: 100, highlights: [], metricSignals: [] }
    },
    {
      name: 'Conversion',
      color: '#0074D9',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      textColor: 'text-blue-800',
      serviceAreas: ['Website', 'Ecommerce Platforms', 'Digital Product'],
      data: { score: 0, maxScore: 100, highlights: [], metricSignals: [] }
    },
    {
      name: 'Retention',
      color: '#FF851B',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      textColor: 'text-orange-800',
      serviceAreas: ['CRM', 'App', 'Organic Social'],
      data: { score: 0, maxScore: 100, highlights: [], metricSignals: [] }
    }
  ]);

  // Load data from the database when the component mounts
  useEffect(() => {
    async function loadData() {
      if (!businessId) return;
      
      setIsLoading(true);
      
      try {
        // Check publish status
        const publishStatus = await getScorecardPublishStatus(businessId);
        if (publishStatus.success) {
          setIsPublished(publishStatus.isPublished || false);
        }
        
        // Get scorecard data using the server action
        const result = await getScorecardData(businessId);
        console.log('[DEBUG] Loaded scorecard data from server:', result);
        
        // If no scorecards exist, initialize them
        if (result.success && (!result.scorecards || result.scorecards.length === 0)) {
          console.log('[DEBUG] No scorecards found, initializing...');
          
          // Initialize empty scorecards
          const initResult = await initializeScorecards(businessId);
          console.log('[DEBUG] Initialization result:', initResult);
          
          if (initResult.success) {
            // Re-fetch the data after initialization
            const newResult = await getScorecardData(businessId);
            console.log('[DEBUG] Reloaded scorecard data after initialization:', newResult);
            
            if (newResult.success && newResult.scorecards) {
              updateBucketsFromScorecardsData(newResult.scorecards);
            }
          }
        } else if (result.success && result.scorecards) {
          // Update buckets with existing scorecard data
          updateBucketsFromScorecardsData(result.scorecards);
        }
      } catch (error) {
        console.error('Error loading scorecard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [businessId]);
  
  // Helper function to update buckets from scorecards data
  const updateBucketsFromScorecardsData = (scorecardsData: any[]) => {
    setBuckets(prevBuckets => {
      return prevBuckets.map(bucket => {
        // Find matching scorecard for this bucket
        const scorecard = scorecardsData.find((s: any) => s.category === bucket.name);
        
        if (!scorecard) return bucket;
        
        console.log('[DEBUG] Found data for bucket:', bucket.name, 'Score:', scorecard.score);
        
        // Update the bucket with scorecard data
        return {
          ...bucket,
          data: {
            score: scorecard.score,
            maxScore: scorecard.maxScore,
            highlights: scorecard.highlights || [],
            metricSignals: scorecard.metricSignals || []
          }
        };
      });
    });
  };

  // Create a function to reload data that can be called after changes
  const reloadData = async () => {
    if (!businessId) return;
    
    try {
      const result = await getScorecardData(businessId);
      console.log('[DEBUG] Reloaded scorecard data from server:', result);
      
      if (result.success && result.scorecards) {
        // Update the buckets with the latest data
        setBuckets(prevBuckets => {
          return prevBuckets.map(bucket => {
            // Find matching scorecard for this bucket
            const scorecard = result.scorecards.find((s: any) => s.category === bucket.name);
            
            if (!scorecard) return bucket;
            
            // Update the bucket with latest scorecard data
            return {
              ...bucket,
              data: {
                score: scorecard.score,
                maxScore: scorecard.maxScore,
                highlights: scorecard.highlights || [],
                metricSignals: scorecard.metricSignals || []
              }
            };
          });
        });
      }
    } catch (error) {
      console.error('Error reloading scorecard data:', error);
    }
  };

  const handleAddHighlight = async (bucketName: string) => {
    if (!businessId || !newHighlight.text || !newHighlight.serviceArea) return;
    
    setIsSavingHighlight(true);
    
    // First update the UI optimistically
    const newHighlightObj = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: newHighlight.text,
      serviceArea: newHighlight.serviceArea,
      relatedMetricId: newHighlight.relatedMetricId || undefined
    };
    
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            data: {
              ...bucket.data,
              highlights: [
                ...bucket.data.highlights,
                newHighlightObj
              ]
            }
          };
        }
        return bucket;
      })
    );
    
    try {
      // Get the bucket to save
      const bucket = buckets.find(b => b.name === bucketName);
      if (!bucket) throw new Error('Bucket not found');
      
      // Format data for the server action
      const highlights = bucket.data.highlights.map(h => 
        `- ${h.text} (${h.serviceArea})`
      ).join('\n');
      
      const serviceAreasText = bucket.serviceAreas.join(', ');
      const description = `Service Areas: ${serviceAreasText}\n\nHighlights:\n${highlights}\n- ${newHighlight.text} (${newHighlight.serviceArea})`;
      
      // Include the new highlight in the JSON format if supported
      const highlightsData = {
        items: [
          ...bucket.data.highlights,
          newHighlightObj
        ],
        metricSignals: bucket.data.metricSignals,
        score: bucket.data.score,
        maxScore: bucket.data.maxScore,
        serviceAreas: bucket.serviceAreas
      };
      
      // Save to the database
      await updateScorecardCategory(businessId, {
        name: bucketName,
        score: bucket.data.score,
        highlights: description,
        serviceAreas: bucket.serviceAreas,
        highlightsData
      });
      
      console.log('Successfully saved highlight');
      
      // After server response, reload data to ensure we're showing the latest
      await reloadData();
    } catch (error) {
      console.error('Error saving highlight:', error);
      
      // Restore the previous state in case of error
      // This implementation is simplified and just fetches the current state
      window.location.reload();
    } finally {
      setNewHighlight({ text: '', serviceArea: 'Other', relatedMetricId: '' });
      setIsAddingHighlight(null);
      setIsSavingHighlight(false);
    }
  };

  const handleScoreChange = (bucketName: string, newScore: number) => {
    // Ensure score is within valid range
    const bucket = buckets.find(b => b.name === bucketName);
    if (!bucket) return;
    
    const clampedScore = Math.max(0, Math.min(bucket.data.maxScore, newScore));
    
    // Update buckets state with the new score
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            data: {
              ...bucket.data,
              score: clampedScore
            }
          };
        }
        return bucket;
      })
    );
  };

  // When the input loses focus, save the changes
  const handleScoreInputBlur = async (bucketName: string) => {
    // Find the bucket to save
    const bucket = buckets.find(b => b.name === bucketName);
    if (!bucket || !businessId || isSavingScore === bucketName) return;
    
    try {
      // Set loading state
      setIsSavingScore(bucketName);
      
      // Save the score
      console.log('[DEBUG] Saving score change on blur:', bucket.data.score, 'for bucket:', bucketName);
      
      // Call the score update function directly
      const result = await updateScorecardScore(businessId, bucketName, bucket.data.score);
      
      console.log('[DEBUG] Score update result on blur:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save score');
      }
    } catch (error) {
      console.error('Error saving score on blur:', error);
      
      // Reload data on error
      await reloadData();
    } finally {
      setIsSavingScore(null);
    }
  };

  const handleScoreChangeComplete = async (bucketName: string) => {
    if (!businessId) return;
    
    setIsSavingScore(bucketName);
    
    try {
      // Find the most current bucket state
      const bucket = buckets.find(b => b.name === bucketName);
      if (!bucket) throw new Error('Bucket not found');
      
      console.log('[DEBUG] Saving score:', bucket.data.score, 'for bucket:', bucketName);
      
      // Use the dedicated score update function for better performance
      const result = await updateScorecardScore(businessId, bucketName, bucket.data.score);
      
      console.log('[DEBUG] Quick score update result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save score');
      }
      
      // We don't need to reload all data since we're just updating the score
      // This should make the UI more responsive
    } catch (error) {
      console.error('Error saving score:', error);
      
      // Only reload data on error to ensure UI is in sync with server
      await reloadData();
    } finally {
      setIsSavingScore(null);
    }
  };

  const increaseScore = async (bucketName: string) => {
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket && bucket.data.score < bucket.data.maxScore && isSavingScore !== bucketName) {
      // Calculate the new score
      const newScore = bucket.data.score + 1;
      
      // First update the UI optimistically
      handleScoreChange(bucketName, newScore);
      
      try {
        // Save to server in background without visible loading state
        console.log('[DEBUG] Increasing score to:', newScore, 'for bucket:', bucketName);
        
        // Call updateScorecardScore directly with the new value
        const result = await updateScorecardScore(businessId as string, bucketName, newScore);
        
        if (!result.success) {
          console.error('Error saving increased score:', result.error);
          // Quietly reload data if there was an error
          await reloadData();
        }
      } catch (error) {
        console.error('Error increasing score:', error);
        // Quietly reload data if there was an error
        await reloadData();
      }
    }
  };

  const decreaseScore = async (bucketName: string) => {
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket && bucket.data.score > 0 && isSavingScore !== bucketName) {
      // Calculate the new score
      const newScore = bucket.data.score - 1;
      
      // First update the UI optimistically
      handleScoreChange(bucketName, newScore);
      
      try {
        // Save to server in background without visible loading state
        console.log('[DEBUG] Decreasing score to:', newScore, 'for bucket:', bucketName);
        
        // Call updateScorecardScore directly with the new value
        const result = await updateScorecardScore(businessId as string, bucketName, newScore);
        
        if (!result.success) {
          console.error('Error saving decreased score:', result.error);
          // Quietly reload data if there was an error
          await reloadData();
        }
      } catch (error) {
        console.error('Error decreasing score:', error);
        // Quietly reload data if there was an error
        await reloadData();
      }
    }
  };

  const handleDeleteHighlight = async (bucketName: string, highlightId: string) => {
    if (!businessId) return;
    
    setIsSavingHighlight(true);
    
    // First update the UI optimistically
    const updatedBuckets = [...buckets];
    const bucketIndex = updatedBuckets.findIndex(b => b.name === bucketName);
    
    if (bucketIndex === -1) {
      setIsSavingHighlight(false);
      return;
    }
    
    // Find the bucket and create a copy with the filtered highlights
    const bucket = { ...updatedBuckets[bucketIndex] };
    const updatedHighlights = bucket.data.highlights.filter(h => h.id !== highlightId);
    
    // Update the bucket with filtered highlights
    bucket.data = {
      ...bucket.data,
      highlights: updatedHighlights
    };
    updatedBuckets[bucketIndex] = bucket;
    
    // Update state with the new buckets
    setBuckets(updatedBuckets);
    
    try {
      console.log('[DEBUG] Deleting highlight:', highlightId, 'from bucket:', bucketName);
      
      // Format the updated highlights into a description
      const highlightsText = updatedHighlights.map(h => 
        `- ${h.text} (${h.serviceArea})`
      ).join('\n');
      
      const serviceAreasText = bucket.serviceAreas.join(', ');
      const description = `Service Areas: ${serviceAreasText}\n\nHighlights:\n${highlightsText}`;
      
      // Create the highlight data structure
      const highlightsData = {
        items: updatedHighlights,
        metricSignals: bucket.data.metricSignals,
        score: bucket.data.score,
        maxScore: bucket.data.maxScore,
        serviceAreas: bucket.serviceAreas
      };
      
      // Save to the database
      const result = await updateScorecardCategory(businessId, {
        name: bucketName,
        score: bucket.data.score,
        highlights: description,
        serviceAreas: bucket.serviceAreas,
        highlightsData
      });
      
      console.log('[DEBUG] Delete highlight result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete highlight');
      }
      
      // After server response, reload data to ensure we're showing the latest
      await reloadData();
    } catch (error) {
      console.error('Error deleting highlight:', error);
      
      // Reload data on error to ensure UI is in sync with server
      await reloadData();
    } finally {
      setIsSavingHighlight(false);
    }
  };

  const handleDeleteMetricSignal = async (bucketName: string, signalId: string) => {
    if (!businessId) return;
    
    setIsSavingHighlight(true); // Reuse the same loading state
    
    // First update the UI optimistically
    const updatedBuckets = [...buckets];
    const bucketIndex = updatedBuckets.findIndex(b => b.name === bucketName);
    
    if (bucketIndex === -1) {
      setIsSavingHighlight(false);
      return;
    }
    
    // Find the bucket and create a copy with the filtered metric signals
    const bucket = { ...updatedBuckets[bucketIndex] };
    const updatedMetricSignals = bucket.data.metricSignals.filter(s => s.id !== signalId);
    
    // Update the bucket with filtered metric signals
    bucket.data = {
      ...bucket.data,
      metricSignals: updatedMetricSignals
    };
    updatedBuckets[bucketIndex] = bucket;
    
    // Update state with the new buckets
    setBuckets(updatedBuckets);
    
    try {
      console.log('[DEBUG] Deleting metric signal:', signalId, 'from bucket:', bucketName);
      
      // Format the highlights into a description (unchanged)
      const highlightsText = bucket.data.highlights.map(h => 
        `- ${h.text} (${h.serviceArea})`
      ).join('\n');
      
      const serviceAreasText = bucket.serviceAreas.join(', ');
      const description = `Service Areas: ${serviceAreasText}\n\nHighlights:\n${highlightsText}`;
      
      // Create the highlight data structure with updated metric signals
      const highlightsData = {
        items: bucket.data.highlights,
        metricSignals: updatedMetricSignals,
        score: bucket.data.score,
        maxScore: bucket.data.maxScore,
        serviceAreas: bucket.serviceAreas
      };
      
      // Save to the database
      const result = await updateScorecardCategory(businessId, {
        name: bucketName,
        score: bucket.data.score,
        highlights: description,
        serviceAreas: bucket.serviceAreas,
        highlightsData
      });
      
      console.log('[DEBUG] Delete metric signal result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete metric signal');
      }
      
      // After server response, reload data to ensure we're showing the latest
      await reloadData();
    } catch (error) {
      console.error('Error deleting metric signal:', error);
      
      // Reload data on error to ensure UI is in sync with server
      await reloadData();
    } finally {
      setIsSavingHighlight(false);
    }
  };

  const runAudit = async (bucketName: string) => {
    console.log(`Running AI audit for ${bucketName}`);
    
    // This would be where we call the AI service to generate highlights and metrics
    // For now, we'll simulate by adding some random metrics and highlights
    const bucket = buckets.find(b => b.name === bucketName);
    if (!bucket) return;
    
    setIsRunningAudit(bucketName);
    
    // Sample metric signals based on bucket name
    const newMetricSignals: MetricSignal[] = [];
    // Sample highlights based on bucket name
    const newHighlights: Highlight[] = [];
    
    if (bucketName === 'Foundation') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'Brand Consistency', value: `${Math.floor(Math.random() * 40 + 30)}%` },
        { id: `m${Date.now()}-2`, name: 'Tech Stack Coverage', value: `${Math.floor(Math.random() * 50 + 40)}%` }
      );
      newHighlights.push(
        { 
          id: `h${Date.now()}-1`, 
          text: 'Brand messaging is inconsistent across channels', 
          serviceArea: 'Brand/GTM Strategy'
        },
        { 
          id: `h${Date.now()}-2`, 
          text: 'Analytics implementation is missing key conversion events', 
          serviceArea: 'Data & Analytics'
        }
      );
    } else if (bucketName === 'Acquisition') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'CPC', value: `$${(Math.random() * 5 + 1).toFixed(2)}` },
        { id: `m${Date.now()}-2`, name: 'CAC', value: `$${Math.floor(Math.random() * 100 + 50)}` }
      );
      newHighlights.push(
        { 
          id: `h${Date.now()}-1`, 
          text: 'Paid search campaigns have low quality scores', 
          serviceArea: 'Performance Media'
        },
        { 
          id: `h${Date.now()}-2`, 
          text: 'Social media campaigns lack cohesive messaging', 
          serviceArea: 'Campaigns'
        }
      );
    } else if (bucketName === 'Conversion') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'Conversion Rate', value: `${(Math.random() * 5 + 1).toFixed(1)}%` },
        { id: `m${Date.now()}-2`, name: 'Bounce Rate', value: `${Math.floor(Math.random() * 30 + 40)}%` }
      );
      newHighlights.push(
        { 
          id: `h${Date.now()}-1`, 
          text: 'Checkout process has high abandonment rate', 
          serviceArea: 'Ecommerce Platforms'
        },
        { 
          id: `h${Date.now()}-2`, 
          text: 'Mobile site has poor performance metrics', 
          serviceArea: 'Website'
        }
      );
    } else if (bucketName === 'Retention') {
      newMetricSignals.push(
        { id: `m${Date.now()}-1`, name: 'Churn Rate', value: `${(Math.random() * 5 + 1).toFixed(1)}%` },
        { id: `m${Date.now()}-2`, name: 'LTV', value: `$${Math.floor(Math.random() * 500 + 200)}` }
      );
      newHighlights.push(
        { 
          id: `h${Date.now()}-1`, 
          text: 'Email campaigns have declining open rates', 
          serviceArea: 'CRM'
        },
        { 
          id: `h${Date.now()}-2`, 
          text: 'App retention drops significantly after 30 days', 
          serviceArea: 'App'
        }
      );
    }
    
    // Update the bucket with new metrics and highlights
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            data: {
              ...bucket.data,
              metricSignals: [
                ...bucket.data.metricSignals,
                ...newMetricSignals
              ],
              highlights: [
                ...bucket.data.highlights,
                ...newHighlights
              ]
            }
          };
        }
        return bucket;
      })
    );
    
    try {
      // Save the updated data to the database
      if (businessId) {
        const bucket = buckets.find(b => b.name === bucketName);
        if (!bucket) throw new Error('Bucket not found');
        
        // Format the updated highlights into a description
        const updatedHighlights = [...bucket.data.highlights, ...newHighlights];
        const highlightsText = updatedHighlights.map(h => 
          `- ${h.text} (${h.serviceArea})`
        ).join('\n');
        
        const serviceAreasText = bucket.serviceAreas.join(', ');
        const description = `Service Areas: ${serviceAreasText}\n\nHighlights:\n${highlightsText}`;
        
        // Create the highlight data structure
        const highlightsData = {
          items: updatedHighlights,
          metricSignals: [...bucket.data.metricSignals, ...newMetricSignals],
          score: bucket.data.score,
          maxScore: bucket.data.maxScore,
          serviceAreas: bucket.serviceAreas
        };
        
        // Save to the database
        await updateScorecardCategory(businessId, {
          name: bucketName,
          score: bucket.data.score,
          highlights: description,
          serviceAreas: bucket.serviceAreas,
          highlightsData
        });
      }
      
      // After successful save, reload data to ensure we're showing the latest
      await reloadData();
      alert(`AI audit for ${bucketName} completed. Added ${newMetricSignals.length} new metrics and ${newHighlights.length} new highlights.`);
    } catch (error) {
      console.error(`Error running audit for ${bucketName}:`, error);
      alert(`Error running audit: ${error}`);
    } finally {
      setIsRunningAudit(null);
    }
  };

  const runFullAudit = async () => {
    if (!businessId) return;
    
    setIsRunningFullAudit(true);
    
    try {
      // Run audit for each bucket one by one - but don't use the normal runAudit function
      // to avoid issues with loading state
      for (const bucket of buckets) {
        console.log(`Running full audit for ${bucket.name}`);
        
        // Generate metrics for this bucket (similar to runAudit but without setting loading state)
        // Generate random metrics and highlights for this bucket
        const newMetricSignals: MetricSignal[] = [];
        const newHighlights: Highlight[] = [];
        
        if (bucket.name === 'Foundation') {
          newMetricSignals.push(
            { id: `m${Date.now()}-1`, name: 'Brand Consistency', value: `${Math.floor(Math.random() * 40 + 30)}%` },
            { id: `m${Date.now()}-2`, name: 'Tech Stack Coverage', value: `${Math.floor(Math.random() * 50 + 40)}%` }
          );
          newHighlights.push(
            { 
              id: `h${Date.now()}-1`, 
              text: 'Brand messaging is inconsistent across channels', 
              serviceArea: 'Brand/GTM Strategy'
            },
            { 
              id: `h${Date.now()}-2`, 
              text: 'Analytics implementation is missing key conversion events', 
              serviceArea: 'Data & Analytics'
            }
          );
        } else if (bucket.name === 'Acquisition') {
          newMetricSignals.push(
            { id: `m${Date.now()}-1`, name: 'CPC', value: `$${(Math.random() * 5 + 1).toFixed(2)}` },
            { id: `m${Date.now()}-2`, name: 'CAC', value: `$${Math.floor(Math.random() * 100 + 50)}` }
          );
          newHighlights.push(
            { 
              id: `h${Date.now()}-1`, 
              text: 'Paid search campaigns have low quality scores', 
              serviceArea: 'Performance Media'
            },
            { 
              id: `h${Date.now()}-2`, 
              text: 'Social media campaigns lack cohesive messaging', 
              serviceArea: 'Campaigns'
            }
          );
        } else if (bucket.name === 'Conversion') {
          newMetricSignals.push(
            { id: `m${Date.now()}-1`, name: 'Conversion Rate', value: `${(Math.random() * 5 + 1).toFixed(1)}%` },
            { id: `m${Date.now()}-2`, name: 'Bounce Rate', value: `${Math.floor(Math.random() * 30 + 40)}%` }
          );
          newHighlights.push(
            { 
              id: `h${Date.now()}-1`, 
              text: 'Checkout process has high abandonment rate', 
              serviceArea: 'Ecommerce Platforms'
            },
            { 
              id: `h${Date.now()}-2`, 
              text: 'Mobile site has poor performance metrics', 
              serviceArea: 'Website'
            }
          );
        } else if (bucket.name === 'Retention') {
          newMetricSignals.push(
            { id: `m${Date.now()}-1`, name: 'Churn Rate', value: `${(Math.random() * 5 + 1).toFixed(1)}%` },
            { id: `m${Date.now()}-2`, name: 'LTV', value: `$${Math.floor(Math.random() * 500 + 200)}` }
          );
          newHighlights.push(
            { 
              id: `h${Date.now()}-1`, 
              text: 'Email campaigns have declining open rates', 
              serviceArea: 'CRM'
            },
            { 
              id: `h${Date.now()}-2`, 
              text: 'App retention drops significantly after 30 days', 
              serviceArea: 'App'
            }
          );
        }
        
        // Update the bucket with new metrics and highlights
        setBuckets(prevBuckets => 
          prevBuckets.map(b => {
            if (b.name === bucket.name) {
              return {
                ...b,
                data: {
                  ...b.data,
                  metricSignals: [
                    ...b.data.metricSignals,
                    ...newMetricSignals
                  ],
                  highlights: [
                    ...b.data.highlights,
                    ...newHighlights
                  ]
                }
              };
            }
            return b;
          })
        );
        
        // Save changes for this bucket
        if (businessId) {
          // Format the updated highlights into a description
          const updatedHighlights = [...bucket.data.highlights, ...newHighlights];
          const highlightsText = updatedHighlights.map(h => 
            `- ${h.text} (${h.serviceArea})`
          ).join('\n');
          
          const serviceAreasText = bucket.serviceAreas.join(', ');
          const description = `Service Areas: ${serviceAreasText}\n\nHighlights:\n${highlightsText}`;
          
          await updateScorecardCategory(businessId, {
            name: bucket.name,
            score: bucket.data.score,
            highlights: description,
            serviceAreas: bucket.serviceAreas,
            highlightsData: {
              items: updatedHighlights,
              metricSignals: [...bucket.data.metricSignals, ...newMetricSignals],
              score: bucket.data.score,
              maxScore: bucket.data.maxScore,
              serviceAreas: bucket.serviceAreas
            }
          });
        }
      }
      
      // After all audits, reload data to ensure we're showing the latest
      await reloadData();
      alert('Full audit completed successfully. Added metrics and highlights to all categories.');
    } catch (error) {
      console.error('Error running full audit:', error);
      alert(`Error running full audit: ${error}`);
    } finally {
      setIsRunningFullAudit(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!businessId) {
      console.error('[DEBUG] No business ID available for publish toggle');
      return;
    }

    console.log('[DEBUG] Scorecard publish toggle clicked:', { isPublished, businessId });
    setIsPublishing(true);
    
    try {
      const result = isPublished 
        ? await unpublishScorecard(businessId)
        : await publishScorecard(businessId);
      
      console.log('[DEBUG] Scorecard publish toggle result:', result);
      
      if (result.success) {
        setIsPublished(!isPublished);
        console.log('[DEBUG] Scorecard publish state updated:', { newState: !isPublished });
      } else {
        console.error('[DEBUG] Failed to toggle scorecard publish state:', result.error);
      }
    } catch (error) {
      console.error('[DEBUG] Error toggling scorecard publish state:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const startEditingHighlight = (bucketName: string, highlight: Highlight) => {
    setEditingHighlight({...highlight});
    setIsEditingHighlight(bucketName);
  };

  const handleUpdateHighlight = async (bucketName: string) => {
    if (!businessId || !editingHighlight || !editingHighlight.text || !editingHighlight.serviceArea) return;
    
    setIsSavingHighlight(true);
    
    try {
      // Assuming you have an updateScorecardHighlight function similar to addScorecardHighlight
      const result = await updateScorecardHighlight(
        businessId,
        bucketName,
        editingHighlight.id,
        {
          text: editingHighlight.text,
          serviceArea: editingHighlight.serviceArea,
          relatedMetricId: editingHighlight.relatedMetricId
        }
      );
      
      if (result.success) {
        // Reload data to get the updated highlights
        await reloadData();
      }
    } catch (error) {
      console.error('Error updating highlight:', error);
    } finally {
      setIsEditingHighlight(null);
      setEditingHighlight(null);
      setIsSavingHighlight(false);
    }
  };

  const handleAddMetricSignal = async (bucketName: string) => {
    if (!businessId || !newMetricSignal.name || !newMetricSignal.value) return;
    
    setIsSavingHighlight(true); // Reuse the same loading state
    
    // First update the UI optimistically
    const newSignalObj = {
      id: `m${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newMetricSignal.name,
      value: newMetricSignal.value
    };
    
    setBuckets(prevBuckets => 
      prevBuckets.map(bucket => {
        if (bucket.name === bucketName) {
          return {
            ...bucket,
            data: {
              ...bucket.data,
              metricSignals: [
                ...bucket.data.metricSignals,
                newSignalObj
              ]
            }
          };
        }
        return bucket;
      })
    );
    
    try {
      console.log('[DEBUG] Adding metric signal to bucket:', bucketName);
      
      // Get the current bucket
      const bucket = buckets.find(b => b.name === bucketName);
      if (!bucket) throw new Error('Bucket not found');
      
      // Format the highlights into a description (unchanged)
      const highlightsText = bucket.data.highlights.map(h => 
        `- ${h.text} (${h.serviceArea})`
      ).join('\n');
      
      const serviceAreasText = bucket.serviceAreas.join(', ');
      const description = `Service Areas: ${serviceAreasText}\n\nHighlights:\n${highlightsText}`;
      
      // Create the highlight data structure with updated metric signals
      const highlightsData = {
        items: bucket.data.highlights,
        metricSignals: [...bucket.data.metricSignals, newSignalObj],
        score: bucket.data.score,
        maxScore: bucket.data.maxScore,
        serviceAreas: bucket.serviceAreas
      };
      
      // Save to the database
      const result = await updateScorecardCategory(businessId, {
        name: bucketName,
        score: bucket.data.score,
        highlights: description,
        serviceAreas: bucket.serviceAreas,
        highlightsData
      });
      
      console.log('[DEBUG] Add metric signal result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add metric signal');
      }
      
      // Reset the form
      setNewMetricSignal({ name: '', value: '' });
      setIsAddingMetricSignal(null);
      
      // After server response, reload data to ensure we're showing the latest
      await reloadData();
    } catch (error) {
      console.error('Error adding metric signal:', error);
      
      // Reload data on error to ensure UI is in sync with server
      await reloadData();
    } finally {
      setIsSavingHighlight(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Digital Performance Scorecard</h1>
        <div className="flex items-center gap-3">
          <Toggle
            isEnabled={isPublished}
            onToggle={handlePublishToggle}
            isLoading={isPublishing}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={runFullAudit}
            disabled={isRunningFullAudit}
          >
            {isRunningFullAudit ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" />
                Run Full Audit
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 items-start" style={{ gridAutoFlow: 'row' }}>
        {buckets.map((bucket) => (
          <div 
            key={bucket.name} 
            className="rounded-lg border border-gray-200 overflow-hidden bg-white"
            style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' }}
          >
            <div className="px-5 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-xl font-semibold">{bucket.name}</h2>
                </div>
                <div className="flex items-center">
                  <div style={{ border: '1px solid #eaeaea', display: 'flex', borderRadius: '0.25rem', overflow: 'hidden' }}>
                    <button 
                      style={{ 
                        padding: '0.25rem', 
                        borderRight: '1px solid #eaeaea', 
                        backgroundColor: 'white', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => decreaseScore(bucket.name)}
                      className="hover:bg-gray-100"
                    >
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                    <input
                      type="number"
                      value={bucket.data.score}
                      onChange={(e) => handleScoreChange(bucket.name, parseInt(e.target.value, 10) || 0)}
                      onBlur={() => handleScoreInputBlur(bucket.name)}
                      min="0"
                      max={bucket.data.maxScore}
                      style={{ 
                        width: '3rem', 
                        textAlign: 'center', 
                        padding: '0.25rem 0', 
                        border: 'none', 
                        outline: 'none',
                        boxShadow: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield',
                        appearance: 'textfield',
                        margin: 0,
                        display: 'block',
                        fontSize: '14px',
                        backgroundColor: 'transparent'
                      }}
                      className="hide-number-input-spinners"
                    />
                    <button 
                      style={{ 
                        padding: '0.25rem', 
                        borderLeft: '1px solid #eaeaea', 
                        backgroundColor: 'white', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => increaseScore(bucket.name)}
                      className="hover:bg-gray-100"
                    >
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  <span className="ml-1 text-sm text-gray-500">/ {bucket.data.maxScore}</span>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-white">
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div 
                  className="h-full rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${(bucket.data.score / bucket.data.maxScore) * 100}%`,
                    backgroundColor: bucket.color 
                  }}
                ></div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Highlights</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAddingHighlight(bucket.name)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => runAudit(bucket.name)}
                      disabled={isRunningAudit === bucket.name}
                    >
                      {isRunningAudit === bucket.name ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-1" />
                          Run Audit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {isAddingHighlight === bucket.name && (
                  <div className={`mb-4 p-3 ${bucket.bgColor} rounded-md border ${bucket.borderColor}`}>
                    <textarea 
                      value={newHighlight.text}
                      onChange={(e) => setNewHighlight({...newHighlight, text: e.target.value})}
                      placeholder="Enter highlight..."
                      className="w-full p-2 mb-2 bg-white border border-gray-200 rounded"
                      rows={2}
                    />
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Service Area:</label>
                        <select 
                          value={newHighlight.serviceArea}
                          onChange={(e) => setNewHighlight({...newHighlight, serviceArea: e.target.value})}
                          className="p-2 pr-8 bg-white border border-gray-200 rounded appearance-none flex-grow"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                        >
                          {bucket.serviceAreas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Related Metric:</label>
                        <select 
                          value={newHighlight.relatedMetricId}
                          onChange={(e) => setNewHighlight({...newHighlight, relatedMetricId: e.target.value})}
                          className="p-2 pr-8 bg-white border border-gray-200 rounded appearance-none flex-grow"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                        >
                          <option value="">None</option>
                          {bucket.data.metricSignals.map(signal => (
                            <option key={signal.id} value={signal.id}>{signal.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewHighlight({ text: '', serviceArea: 'Other', relatedMetricId: '' });
                          setIsAddingHighlight(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleAddHighlight(bucket.name)}
                        disabled={!newHighlight.text || !newHighlight.serviceArea || isSavingHighlight}
                      >
                        {isSavingHighlight ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {bucket.data.highlights.length > 0 ? (
                  <div className="space-y-2">
                    {bucket.data.highlights.map((highlight) => (
                      <div 
                        key={highlight.id} 
                        className={`p-3 ${bucket.bgColor} rounded-md border ${bucket.borderColor} relative group`}
                      >
                        {isEditingHighlight === bucket.name && editingHighlight?.id === highlight.id ? (
                          // Inline edit form
                          <div>
                            <textarea 
                              value={editingHighlight.text}
                              onChange={(e) => setEditingHighlight({...editingHighlight, text: e.target.value})}
                              placeholder="Enter highlight..."
                              className="w-full p-2 mb-2 bg-white border border-gray-200 rounded"
                              rows={2}
                            />
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium">Service Area:</label>
                                <select 
                                  value={editingHighlight.serviceArea}
                                  onChange={(e) => setEditingHighlight({...editingHighlight, serviceArea: e.target.value})}
                                  className="p-2 pr-8 bg-white border border-gray-200 rounded appearance-none flex-grow"
                                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                                >
                                  {bucket.serviceAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                  ))}
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium">Related Metric:</label>
                                <select 
                                  value={editingHighlight.relatedMetricId || ""}
                                  onChange={(e) => setEditingHighlight({...editingHighlight, relatedMetricId: e.target.value})}
                                  className="p-2 pr-8 bg-white border border-gray-200 rounded appearance-none flex-grow"
                                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                                >
                                  <option value="">None</option>
                                  {bucket.data.metricSignals.map(signal => (
                                    <option key={signal.id} value={signal.id}>{signal.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingHighlight(null);
                                  setIsEditingHighlight(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => handleUpdateHighlight(bucket.name)}
                                disabled={!editingHighlight.text || !editingHighlight.serviceArea || isSavingHighlight}
                              >
                                {isSavingHighlight ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Regular highlight view
                          <>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <button
                                onClick={() => startEditingHighlight(bucket.name, highlight)}
                                className="cursor-pointer"
                                title="Edit highlight"
                              >
                                <Pencil className={`h-3.5 w-3.5 ${bucket.textColor}`} />
                              </button>
                              <button
                                onClick={() => handleDeleteHighlight(bucket.name, highlight.id)}
                                className="cursor-pointer"
                                title="Delete highlight"
                              >
                                <X className={`h-4 w-4 ${bucket.textColor}`} />
                              </button>
                            </div>
                            <div className="flex items-start">
                              <AlertCircle className={`flex-shrink-0 h-5 w-5 mr-2 mt-0.5 ${bucket.textColor}`} />
                              <div>
                                <p className="text-sm">{highlight.text}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`text-xs font-medium ${bucket.textColor} inline-block`}>
                                    {highlight.serviceArea}
                                  </span>
                                  {highlight.relatedMetricId && (
                                    <span className="bg-[#f9f9f9] border border-[#e9e9e9] text-[#555555] px-2 py-0.5 rounded-full inline-flex items-center font-mono text-xs">
                                      {bucket.data.metricSignals.find(m => m.id === highlight.relatedMetricId)?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <BarChart2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No issues identified yet.</p>
                  </div>
                )}
                
                {/* Metric Signals Section */}
                {(bucket.data.metricSignals.length > 0 || isAddingMetricSignal === bucket.name) && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Metric Signals</h3>
                    </div>
                    
                    {isAddingMetricSignal === bucket.name && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium">Name:</label>
                            <input 
                              type="text"
                              value={newMetricSignal.name}
                              onChange={(e) => setNewMetricSignal({...newMetricSignal, name: e.target.value})}
                              placeholder="Metric name (e.g. Bounce Rate)"
                              className="p-2 bg-white border border-gray-200 rounded flex-grow"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium">Value:</label>
                            <input 
                              type="text"
                              value={newMetricSignal.value}
                              onChange={(e) => setNewMetricSignal({...newMetricSignal, value: e.target.value})}
                              placeholder="Metric value (e.g. 45% or $25)"
                              className="p-2 bg-white border border-gray-200 rounded flex-grow"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setNewMetricSignal({ name: '', value: '' });
                              setIsAddingMetricSignal(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleAddMetricSignal(bucket.name)}
                            disabled={!newMetricSignal.name || !newMetricSignal.value || isSavingHighlight}
                          >
                            {isSavingHighlight ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Add'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {bucket.data.metricSignals.map((signal) => (
                        <div
                          key={signal.id}
                          className="px-3 py-1 rounded-full bg-[#f9f9f9] border border-[#e9e9e9] text-[#555555] flex items-center font-mono relative group"
                        >
                          <button
                            onClick={() => handleDeleteMetricSignal(bucket.name, signal.id)}
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-white rounded-full border border-gray-200 p-0.5"
                          >
                            <X className="h-3 w-3 text-gray-500" />
                          </button>
                          <span className="font-medium text-xs">{signal.name}:</span>
                          <span className="ml-1 text-xs text-black font-bold">{signal.value}</span>
                        </div>
                      ))}
                      
                      {isAddingMetricSignal !== bucket.name && (
                        <button
                          onClick={() => setIsAddingMetricSignal(bucket.name)}
                          className="h-6 w-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 hover:text-gray-500 transition-colors"
                          title="Add metric signal"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Show just the add button if no metrics exist yet */}
                {bucket.data.metricSignals.length === 0 && isAddingMetricSignal !== bucket.name && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Metric Signals</h3>
                    </div>
                    <button
                      onClick={() => setIsAddingMetricSignal(bucket.name)}
                      className="h-6 w-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 hover:text-gray-500 transition-colors"
                      title="Add metric signal"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Add the Report Management section */}
            {businessId && (
              <div className="border-t border-gray-200">
                <ReportManagement 
                  bucket={bucket.name as 'Foundation' | 'Acquisition' | 'Conversion' | 'Retention'} 
                  businessId={businessId}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 