import { ExternalLink } from 'lucide-react';
import { Button } from './Button';
import type { AffiliateRecommendation } from '@/shared/types';

interface AffiliateCardProps {
  recommendation: AffiliateRecommendation;
}

export function AffiliateCard({ recommendation }: AffiliateCardProps) {
  return (
    <div className="bg-wg-card rounded-xl border border-wg-border p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-wg-bg2 rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-wg-border" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-wg-text">{recommendation.title}</h4>
          {recommendation.description && (
            <p className="text-xs text-wg-text2 mt-0.5">{recommendation.description}</p>
          )}
          {recommendation.price && (
            <p className="text-sm font-medium text-wg-text mt-1">
              ${recommendation.price.toFixed(2)}
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm">
          <span>View Product</span>
          <ExternalLink size={12} />
        </Button>
      </div>
    </div>
  );
}
