import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import {
    CheckCircle2, Circle, AlertCircle, Plus, Trash2, Calendar,
    Bot, PhoneCall, Search, Tag, Filter, CheckSquare, Loader2,
    Clock, Check, LayoutGrid, ListTodo, MoreHorizontal, ArrowRight,
    Download, FileText, Sparkles, Activity, CheckCircle, ArrowUpRight
} from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

interface Agent {
    id: string;
    agentName: string;
    name?: string;
}

interface Campaign {
    id: number;
    name: string;
}

interface Subtask {
    text: string;
    done: boolean;
}

interface TodoItem {
    id: number;
    title: string;
    description?: string;
    priority: string;
    status: string;
    category: string;
    due_date?: string;
    agent_id?: string;
    agent_name?: string;
    campaign_id?: number;
    campaign_name?: string;
    subtasks?: string;
    created_at: string;
}

interface ActivityLog {
    id: number;
    todo_id: number;
    action: string;
    details?: string;
    timestamp: string;
}

export function TodoList() {
    const [loading, setLoading] = useState(true);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [showActivityDrawer, setShowActivityDrawer] = useState(false);

    // Filter States
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [priorityFilter, setPriorityFilter] = useState<string>('All');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Subtask Input buffer mapping
    const [subtaskInputs, setSubtaskInputs] = useState<Record<number, string>>({});

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Pending',
        category: 'General',
        due_date: '',
        agent_id: '',
        campaign_id: ''
    });

    const [submitting, setSubmitting] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const todosRes = await apiClient.get('/todos/');
            setTodos(todosRes.data?.data || []);

            const agentsRes = await apiClient.get('/agents/');
            setAgents(agentsRes.data?.data || []);

            const campaignsRes = await apiClient.get('/campaigns');
            const campData = campaignsRes.data?.data || campaignsRes.data || [];
            if (Array.isArray(campData)) {
                setCampaigns(campData);
            }

            const activitiesRes = await apiClient.get('/todos/activities');
            setActivities(activitiesRes.data?.data || []);
        } catch (err: any) {
            console.error("Failed to load advanced todos workspace:", err);
            toast.error("Failed to sync tasks pipeline.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Form Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error("Please enter a task title.");
            return;
        }

        setSubmitting(true);
        try {
            const selectedAgent = agents.find(a => a.id === formData.agent_id);
            const selectedAgentName = selectedAgent ? (selectedAgent.agentName || selectedAgent.name) : undefined;

            const selectedCamp = campaigns.find(c => c.id === parseInt(formData.campaign_id));
            const selectedCampName = selectedCamp ? selectedCamp.name : undefined;

            const payload = {
                title: formData.title,
                description: formData.description || undefined,
                priority: formData.priority,
                status: formData.status,
                category: formData.category,
                due_date: formData.due_date || undefined,
                agent_id: formData.agent_id || undefined,
                agent_name: selectedAgentName || undefined,
                campaign_id: formData.campaign_id ? parseInt(formData.campaign_id) : undefined,
                campaign_name: selectedCampName || undefined,
                subtasks: "[]"
            };

            await apiClient.post('/todos/', payload);
            toast.success("Task added successfully.");
            setShowAddForm(false);
            setFormData({
                title: '',
                description: '',
                priority: 'Medium',
                status: 'Pending',
                category: 'General',
                due_date: '',
                agent_id: '',
                campaign_id: ''
            });
            fetchData();
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to add task.");
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle Todo Status Quick Action
    const toggleTodoStatus = async (todo: TodoItem) => {
        const nextStatus = todo.status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await apiClient.patch(`/todos/${todo.id}`, { status: nextStatus });
            toast.success(nextStatus === 'Completed' ? "Task marked completed" : "Task re-opened");
            fetchData();
        } catch (err) {
            toast.error("Failed to update status.");
        }
    };

    // Delete Todo
    const handleDelete = async (id: number) => {
        try {
            await apiClient.delete(`/todos/${id}`);
            toast.success("Task deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete task.");
        }
    };

    // Subtask Management Logic
    const handleAddSubtask = async (todo: TodoItem) => {
        const subtaskText = subtaskInputs[todo.id] || '';
        if (!subtaskText.trim()) return;

        let subtasksArray: Subtask[] = [];
        try {
            subtasksArray = JSON.parse(todo.subtasks || '[]');
        } catch {
            subtasksArray = [];
        }

        const updatedSubtasks = [...subtasksArray, { text: subtaskText.trim(), done: false }];

        try {
            await apiClient.patch(`/todos/${todo.id}`, {
                subtasks: JSON.stringify(updatedSubtasks)
            });
            setSubtaskInputs({ ...subtaskInputs, [todo.id]: '' });
            fetchData();
        } catch (e) {
            toast.error("Failed to add subtask.");
        }
    };

    const handleToggleSubtask = async (todo: TodoItem, index: number) => {
        let subtasksArray: Subtask[] = [];
        try {
            subtasksArray = JSON.parse(todo.subtasks || '[]');
        } catch {
            subtasksArray = [];
        }

        subtasksArray[index].done = !subtasksArray[index].done;

        try {
            await apiClient.patch(`/todos/${todo.id}`, {
                subtasks: JSON.stringify(subtasksArray)
            });
            fetchData();
        } catch (e) {
            toast.error("Failed to update subtask.");
        }
    };

    const handleDeleteSubtask = async (todo: TodoItem, index: number) => {
        let subtasksArray: Subtask[] = [];
        try {
            subtasksArray = JSON.parse(todo.subtasks || '[]');
        } catch {
            subtasksArray = [];
        }

        subtasksArray.splice(index, 1);

        try {
            await apiClient.patch(`/todos/${todo.id}`, {
                subtasks: JSON.stringify(subtasksArray)
            });
            fetchData();
        } catch (e) {
            toast.error("Failed to delete subtask.");
        }
    };

    // CSV Export Logic
    const handleExportCSV = () => {
        if (todos.length === 0) {
            toast.error("No tasks to export.");
            return;
        }

        const headers = ["ID", "Title", "Description", "Priority", "Status", "Category", "Due Date", "Agent Name", "Campaign Name", "Created At"];
        const rows = todos.map(t => [
            t.id,
            `"${t.title.replace(/"/g, '""')}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.priority,
            t.status,
            t.category,
            t.due_date || "",
            t.agent_name || "",
            t.campaign_name || "",
            t.created_at
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Export started.");
    };

    // Markdown Export Logic
    const handleExportMarkdown = () => {
        if (todos.length === 0) {
            toast.error("No tasks to export.");
            return;
        }

        let markdown = `# Tasks Export - ${new Date().toLocaleDateString()}\n\n`;

        const pending = todos.filter(t => t.status !== 'Completed');
        const completed = todos.filter(t => t.status === 'Completed');

        markdown += `## Pending Tasks\n\n`;
        pending.forEach(t => {
            markdown += `* **[ ] ${t.title}** (Priority: ${t.priority} | Category: ${t.category})\n`;
            if (t.description) markdown += `  *Description:* ${t.description}\n`;
            if (t.due_date) markdown += `  *Due:* ${t.due_date}\n`;
            let subs: Subtask[] = [];
            try { subs = JSON.parse(t.subtasks || '[]'); } catch { }
            if (subs.length > 0) {
                markdown += `  *Checklist:*\n`;
                subs.forEach(s => {
                    markdown += `    - [${s.done ? 'x' : ' '}] ${s.text}\n`;
                });
            }
        });

        markdown += `\n## Completed Tasks\n\n`;
        completed.forEach(t => {
            markdown += `* **[x] ${t.title}** (Category: ${t.category})\n`;
        });

        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `tasks_pipeline_${new Date().toISOString().split('T')[0]}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Markdown Export started.");
    };

    // Priority color utility - calm, clean borders and text weights
    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'SOS':
                return { text: 'text-red-700 bg-red-50 border-red-200 animate-pulse font-extrabold', dot: 'bg-red-600', bar: 'border-red-600' };
            case 'Urgent':
                return { text: 'text-rose-600 bg-rose-50 border-rose-100', dot: 'bg-rose-500', bar: 'border-rose-450' };
            case 'High':
                return { text: 'text-amber-600 bg-amber-50 border-amber-100', dot: 'bg-amber-500', bar: 'border-amber-450' };
            case 'Medium':
                return { text: 'text-blue-600 bg-blue-50 border-blue-100', dot: 'bg-blue-500', bar: 'border-blue-450' };
            case 'Low':
            default:
                return { text: 'text-slate-650 bg-slate-50 border-slate-200', dot: 'bg-slate-400', bar: 'border-slate-300' };
        }
    };

    // Category Colors
    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Lead Follow-up': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Agent Tuning': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Campaign Prep': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Maintenance': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'General':
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const isOverdue = (dateStr?: string) => {
        if (!dateStr) return false;
        const due = new Date(dateStr);
        due.setHours(23, 59, 59, 999);
        return due.getTime() < Date.now();
    };

    // Filtering list
    const filteredTodos = todos.filter(todo => {
        const matchesStatus = statusFilter === 'All' || todo.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || todo.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'All' || todo.category === categoryFilter;
        const matchesSearch = searchQuery === '' ||
            todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
    });

    // Calculate Metrics
    const totalCount = todos.length;
    const pendingCount = todos.filter(t => t.status !== 'Completed').length;
    const completedCount = todos.filter(t => t.status === 'Completed').length;
    const urgentCount = todos.filter(t => t.priority === 'Urgent' && t.status !== 'Completed').length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <MainLayout>
            <div className="p-8 max-w-6xl mx-auto w-full space-y-6 text-slate-805">

                {/* Page Title & Controls - Calm & Spaced */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <ListTodo size={24} className="text-[#0a8ea0]" /> Tasks Dashboard
                        </h1>
                        <p className="text-[13px] text-slate-500 mt-0.5 font-normal">
                            Manage campaign checklists, AI prompt iterations, and telephony mappings.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setShowActivityDrawer(!showActivityDrawer)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-lg text-xs transition-all font-medium"
                        >
                            <Activity size={14} className="text-[#0a8ea0]" /> History
                        </button>

                        <div className="relative group">
                            <button
                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-lg text-xs transition-all font-medium"
                            >
                                <Download size={14} /> Export
                            </button>

                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-150 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 py-1 flex flex-col">
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 font-medium"
                                >
                                    <FileText size={13} className="text-blue-500" /> Export CSV
                                </button>
                                <button
                                    onClick={handleExportMarkdown}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 font-medium"
                                >
                                    <FileText size={13} className="text-purple-500" /> Export Markdown
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#0a8ea0] hover:bg-[#077a8a] text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Plus size={15} /> Add Task
                        </button>
                    </div>
                </div>

                {/* Dynamic Aggregated Metrics Row - Calm Grey Outlines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-150 flex items-center justify-center shrink-0">
                            <CheckSquare size={16} className="text-slate-500" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total</div>
                            <div className="text-xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-150 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Pending</div>
                            <div className="text-xl font-bold text-slate-900 mt-0.5">{pendingCount}</div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-150 flex items-center justify-center shrink-0">
                            <AlertCircle size={16} className="text-rose-500" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Urgent</div>
                            <div className="text-xl font-bold text-slate-900 mt-0.5">{urgentCount}</div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Progress</span>
                            <span className="text-xs font-bold text-emerald-700 bg-[#e6f4ea] px-1.5 py-0.25 rounded-md">{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                </div>

                {/* Audit Log Activity Feed Drawer */}
                {showActivityDrawer && (
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-lg animate-in slide-in-from-top-3 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                            <h3 className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                                <Activity size={14} className="text-cyan-400" /> Activity History (Audit Trail)
                            </h3>
                            <button
                                onClick={() => setShowActivityDrawer(false)}
                                className="text-slate-400 hover:text-white text-xs font-medium px-2 py-0.5 bg-slate-800 rounded transition-colors"
                            >
                                Close Logs
                            </button>
                        </div>

                        {activities.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No activity registered today.</p>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] scrollbar-thin scrollbar-thumb-slate-800">
                                {activities.map(act => (
                                    <div key={act.id} className="flex justify-between items-start gap-4 p-1.5 bg-slate-850/40 rounded border border-slate-750/30">
                                        <div>
                                            <span className={`px-1 rounded text-[8px] font-bold uppercase mr-1.5 ${act.action === 'Created' ? 'bg-green-500/10 text-green-400' :
                                                act.action === 'Toggled Status' ? 'bg-cyan-500/10 text-cyan-400' :
                                                    act.action === 'Deleted' ? 'bg-red-500/10 text-red-400' : 'bg-slate-720 text-slate-400'
                                                }`}>
                                                {act.action}
                                            </span>
                                            <span className="text-slate-300">{act.details}</span>
                                        </div>
                                        <span className="text-slate-500 shrink-0">{new Date(act.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Expandable Form - Clean Inputs */}
                {showAddForm && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 animate-in slide-in-from-top-4 duration-200">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                            <CheckSquare size={16} className="text-[#0a8ea0]" /> Add New Task
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Task Title <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Optimize Telemarketing Prompt parameters"
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-850 focus:outline-none focus:border-[#0a8ea0] transition-colors"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Description / Actions</label>
                                    <textarea
                                        rows={2}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Provide any instructions or links..."
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-850 focus:outline-none focus:border-[#0a8ea0] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0a8ea0]"
                                    >
                                        <option value="SOS">🆘 SOS Critical</option>
                                        <option value="Urgent">🚨 Urgent</option>
                                        <option value="High">🟠 High</option>
                                        <option value="Medium">🔵 Medium</option>
                                        <option value="Low">⚪ Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0a8ea0]"
                                    >
                                        <option value="General">General</option>
                                        <option value="Lead Follow-up">Lead Follow-up</option>
                                        <option value="Agent Tuning">Agent Tuning</option>
                                        <option value="Campaign Prep">Campaign Prep</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0a8ea0]"
                                    />
                                </div>

                                <div className="opacity-0 pointer-events-none h-0 hidden md:block"></div>

                                {/* Relational Bindings */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Link to AI Agent</label>
                                    <select
                                        value={formData.agent_id}
                                        onChange={e => setFormData({ ...formData, agent_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-650 focus:outline-none focus:border-[#0a8ea0]"
                                    >
                                        <option value="">None (General Task)</option>
                                        {agents.map(a => (
                                            <option key={a.id} value={a.id}>{a.agentName || a.name || 'Unnamed Agent'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Link to Campaign</label>
                                    <select
                                        value={formData.campaign_id}
                                        onChange={e => setFormData({ ...formData, campaign_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-650 focus:outline-none focus:border-[#0a8ea0]"
                                    >
                                        <option value="">None (General Task)</option>
                                        {campaigns.map(c => (
                                            <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-[#0a8ea0] hover:bg-[#077a8a] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Live Filter Bar - Calm & Subtle */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
                    <div className="relative w-full md:w-72">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:outline-none focus:border-[#0a8ea0] bg-slate-50/30"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">

                        <div className="flex bg-slate-100/50 border border-slate-150 rounded-lg p-0.5 shrink-0">
                            {['All', 'Pending', 'Completed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${statusFilter === status ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Priority:</span>
                            <select
                                value={priorityFilter}
                                onChange={e => setPriorityFilter(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-650"
                            >
                                <option value="All">All</option>
                                <option value="SOS">🆘 SOS Critical</option>
                                <option value="Urgent">🚨 Urgent</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Category:</span>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-650"
                            >
                                <option value="All">All Categories</option>
                                <option value="General">General</option>
                                <option value="Lead Follow-up">Lead Followups</option>
                                <option value="Agent Tuning">Agent Tuning</option>
                                <option value="Campaign Prep">Campaign Prep</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>

                    </div>
                </div>

                {/* Tasks Container */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200">
                        <Loader2 size={24} className="animate-spin text-[#0a8ea0] mb-2" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Syncing workspace...</p>
                    </div>
                ) : filteredTodos.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                        <ListTodo size={36} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="text-sm font-bold text-slate-700">Clear Workspace</h3>
                        <p className="text-[11px] text-slate-450 mt-1 max-w-xs mx-auto">
                            No tasks matched filtering logic. Launch new actions above to populate cards.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTodos.map(todo => {
                            const styles = getPriorityStyle(todo.priority);
                            const catClass = getCategoryColor(todo.category);
                            const isOver = todo.status !== 'Completed' && isOverdue(todo.due_date);

                            let subtasksList: Subtask[] = [];
                            try {
                                subtasksList = JSON.parse(todo.subtasks || '[]');
                            } catch (_) {
                                subtasksList = [];
                            }

                            const subtaskProgress = subtasksList.length > 0
                                ? Math.round((subtasksList.filter(s => s.done).length / subtasksList.length) * 100)
                                : 0;

                            return (
                                <div
                                    key={todo.id}
                                    className={`bg-white rounded-xl border ${todo.status === 'Completed' ? 'border-slate-150 bg-slate-50/20' : 'border-slate-200'} border-l-4 ${styles.bar} shadow-xs flex flex-col hover:border-slate-350 transition-all duration-150 group`}
                                >

                                    <div className="p-4.5 flex-1 space-y-3.5">
                                        <div className="flex items-start justify-between gap-3">

                                            <div className="flex flex-wrap gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${styles.text} flex items-center gap-1`}>
                                                    <div className={`w-1 h-1 rounded-full ${styles.dot}`}></div>
                                                    {todo.priority}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${catClass}`}>
                                                    {todo.category}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => toggleTodoStatus(todo)}
                                                className={`p-0.5 rounded transition-colors ${todo.status === 'Completed' ? 'text-emerald-500 hover:text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {todo.status === 'Completed' ? <CheckCircle2 size={18} className="fill-emerald-50 bg-white rounded-full" /> : <Circle size={18} />}
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className={`text-[13px] font-bold leading-normal ${todo.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                {todo.title}
                                            </h4>
                                            {todo.description && (
                                                <p className={`text-[11px] font-medium leading-relaxed ${todo.status === 'Completed' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {todo.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Checklist Subtasks */}
                                        <div className="pt-2.5 border-t border-slate-100 space-y-2">
                                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span>Checklist</span>
                                                {subtasksList.length > 0 && <span className="text-[#0a8ea0]">{subtaskProgress}% done</span>}
                                            </div>

                                            {subtasksList.length > 0 && (
                                                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                                    {subtasksList.map((st, i) => (
                                                        <div key={i} className="flex items-center justify-between group/sub">
                                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={st.done}
                                                                    onChange={() => handleToggleSubtask(todo, i)}
                                                                    className="w-3 h-3 rounded border-slate-300 text-[#0a8ea0] focus:ring-0"
                                                                />
                                                                <span className={`text-[11px] font-medium ${st.done ? 'line-through text-slate-400' : 'text-slate-650'}`}>
                                                                    {st.text}
                                                                </span>
                                                            </label>

                                                            <button
                                                                onClick={() => handleDeleteSubtask(todo, i)}
                                                                className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/sub:opacity-100 shrink-0"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-1.5 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="New subitem..."
                                                    value={subtaskInputs[todo.id] || ''}
                                                    onChange={e => setSubtaskInputs({ ...subtaskInputs, [todo.id]: e.target.value })}
                                                    className="flex-1 px-2 py-0.5 text-[10.5px] border border-slate-200 rounded focus:outline-none focus:border-[#0a8ea0] bg-slate-50/50"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddSubtask(todo);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleAddSubtask(todo)}
                                                    className="px-2 py-0.5 bg-[#0a8ea0]/10 hover:bg-[#0a8ea0] text-[#0a8ea0] hover:text-white rounded text-[10px] font-semibold transition-colors"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        {/* Date info & alert check */}
                                        {todo.due_date && (
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <Calendar size={12} className={isOver ? 'text-rose-500' : 'text-slate-400'} />
                                                <span className={`text-[10px] font-bold ${isOver ? 'text-rose-600' : 'text-slate-500'}`}>
                                                    {todo.due_date} {isOver && <span className="text-[8px] bg-rose-50 border border-rose-100 text-rose-500 px-1 py-0.25 rounded font-extrabold ml-1">Overdue</span>}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Relational footer */}
                                    {(todo.agent_id || todo.campaign_id) && (
                                        <div className="px-4.5 py-2.5 bg-slate-50/30 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-0.5">Link:</span>

                                            {todo.agent_id && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 shadow-xs truncate max-w-[120px]" title={todo.agent_name}>
                                                    <Bot size={11} className="text-[#0a8ea0] shrink-0" />
                                                    <span className="truncate">{todo.agent_name || 'Agent'}</span>
                                                </div>
                                            )}

                                            {todo.campaign_id && (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 shadow-xs truncate max-w-[120px]" title={todo.campaign_name}>
                                                    <PhoneCall size={11} className="text-blue-500 shrink-0" />
                                                    <span className="truncate">{todo.campaign_name || 'Campaign'}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Card bottom info tray */}
                                    <div className="px-4.5 py-2 border-t border-slate-100 bg-white flex justify-between items-center group-hover:bg-slate-50/50 transition-colors">
                                        <span className="text-[9px] font-semibold text-slate-405">Created {new Date(todo.created_at).toLocaleDateString()}</span>
                                        <button
                                            onClick={() => handleDelete(todo.id)}
                                            className="text-slate-400 hover:text-rose-600 transition-colors"
                                            title="Delete task"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </MainLayout>
    );
}
