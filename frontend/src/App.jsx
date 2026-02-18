import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

export default function App() {
    const [view, setView] = useState('student');

    return (
        <div className="h-screen w-screen bg-[#FDFDFD] font-sans text-gray-800 flex flex-col overflow-hidden">
            <header className="px-8 py-4 flex justify-between items-center bg-white border-b border-gray-100 z-50 shadow-sm shrink-0">
                <div className="flex items-center gap-1">
                    <h1 className="text-2xl font-bold text-[#252c61] tracking-tight">notifi<span className="text-[#FFB001]">U</span></h1>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-full">
                    <button onClick={() => setView('student')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === 'student' ? 'bg-[#FFB001] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Student</button>
                    <button onClick={() => setView('admin')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${view === 'admin' ? 'bg-[#FFB001] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Admin</button>
                </div>
            </header>
            <main className="flex-1 overflow-hidden p-4 md:p-6 bg-[#F8F9FB]">
                <div className="max-w-7xl mx-auto h-full">
                    {view === 'student' ? <StudentView /> : <AdminView />}
                </div>
            </main>
        </div>
    );
}

function StudentView() {
    const [activeTab, setActiveTab] = useState('chat');
    const [messages, setMessages] = useState([{ role: 'bot', text: 'Hello! I am ready to help you with your university schedule & exams.' }]);
    const [input, setInput] = useState('');
    const [tickets, setTickets] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [seenCount, setSeenCount] = useState(() => Number(localStorage.getItem('notifiu_seen_count') || 0));
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [ticketQuery, setTicketQuery] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => { fetchTickets(); scrollToBottom(); }, [messages, activeTab, isTyping]);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const fetchTickets = async () => { try { const res = await axios.get('http://localhost:5000/api/tickets'); setTickets(res.data); } catch (e) {} };

    const totalResolved = tickets.filter(t => t.status === 'Resolved').length;
    const badgeCount = Math.max(0, totalResolved - seenCount);

    const handleMyTicketsClick = () => { setActiveTab('tickets'); setSeenCount(totalResolved); localStorage.setItem('notifiu_seen_count', totalResolved); };
    const sendMessage = async () => {
        if (!input.trim()) return;
        const text = input; setInput(''); setMessages(prev => [...prev, { role: 'user', text }]); setIsTyping(true);
        try { const res = await axios.post('http://localhost:5000/api/chat', { question: text }); setTimeout(() => { setIsTyping(false); setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }]); }, 600); }
        catch (e) { setIsTyping(false); setMessages(prev => [...prev, { role: 'bot', text: "Connection error." }]); }
    };
    const openTicketModal = () => { setTicketQuery(messages[messages.length - 2]?.text || ""); setIsTicketModalOpen(true); };
    const submitTicket = async () => { if (!ticketQuery.trim()) return; await axios.post('http://localhost:5000/api/tickets', { query: ticketQuery }); alert("Ticket submitted successfully!"); setIsTicketModalOpen(false); fetchTickets(); handleMyTicketsClick(); };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-72 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-fit shrink-0">
                <div className="text-center mb-8"><div className="w-16 h-16 bg-gray-50 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">🎓</div><h3 className="font-bold text-[#252c61]">Welcome Back</h3><p className="text-xs text-gray-400">IT12345678</p></div>
                <nav className="space-y-3">
                    <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-[#FFB001] text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}><HomeIcon /> Chat Assistant</button>
                    <button onClick={handleMyTicketsClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative ${activeTab === 'tickets' ? 'bg-[#FFB001] text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}><TicketIcon /> My Tickets {badgeCount > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full shadow-sm animate-pulse">{badgeCount}</span>}</button>
                </nav>
            </div>
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative h-full">
                {activeTab === 'chat' ? (
                    <>
                        <div className="bg-white p-5 border-b border-gray-50 flex justify-between items-center sticky top-0 z-10 shrink-0"><div><h2 className="text-lg font-bold text-[#252c61]">Live Assistant</h2><p className="text-[10px] text-green-500 font-bold flex items-center gap-1 uppercase">● Online</p></div></div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
                            {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#FFB001] text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'}`}>{m.text}</div></div>))}
                            {isTyping && <div className="flex justify-start"><div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none text-xs text-gray-400 flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span></div></div>}
                            {!isTyping && messages.length > 2 && (messages[messages.length-1].text.includes("ticket") || messages[messages.length-1].text.includes("information")) && <div className="flex justify-center my-2 animate-in zoom-in"><button onClick={openTicketModal} className="bg-red-50 text-red-500 text-xs font-bold px-5 py-2 rounded-full border border-red-100 hover:bg-red-100 transition-colors shadow-sm">Raise Ticket ⚠️</button></div>}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white border-t border-gray-50 shrink-0"><div className="flex items-center gap-2 bg-gray-50 p-2 rounded-full border border-gray-100 focus-within:ring-2 ring-[#FFB001]/20 transition-all"><input className="flex-1 bg-transparent px-4 outline-none text-sm text-gray-700 placeholder-gray-400" placeholder="Type your question..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} /><button onClick={sendMessage} className="bg-[#252c61] text-white p-2.5 rounded-full hover:bg-[#1b204a] transition-colors active:scale-95"><SendIcon /></button></div></div>
                    </>
                ) : (
                    <div className="h-full flex flex-col"><div className="p-8 pb-4 shrink-0"><h2 className="text-xl font-bold text-[#252c61]">Ticket History</h2><p className="text-sm text-gray-400">Track your past inquiries</p></div><div className="flex-1 overflow-y-auto p-8 pt-0 space-y-4">{tickets.length === 0 && <div className="text-center py-10 text-gray-300">No tickets found</div>}{tickets.map(t => (<div key={t._id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"><div className="flex justify-between items-start mb-2"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{t.status}</span><span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span></div><h4 className="font-bold text-[#252c61] mb-2">{t.studentQuery}</h4>{t.adminReply && <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-600 mt-3 border-l-4 border-[#FFB001]"><span className="font-bold block mb-1 text-[#252c61]">Admin Reply:</span>{t.adminReply}</div>}</div>))}</div></div>
                )}
            </div>
            {isTicketModalOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200"><h3 className="text-xl font-bold text-[#252c61] mb-2">Raise a Ticket</h3><p className="text-sm text-gray-500 mb-4">Describe issue for admin.</p><textarea className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-[#FFB001] resize-none" placeholder="Type here..." value={ticketQuery} onChange={e => setTicketQuery(e.target.value)} /><div className="flex gap-3 mt-6"><button onClick={() => setIsTicketModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button><button onClick={submitTicket} className="flex-1 py-3 rounded-xl font-bold bg-[#FFB001] text-white hover:bg-yellow-500 transition-colors shadow-md">Submit Ticket</button></div></div></div>}
        </div>
    );
}

function AdminView() {
    const [tab, setTab] = useState('analytics');
    const [data, setData] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [form, setForm] = useState({ question: '', answer: '' });
    const [editingId, setEditingId] = useState(null);
    const reportRef = useRef();

    useEffect(() => {
        if (tab === 'analytics') fetchAnalytics();
        else fetchData();
    }, [tab]);

    const fetchData = async () => { try { const res = await axios.get(tab === 'tickets' ? 'http://localhost:5000/api/tickets' : 'http://localhost:5000/api/faqs'); setData(res.data); } catch(e) {} };
    const fetchAnalytics = async () => { try { const res = await axios.get('http://localhost:5000/api/analytics'); setAnalytics(res.data); } catch(e) {} };

    const handleDownloadPDF = async () => {
        const element = reportRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const data = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProperties = pdf.getImageProperties(data);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('NotifiU_Analytics_Report.pdf');
    };

    const saveFaq = async () => {
        if (!form.question || !form.answer) return;
        if (editingId) await axios.put(`http://localhost:5000/api/faqs/${editingId}`, form);
        else await axios.post('http://localhost:5000/api/faqs', form);
        setForm({ question: '', answer: '' }); setEditingId(null); fetchData();
    };

    const handleEdit = (faq) => { setForm({ question: faq.question, answer: faq.answer }); setEditingId(faq._id); };
    const cancelEdit = () => { setForm({ question: '', answer: '' }); setEditingId(null); };
    const deleteFaq = async (id) => { if(confirm("Are you sure?")) { await axios.delete(`http://localhost:5000/api/faqs/${id}`); fetchData(); if (editingId === id) cancelEdit(); } };
    const resolve = async (id, q) => { const reply = prompt(`Reply to: ${q}`); if (reply) { await axios.put(`http://localhost:5000/api/tickets/${id}`, { status: 'Resolved', adminReply: reply }); fetchData(); } };

    const COLORS = ['#FFB001', '#252c61', '#FF8042'];

    return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex border-b border-gray-100 shrink-0">
                <button onClick={() => setTab('analytics')} className={`flex-1 py-4 text-sm font-bold transition-colors ${tab === 'analytics' ? 'text-[#FFB001] border-b-2 border-[#FFB001]' : 'text-gray-400 hover:text-gray-600'}`}>Analytics </button>
                <button onClick={() => setTab('tickets')} className={`flex-1 py-4 text-sm font-bold transition-colors ${tab === 'tickets' ? 'text-[#FFB001] border-b-2 border-[#FFB001]' : 'text-gray-400 hover:text-gray-600'}`}>Student Tickets</button>
                <button onClick={() => setTab('faqs')} className={`flex-1 py-4 text-sm font-bold transition-colors ${tab === 'faqs' ? 'text-[#FFB001] border-b-2 border-[#FFB001]' : 'text-gray-400 hover:text-gray-600'}`}>Manage FAQs</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
                {tab === 'analytics' && analytics ? (
                    <div className="space-y-6 animate-in fade-in">

                        <div className="flex justify-end">
                            <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-[#252c61] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1b204a] transition-all shadow-md">
                                <DownloadIcon /> Export PDF Report
                            </button>
                        </div>

                        <div ref={reportRef} className="bg-[#FAFAFA] p-4">
                            <h2 className="text-2xl font-bold text-[#252c61] mb-6 text-center">System Performance Report</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Interactions</p>
                                    <h3 className="text-3xl font-black text-[#252c61] mt-2">{analytics.totalInteractions}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Tickets</p>
                                    <h3 className="text-3xl font-black text-[#FFB001] mt-2">{analytics.totalTickets}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Unanswered</p>
                                    <h3 className="text-3xl font-black text-red-500 mt-2">{analytics.unansweredCount}</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[350px]">
                                    <h4 className="font-bold text-[#252c61] mb-4">🔥 Trending Questions</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.topQuestions} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="_id" width={150} tick={{fontSize: 10}} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#FFB001" radius={[0, 10, 10, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[350px]">
                                    <h4 className="font-bold text-[#252c61] mb-4">📊 Interaction Volume</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Chats', value: analytics.totalInteractions },
                                                    { name: 'Tickets', value: analytics.totalTickets }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {[{ name: 'Chats', value: analytics.totalInteractions }, { name: 'Tickets', value: analytics.totalTickets }].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-[#252c61] mb-4">❓ Unanswered Queries (Knowledge Gaps)</h4>
                                <div className="space-y-2">
                                    {analytics.unansweredLogs.map((log, i) => (
                                        <div key={i} className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-700">"{log.userQuery}"</span>
                                            <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                    {analytics.unansweredLogs.length === 0 && <p className="text-sm text-gray-400">No data.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : tab === 'tickets' ? (
                    <div className="space-y-3">
                        {data.map(t => (
                            <div key={t._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div><div className="flex items-center gap-2 mb-1"><div className={`w-2 h-2 rounded-full ${t.status === 'Resolved' ? 'bg-green-500' : 'bg-yellow-500'}`}></div><span className="font-bold text-[#252c61]">{t.studentQuery}</span></div><p className="text-xs text-gray-500 pl-4">{t.adminReply ? `Reply: ${t.adminReply}` : 'No reply yet'}</p></div>
                                {t.status !== 'Resolved' && <button onClick={() => resolve(t._id, t.studentQuery)} className="bg-[#252c61] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#1b204a]">Resolve</button>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                            <h3 className="font-bold text-[#252c61] mb-4">{editingId ? '✏️ Edit FAQ' : '+ Add FAQ'}</h3>
                            <input className="w-full bg-gray-50 p-3 rounded-xl text-sm mb-3 outline-none focus:ring-1 ring-[#FFB001]" placeholder="Question" value={form.question} onChange={e => setForm({...form, question: e.target.value})} />
                            <textarea className="w-full bg-gray-50 p-3 rounded-xl text-sm mb-4 outline-none h-24 focus:ring-1 ring-[#FFB001]" placeholder="Answer" value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} />
                            <div className="flex gap-2"><button onClick={saveFaq} className="flex-1 bg-[#FFB001] text-white py-3 rounded-xl font-bold hover:bg-yellow-500 transition-colors">{editingId ? 'Update' : 'Add'}</button>{editingId && <button onClick={cancelEdit} className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200">Cancel</button>}</div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            {data.map(f => (
                                <div key={f._id} className={`bg-white p-5 rounded-2xl border flex justify-between group transition-colors ${editingId === f._id ? 'border-[#FFB001] bg-yellow-50' : 'border-gray-100 hover:border-[#FFB001]'}`}>
                                    <div className="pr-4"><p className="font-bold text-[#252c61] text-sm">{f.question}</p><p className="text-sm text-gray-500 mt-1">{f.answer}</p></div>
                                    <div className="flex items-start gap-2"><button onClick={() => handleEdit(f)} className="text-gray-300 hover:text-[#FFB001] p-1"><EditIcon /></button><button onClick={() => deleteFaq(f._id)} className="text-gray-300 hover:text-red-500 p-1"><TrashIcon /></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}