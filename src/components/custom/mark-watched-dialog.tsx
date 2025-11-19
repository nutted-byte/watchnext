import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './star-rating';
import { Loader2 } from 'lucide-react';

interface MarkWatchedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: (rating: number, notes?: string) => void;
  isPending?: boolean;
}

export function MarkWatchedDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
  isPending = false,
}: MarkWatchedDialogProps) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onConfirm(rating, notes || undefined);
      // Reset form
      setRating(0);
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark as Watched</DialogTitle>
          <DialogDescription>
            Rate &quot;{title}&quot; and optionally add your thoughts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex justify-center py-2">
              <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="What did you think?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Mark as Watched'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
