'use client';

import { Button, Spinner } from '@/components/ui';
import { supportTicketSchema } from '@/lib/validations/schemas';
import { submitSupportTicket } from '@/app/support/actions';
import { X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

type TicketType = 'bug' | 'feedback' | 'support';

const TYPE_LABELS: Record<TicketType, string> = {
  feedback: 'Feedback',
  bug: 'Bug Report',
  support: 'Support',
};

export function SupportModal({ open, onClose }: SupportModalProps) {
  const [type, setType] = useState<TicketType>('feedback');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ type?: string; message?: string }>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleClose = () => {
    setType('feedback');
    setMessage('');
    setErrors({});
    onClose();
  };

  const handleSubmit = () => {
    const result = supportTicketSchema.safeParse({ type, message });
    if (!result.success) {
      const flat = result.error.flatten();
      setErrors({
        type: flat.fieldErrors.type?.[0],
        message: flat.fieldErrors.message?.[0],
      });
      return;
    }

    setErrors({});

    startTransition(async () => {
      const res = await submitSupportTicket({ type, message });
      if ('error' in res) {
        toast.error(res.error);
      } else {
        toast.success('Message sent!');
        handleClose();
      }
    });
  };

  const inputClass =
    'mt-1 block w-full rounded-xl border border-border/50 bg-muted/50 px-3 py-2 text-base placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold">Report an issue</h2>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-1.5 transition-colors duration-200 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Type selector */}
          <div>
            <p className="mb-2 text-sm font-medium">Type</p>
            <div className="flex gap-2">
              {(Object.keys(TYPE_LABELS) as TicketType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors duration-200 ${
                    type === t
                      ? 'border-ring bg-muted font-medium'
                      : 'border-border/50 hover:bg-muted/50'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-xs text-destructive">{errors.type}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="support-message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Describe your issue or feedback..."
              className={`${inputClass} resize-none ${errors.message ? 'border-destructive' : ''}`}
            />
            {errors.message && (
              <p className="mt-1 text-xs text-destructive">{errors.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={handleSubmit}>
              {pending ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Sending...
                </span>
              ) : (
                'Send'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
