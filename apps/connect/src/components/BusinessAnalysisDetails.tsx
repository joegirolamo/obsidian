'use client';

import { Award, Zap, Target, BarChartHorizontal, ShoppingBag, Check, Medal } from 'lucide-react';

interface BusinessAnalysisDetailsProps {
  businessModel?: string;
  productOffering?: string;
  valuePropositions?: string[];
  differentiationHighlights?: string[];
}

export default function BusinessAnalysisDetails({
  businessModel,
  productOffering,
  valuePropositions = [],
  differentiationHighlights = []
}: BusinessAnalysisDetailsProps) {
  if (!businessModel && !productOffering && valuePropositions.length === 0 && differentiationHighlights.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {businessModel && (
        <div className="card h-full">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <BarChartHorizontal className="h-5 w-5 text-blue-600" />
              <h2 className="heading-3">Business Model</h2>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-700">{businessModel}</p>
          </div>
        </div>
      )}

      {productOffering && (
        <div className="card h-full">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              <h2 className="heading-3">Product/Service Offerings</h2>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-700">{productOffering}</p>
          </div>
        </div>
      )}

      {valuePropositions.length > 0 && (
        <div className="card h-full">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <h2 className="heading-3">Value Propositions</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {valuePropositions.map((proposition, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{proposition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {differentiationHighlights.length > 0 && (
        <div className="card h-full">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              <h2 className="heading-3">Differentiation Highlights</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {differentiationHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 