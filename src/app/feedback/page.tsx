'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Smile } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';

const faqs = [
    {
        question: "How do I create a new sales invoice (watak)?",
        answer: "Navigate to the 'Sales' section from the sidebar. The first tab, 'Sales Invoices (Watak)', is where you can fill in the details for a new invoice. Fill in the invoice number, date, customer, and item details, then click 'Save Invoice'."
    },
    {
        question: "Can I use this app offline?",
        answer: "Yes, the application is designed to be offline-first. All data you enter is saved locally to your device. When you have an internet connection, you can use the 'Upload to Cloud' button in Settings > Data Sync & Backup to sync your data."
    },
    {
        question: "How do I track payments from a grower?",
        answer: "Go to the 'Payments' section (listed as Advances & Payments). Here you can record 'Repayment Received' transactions, which will be credited against the grower's outstanding balance."
    },
    {
        question: "Where can I see the profit/loss for my outside sales (bikri)?",
        answer: "Navigate to the 'Outside Sales' section. The main form calculates the profit or loss for a single bikri. The list of saved bikris on the right side also shows the final profit or loss for each."
    }
];

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
      isSuccess: true,
    });

    // Reset form
    setRating(0);
    setFeedback('');
  };

  return (
    <div className="space-y-8">
        <PageHeader
            title="Help & Support"
            description="Find answers to common questions or send us your feedback."
            icon={<LifeBuoy className="h-8 w-8" />}
            imageUrl="/assets/3d/support.png"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                             <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                <AccordionContent>
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <motion.div
                whileHover={{ y: -10, scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="[perspective:1000px]"
            >
                <Card className="h-full bg-card/70 backdrop-blur-sm border-white/10">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Smile className="h-6 w-6 text-yellow-400" />
                        Submit Feedback
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
            </motion.div>
        </div>
    </div>
  );
}

