import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FSQA_PEOPLE = {
  'Rafael Souza': 'rsouza@ajcgroup.com',
  'Gabriela Hidalgo': 'ghidalgo@ajcgroup.com',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { entity_type, entity_name, entity_id, assignee, event_type, details } = await req.json();

    const email = FSQA_PEOPLE[assignee];
    if (!email) {
      return Response.json({ error: 'Unknown assignee' }, { status: 400 });
    }

    const action = event_type === 'create' ? 'assigned to you' : 'updated';
    const subject = `[FSQA] ${entity_type} ${action}: ${entity_name}`;

    const bodyLines = [
      `Hi ${assignee},`,
      '',
      `A ${entity_type} has been ${action}.`,
      '',
      `<strong>${entity_type}:</strong> ${entity_name}`,
      entity_id ? `<strong>ID:</strong> ${entity_id}` : '',
      ...Object.entries(details || {}).filter(([, v]) => v).map(([k, v]) => `<strong>${k}:</strong> ${v}`),
      '',
      'Please log in to the FSQA system to review the details.',
    ].filter(l => l !== null);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject,
      body: bodyLines.join('<br/>'),
    });

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});