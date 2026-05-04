import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled invocations (no user auth) via service role
  const today = new Date().toISOString().split('T')[0];

  // Fetch all done, non-archived tasks
  const doneTasks = await base44.asServiceRole.entities.Task.filter({
    status: 'done',
    archived: false,
  });

  if (!doneTasks || doneTasks.length === 0) {
    return Response.json({ message: 'No done tasks to archive', archived: 0 });
  }

  // Archive each task
  let count = 0;
  for (const task of doneTasks) {
    await base44.asServiceRole.entities.Task.update(task.id, {
      archived: true,
      archived_date: today,
    });
    count++;
  }

  return Response.json({ message: `Archived ${count} done tasks`, archived: count });
});