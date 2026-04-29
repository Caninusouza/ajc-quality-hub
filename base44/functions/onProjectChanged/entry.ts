import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FSQA_PEOPLE = {
  'Rafael Souza': 'rsouza@ajcgroup.com',
  'Gabriela Hidalgo': 'ghidalgo@ajcgroup.com',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (!data?.fsqa_assignee) return Response.json({ skipped: 'no assignee' });

    const email = FSQA_PEOPLE[data.fsqa_assignee];
    if (!email) return Response.json({ skipped: 'unknown assignee' });

    // Skip all emails on updates if the acting user is the assignee (they made the change themselves)
    const user = await base44.auth.me();
    if (event.type === 'update' && user?.email === email) return Response.json({ skipped: 'actor is the assignee' });

    const action = event.type === 'create' ? 'assigned to you' : 'updated';
    const subject = `[FSQA] Project ${action}: ${data.name}`;

    const body = [
      `Hi ${data.fsqa_assignee},`,
      '',
      `A Project has been <strong>${action}</strong>.`,
      '',
      `<strong>Project:</strong> ${data.name}`,
      data.status ? `<strong>Status:</strong> ${data.status}` : '',
      data.priority ? `<strong>Priority:</strong> ${data.priority}` : '',
      data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
      data.progress !== undefined ? `<strong>Progress:</strong> ${data.progress}%` : '',
      '',
      'Please log in to the FSQA system to review the details.',
    ].filter(Boolean).join('<br/>');

    await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body });

    // Send confirmation to the creator/updater
    if (user?.email && user.email !== email) {
      const confirmSubject = `[FSQA] Confirmation: Project notification sent to ${data.fsqa_assignee}`;
      const confirmBody = [
        `Hi ${user.full_name || user.email},`,
        '',
        `This is a confirmation that a notification email was successfully sent to <strong>${data.fsqa_assignee}</strong> (${email}) regarding the following project:`,
        '',
        `<strong>Project:</strong> ${data.name}`,
        data.status ? `<strong>Status:</strong> ${data.status}` : '',
        data.priority ? `<strong>Priority:</strong> ${data.priority}` : '',
        data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
      ].filter(Boolean).join('<br/>');
      await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject: confirmSubject, body: confirmBody });
    }

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});