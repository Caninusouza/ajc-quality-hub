import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { format, isToday, parseISO } from 'date-fns';

/**
 * Silently runs on mount. Finds Claims, Projects, and Tasks due today
 * that haven't had a reminder sent, sends an email to the assigned person,
 * and marks reminder_sent = true.
 */
export default function DueRemindersRunner() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    sendDueReminders();
  }, []);

  return null;
}

async function sendDueReminders() {
  const today = new Date();
  const todayFormatted = format(today, 'MMMM d, yyyy');

  const [claims, projects, tasks] = await Promise.all([
    base44.entities.Claim.list(),
    base44.entities.Project.list(),
    base44.entities.Task.list(),
  ]);

  const sendReminder = async ({ to, label, description, extraInfo, entityName, id }) => {
    if (!to || !to.includes('@')) return; // skip if no valid email
    await base44.integrations.Core.SendEmail({
      to,
      subject: `Due Date Reminder: "${label}" is due today`,
      body: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#0f766e;margin-bottom:8px;">Due Date Reminder</h2>
          <p style="color:#374151;font-size:15px;">This is an automated reminder that the following item is due <strong>today, ${todayFormatted}</strong>:</p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${label}</p>
            ${description ? `<p style="margin:8px 0 0;color:#6b7280;font-size:14px;">${description}</p>` : ''}
            ${extraInfo ? `<p style="margin:8px 0 0;color:#6b7280;font-size:14px;">${extraInfo}</p>` : ''}
          </div>
          <p style="color:#6b7280;font-size:13px;">Please ensure all required actions are completed before end of day.</p>
        </div>
      `
    });
    await base44.entities[entityName].update(id, { reminder_sent: true });
  };

  const jobs = [];

  // Claims — active (not resolved/closed), due today, reminder not sent
  for (const c of claims) {
    if (c.reminder_sent) continue;
    if (!c.due_date) continue;
    if (!isToday(parseISO(c.due_date))) continue;
    if (['RESOLVED', 'CLOSED'].includes(c.current_status)) continue;
    const to = c.claims_rep; // Use claims_rep as the email/identifier
    jobs.push(sendReminder({
      to,
      label: c.title || c.claim_id || 'Claim',
      description: c.claim_id ? `Claim ID: ${c.claim_id}` : undefined,
      extraInfo: c.customer ? `Customer: ${c.customer}` : undefined,
      entityName: 'Claim',
      id: c.id,
    }));
  }

  // Projects — active (planning/in_progress), due today, reminder not sent
  for (const p of projects) {
    if (p.reminder_sent) continue;
    if (!p.due_date) continue;
    if (!isToday(parseISO(p.due_date))) continue;
    if (['completed', 'cancelled'].includes(p.status)) continue;
    const to = p.owner;
    jobs.push(sendReminder({
      to,
      label: p.name || 'Project',
      description: p.description,
      extraInfo: p.category ? `Category: ${p.category}` : undefined,
      entityName: 'Project',
      id: p.id,
    }));
  }

  // Tasks — pending (not done), due today, reminder not sent
  for (const t of tasks) {
    if (t.reminder_sent) continue;
    if (!t.due_date) continue;
    if (!isToday(parseISO(t.due_date))) continue;
    if (t.status === 'done') continue;
    const to = t.assigned_to;
    jobs.push(sendReminder({
      to,
      label: t.title || 'Task',
      description: t.description,
      extraInfo: t.priority ? `Priority: ${t.priority}` : undefined,
      entityName: 'Task',
      id: t.id,
    }));
  }

  await Promise.allSettled(jobs);
}