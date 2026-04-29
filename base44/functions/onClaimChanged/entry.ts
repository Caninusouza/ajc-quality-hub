import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FSQA_PEOPLE = {
  'Rafael Souza': 'rsouza@ajcgroup.com',
  'Gabriela Hidalgo': 'ghidalgo@ajcgroup.com',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    if (!data?.fsqa_assignee) return Response.json({ skipped: 'no assignee' });

    const assigneeEmail = FSQA_PEOPLE[data.fsqa_assignee];
    if (!assigneeEmail) return Response.json({ skipped: 'unknown assignee' });

    const user = await base44.auth.me();
    const actorEmail = user?.email;
    const actorIsFsqa = actorEmail && Object.values(FSQA_PEOPLE).includes(actorEmail);
    const actorIsAssignee = actorEmail === assigneeEmail;

    // Case: FSQA assignee is updating their own claim
    if (event.type === 'update' && actorIsAssignee) {
      // If marked as resolved/closed, notify the other FSQA rep
      const completedStatuses = ['RESOLVED', 'CLOSED'];
      const justCompleted = completedStatuses.includes(data.current_status) && !completedStatuses.includes(old_data?.current_status);
      if (justCompleted) {
        const assignerEmail = Object.values(FSQA_PEOPLE).find(e => e !== assigneeEmail);
        if (assignerEmail) {
          const subject = `[FSQA] Claim completed: ${data.title}`;
          const body = [
            `Hi,`,
            '',
            `<strong>${data.fsqa_assignee}</strong> has marked the following claim as <strong>${data.current_status}</strong>.`,
            '',
            data.claim_id ? `<strong>Claim ID:</strong> ${data.claim_id}` : '',
            `<strong>Title:</strong> ${data.title}`,
            data.customer ? `<strong>Customer:</strong> ${data.customer}` : '',
            data.supplier ? `<strong>Supplier:</strong> ${data.supplier}` : '',
            data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
            '',
            'Please log in to the FSQA system to review.',
          ].filter(Boolean).join('<br/>');
          await base44.asServiceRole.integrations.Core.SendEmail({ to: assignerEmail, subject, body });
          return Response.json({ success: true, completion_notice_sent_to: assignerEmail });
        }
      }
      return Response.json({ skipped: 'actor is the assignee and claim not completed' });
    }

    // Notify the assignee
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

    await base44.asServiceRole.integrations.Core.SendEmail({ to: assigneeEmail, subject, body });

    // Send confirmation to the actor only if they are NOT an FSQA rep
    if (actorEmail && actorEmail !== assigneeEmail && !actorIsFsqa) {
      const confirmSubject = `[FSQA] Confirmation: Claim notification sent to ${data.fsqa_assignee}`;
      const confirmBody = [
        `Hi ${user.full_name || actorEmail},`,
        '',
        `A notification was sent to <strong>${data.fsqa_assignee}</strong> regarding:`,
        '',
        data.claim_id ? `<strong>Claim ID:</strong> ${data.claim_id}` : '',
        `<strong>Title:</strong> ${data.title}`,
        data.current_status ? `<strong>Status:</strong> ${data.current_status}` : '',
        data.due_date ? `<strong>Due Date:</strong> ${data.due_date}` : '',
      ].filter(Boolean).join('<br/>');
      await base44.asServiceRole.integrations.Core.SendEmail({ to: actorEmail, subject: confirmSubject, body: confirmBody });
    }

    return Response.json({ success: true, sent_to: assigneeEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});