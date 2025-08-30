
'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getContextualHelpAction } from '@/lib/actions';
import { useLanguage } from '@/contexts/language-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function SubmitButton({ gettingAdviceText }: { gettingAdviceText: string }) {
  const { pending } = useFormStatus();
  const { t } = useLanguage();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {gettingAdviceText}
        </>
      ) : (
        t('get_advice')
      )}
    </Button>
  );
}

export function ContextualHelp({ context }: { context: string }) {
  const { t } = useLanguage();
  const initialState = { advice: '', error: '' };
  const [state, dispatch] = useActionState(getContextualHelpAction, initialState);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <Lightbulb className="h-6 w-6" />
          <span className="sr-only">{t('contextual_help')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('contextual_help')}</DialogTitle>
          <DialogDescription>
            {t('contextual_help_description')}
          </DialogDescription>
        </DialogHeader>
        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="context" value={context} />
          <div className="grid w-full gap-2">
            <Textarea
              name="userQuery"
              placeholder={t('your_query')+'...'}
              required
              minLength={5}
            />
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          </div>

          {state?.advice && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>{t('advice_from_ai')}</AlertTitle>
              <AlertDescription>{state.advice}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <SubmitButton gettingAdviceText={t('getting_advice')} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
