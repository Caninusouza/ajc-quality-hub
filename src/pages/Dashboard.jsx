import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, FolderKanban, CheckSquare, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import DueRemindersRunner from '@/components/shared/DueRemindersRunner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['hsl(172, 50%, 36%)', 'hsl(210, 60%, 50%)', 'hsl(40, 85%, 55%)', 'hsl(340, 65%, 55%)', 'hsl(270, 55%, 55%)'];

export default function Dashboard() {
  const { data: claims = [] } = useQuery({ queryKey: ['claims'], queryFn: () => base44.entities.Claim.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });

  // Deduplicate by claim_id (same logic as Claims page)
  const dedupedClaims = Object.values(
    claims.reduce((acc, c) => {
      const key = c.claim_id || c.id;
      if (!acc[key] || c.updated_date > acc[key].updated_date) {
        acc[key] = c;
      }
      return acc;
    }, {})
  );

  const openClaims = dedupedClaims.filter(c => !['RESOLVED', 'CLOSED'].includes(c.current_status));
  const criticalClaims = dedupedClaims.filter(c => !['RESOLVED', 'CLOSED'].includes(c.current_status));
  const activeProjects = projects.filter(p => ['planning', 'in_progress'].includes(p.status));
  const pendingTasks = tasks.filter(t => t.status !== 'done');

  const claimsByType = Object.entries(
    dedupedClaims.reduce((acc, c) => { acc[c.claim_lifecycle] = (acc[c.claim_lifecycle] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name?.replace(/_/g, ' '), value }));

  const tasksByStatus = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length },
  ];

  return (
    <div className="space-y-8">
      <DueRemindersRunner />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Food quality management overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open Claims" value={openClaims.length} icon={ShieldAlert} subtitle={`${criticalClaims.length} critical`} to="/claims" />
        <StatCard title="Active Projects" value={activeProjects.length} icon={FolderKanban} subtitle={`${projects.length} total`} to="/projects" />
        <StatCard title="Pending Tasks" value={pendingTasks.length} icon={CheckSquare} subtitle={`${tasks.filter(t=>t.status==='done').length} completed`} to="/tasks" />
        <StatCard title="Resolution Rate" value={dedupedClaims.length ? `${Math.round((dedupedClaims.filter(c=>['RESOLVED','CLOSED'].includes(c.current_status)).length / dedupedClaims.length) * 100)}%` : '—'} icon={TrendingUp} to="/claims" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Claims by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {claimsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={claimsByType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {claimsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">No claims yet</p>}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {claimsByType.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="capitalize text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tasks Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tasksByStatus} barSize={36}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(172, 50%, 36%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-12">No tasks yet</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Claims</CardTitle>
            <Link to="/claims" className="text-xs text-primary hover:underline font-medium">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dedupedClaims.slice(0, 5).map(claim => (
              <Link to={`/claims/${claim.id}`} key={claim.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{claim.title}</p>
                  <p className="text-xs text-muted-foreground">{claim.product_name || 'No product'} · {claim.claim_number || '—'}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <StatusBadge value={claim.severity} type="severity" />
                  <StatusBadge value={claim.status} />
                </div>
              </Link>
            ))}
            {dedupedClaims.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No claims yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Deadlines</CardTitle>
            <Link to="/tasks" className="text-xs text-primary hover:underline font-medium">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.filter(t => t.due_date && t.status !== 'done').sort((a,b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <StatusBadge value={task.priority} type="priority" />
              </div>
            ))}
            {tasks.filter(t => t.due_date && t.status !== 'done').length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No upcoming deadlines</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}