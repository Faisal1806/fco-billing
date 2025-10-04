
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Smile } from 'lucide-react';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  const handleFeedbackSubmit = () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a star rating before submitting.',
      });
      return;
    }
    
    console.log({ rating, feedback });

    toast({
      title: 'Feedback Submitted',
      description: "Thank you for your valuable feedback!",
    });

    // Reset form
    setRating(0);
    setFeedback('');
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Smile className="h-6 w-6 text-primary" />
            Feedback & Suggestions
          </CardTitle>
          <CardDescription>
            We value your opinion. Let us know how we can improve the app for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Label className="text-lg font-semibold">How would you rate your experience?</Label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-text">Your Feedback</Label>
            <Textarea
              id="feedback-text"
              placeholder="Tell us what you liked or what could be better..."
              rows={6}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleFeedbackSubmit}>
            Submit Feedback
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
