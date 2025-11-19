import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface GuardianBadgeProps {
  rating: number | null;
  url?: string | null;
  className?: string;
}

export function GuardianBadge({ rating, url, className }: GuardianBadgeProps) {
  if (!rating) return null;

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const content = (
    <Badge
      variant="secondary"
      className={`bg-[#052962] hover:bg-[#052962]/90 text-white border-none ${className || ''}`}
    >
      <span className="font-semibold text-xs">The Guardian</span>
      <span className="mx-1">•</span>
      <span className="text-sm">{stars}</span>
      {url && <ExternalLink className="w-3 h-3 ml-1" />}
    </Badge>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return content;
}
