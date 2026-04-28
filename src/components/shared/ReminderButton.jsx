import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReminderButton({ item, entityName, onUpdate, recipientEmail }) {
  const [sending, setSending] = useState(false);

  if (!item.due_date) return null;

  const handleSend = async (e) => {
    e.stopPropagation();
    if (!recipientEmail) {
      toast.error('No recipient email found');
      return;
    }
    setSending(true);
    try {
      const label = item.title || item.name || item.claim_id || 'Item';
      const dueFormatted = format(new Date(item.due_date), 'MMMM d, yyyy');
      await base44.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `Reminder: "${label}" is due on ${dueFormatted}`,
        body: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
            <h2 style="color:#0f766e;margin-bottom:8px;">Due Date Reminder</h2>
            <p style="color:#374151;font-size:15px;">This is a reminder that the following item is due on <strong>${dueFormatted}</strong>:</p>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${label}</p>
              ${item.description ? `<p style="margin:8px 0 0;color:#6b7280;font-size:14px;">${item.description}</p>` : ''}
              ${item.customer ? `<p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Customer: ${item.customer}</p>` : ''}
            </div>
            <p style="color:#6b7280;font-size:13px;">Please ensure all required actions are completed before the due date.</p>
          </div>
        `
      });
      // Mark reminder as sent
      await base44.entities[entityName].update(item.id, { reminder_sent: true });
      onUpdate?.();
      toast.success('Reminder email sent!');
    } catch (err) {
      toast.error('Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className={`h-7 w-7 ${item.reminder_sent ? 'text-amber-500' : 'text-muted-foreground'}`}
      onClick={handleSend}
      title={item.reminder_sent ? 'Reminder already sent — click to resend' : 'Send due date reminder'}
      disabled={sending}
    >
      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.reminder_sent ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
    </Button>
  );
}