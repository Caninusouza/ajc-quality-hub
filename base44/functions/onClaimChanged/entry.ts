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
    const subject = `[FSQA] Claim ${action}: ${data.title}`;

    const body = [
      `Hi ${data.fsqa_assignee},`,
      '',
      `A Claim has been <strong>${action}</strong>.`,
      '',
      data.claim_id ? `<strong>Claim ID:</strong> ${data.claim_id}` : '',
      `<strong>Title:</strong> ${data.title}`,
      data.current_status ? `<strong>Status:</strong> ${data.current_status}` : '',
      data.customer ? `<strong>Customer:</strong> ${data.customer}` : '',
      data.supplier ? `<strong>Supplier:</strong> ${data.supplier}` : '',
      data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
      '',
      'Please log in to the FSQA system to review the details.',
    ].filter(Boolean).join('<br/>');

    await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body });

    // Send confirmation to the creator/updater
    const user = await base44.auth.me();
    if (user?.email && user.email !== email) {
      const confirmSubject = `[FSQA] Confirmation: Claim notification sent to ${data.fsqa_assignee}`;
      const confirmBody = [
        `Hi ${user.full_name || user.email},`,
        '',
        `This is a confirmation that a notification email was successfully sent to <strong>${data.fsqa_assignee}</strong> (${email}) regarding the following claim:`,
        '',
        data.claim_id ? `<strong>Claim ID:</strong> ${data.claim_id}` : '',
        `<strong>Title:</strong> ${data.title}`,
        data.current_status ? `<strong>Status:</strong> ${data.current_status}` : '',
        data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
      ].filter(Boolean).join('<br/>');
      await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject: confirmSubject, body: confirmBody });
    }

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});