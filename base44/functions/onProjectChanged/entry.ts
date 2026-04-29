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

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});