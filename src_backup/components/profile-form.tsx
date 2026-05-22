
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  businessName: z.string().min(2, {
    message: 'Business name must be at least 2 characters.',
  }),
  proprietorName: z.string().min(2, {
    message: 'Proprietor name must be at least 2 characters.',
  }),
});

export function CompanyInfoForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: 'Firdous Ahmad & Company',
      proprietorName: 'Firdous Ahmad Lone',
    },
  });

  const { isDirty } = form.formState;

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Here you would typically save the data to your backend or state management
    console.log(values);
    toast({
      title: 'Company Information Updated',
      description: 'Your company details have been saved.',
    });
    form.reset(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Update your company's details.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proprietorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proprietor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Owner/Proprietor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={!isDirty}>Save Changes</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
