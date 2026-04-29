import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FSQA_PEOPLE = {
  'Rafael Souza': 'rsouza@ajcgroup.com',
  'Gabriela Hidalgo': 'ghidalgo@ajcgroup.com',
};

const FSQA_EMAILS = Object.values(FSQA_PEOPLE);

const STATUS_LABELS = {
  submitted: 'Submitted',
  in_review: 'In Review',
  in_progress: 'In Progress',
  pending_info: 'Pending Additional Information',
  completed: 'Completed',
  rejected: 'Rejected',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    if (!data?.requested_by_email) return Response.json({ skipped: 'no requester email' });

    const requesterEmail = data.requested_by_email;
    const requesterName = data.requested_by_name || requesterEmail;

    const user = await base44.auth.me();
    const actorEmail = user?.email;
    const actorIsFsqa = actorEmail && FSQA_EMAILS.includes(actorEmail);

    // On create: notify FSQA team and confirm to requester
    if (event.type === 'create') {
      // Notify all FSQA reps about new request
      for (const [name, fsqaEmail] of Object.entries(FSQA_PEOPLE)) {
        const subject = `[FSQA] New Request: ${data.title}`;
        const body = [
          `Hi ${name},`,
          '',
          `A new request has been submitted through the FSQA portal.`,
          '',
          `<strong>Title:</strong> ${data.title}`,
          `<strong>Type:</strong> ${data.request_type}`,
          `<strong>Priority:</strong> ${data.priority}`,
          data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
          data.description ? `<strong>Description:</strong> ${data.description}` : '',
          `<strong>Submitted by:</strong> ${requesterName} (${requesterEmail})`,
          '',
          'Please log in to the FSQA system to review and respond.',
        ].filter(Boolean).join('<br/>');
        await base44.asServiceRole.integrations.Core.SendEmail({ to: fsqaEmail, subject, body });
      }

      // Confirm to requester
      const confirmSubject = `[FSQA] Request Received: ${data.title}`;
      const confirmBody = [
        `Hi ${requesterName},`,
        '',
        `Your request has been successfully submitted to the FSQA team. We will review it and get back to you shortly.`,
        '',
        `<strong>Request:</strong> ${data.title}`,
        `<strong>Type:</strong> ${data.request_type}`,
        `<strong>Priority:</strong> ${data.priority}`,
        data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
        `<strong>Status:</strong> Submitted`,
        '',
        'You will receive email updates whenever your request status changes.',
      ].filter(Boolean).join('<br/>');
      await base44.asServiceRole.integrations.Core.SendEmail({ to: requesterEmail, subject: confirmSubject, body: confirmBody });

      return Response.json({ success: true });
    }

    // On update: notify requester of any change (only if status or notes changed)
    if (event.type === 'update') {
      // Skip if actor is the requester themselves
      if (actorEmail === requesterEmail) return Response.json({ skipped: 'actor is the requester' });

      const statusChanged = data.status !== old_data?.status;
      const notesChanged = data.fsqa_notes !== old_data?.fsqa_notes;

      if (!statusChanged && !notesChanged) return Response.json({ skipped: 'no relevant changes' });

      const subject = `[FSQA] Request Update: ${data.title}`;
      const body = [
        `Hi ${requesterName},`,
        '',
        `Your FSQA request has been updated.`,
        '',
        `<strong>Request:</strong> ${data.title}`,
        `<strong>Type:</strong> ${data.request_type}`,
        statusChanged ? `<strong>Status:</strong> ${STATUS_LABELS[data.status] || data.status}` : '',
        data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
        data.fsqa_notes ? `<strong>FSQA Notes:</strong> ${data.fsqa_notes}` : '',
        '',
        'Please log in to the FSQA portal to view your request details and any attached files.',
      ].filter(Boolean).join('<br/>');

      await base44.asServiceRole.integrations.Core.SendEmail({ to: requesterEmail, subject, body });
      return Response.json({ success: true, notified: requesterEmail });
    }

    return Response.json({ skipped: 'unhandled event type' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});