import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import chatbotService from '../../services/chatbotService';
import { MessageSquare, X, Send, RotateCcw, Trash2, Plus, History, ChevronLeft, UserCheck, Monitor, PenTool, Coffee, ArrowRight } from 'lucide-react';
import './AIChatWidget.css';

const AIChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('disconnected'); // disconnected | connected | error
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        if (!sessionId) return;
        try {
            const result = await chatbotService.getConversations(sessionId);
            if (result.success) {
                setConversations(result.conversations);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    }, [sessionId]);

    useEffect(() => {
        if (isHistoryOpen) {
            fetchConversations();
        }
    }, [isHistoryOpen, fetchConversations]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }

        // Auto-connect if open and not connected
        if (isOpen && status === 'disconnected' && !sessionId && !isConnecting) {
            handleAutoConnect();
        }
    }, [isOpen, status, sessionId, isConnecting]);

    useEffect(() => {
        // WebSocket for real-time updates
        const socketUrl = 'ws://localhost:8000/ws';
        let socket = null;
        let reconnectTimer = null;

        const connect = () => {
            console.log('Connecting to real-time updates WebSocket...');
            socket = new WebSocket(socketUrl);

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Real-time update received:', data);
                    if (data.type === 'refresh') {
                        // Dispatch a global event that other components can listen to
                        window.dispatchEvent(new CustomEvent('dashboard-refresh', { detail: data }));
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket disconnected. Reconnecting in 5s...');
                socket = null;
                reconnectTimer = setTimeout(connect, 5000);
            };

            socket.onerror = (err) => {
                console.error('WebSocket error:', err);
                socket.close();
            };
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []);

    const handleAutoConnect = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setConnectionError('Main session not found. Please re-login.');
            setStatus('error');
            return;
        }

        setIsConnecting(true);
        setConnectionError('');
        setStatus('connecting');

        try {
            const result = await chatbotService.tokenLogin(token);
            if (result.success && result.session_id) {
                setSessionId(result.session_id);
                setStatus('connected');
                setMessages([]);
            } else {
                setConnectionError(result.message || 'Auto-login failed.');
                setStatus('error');
            }
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Cannot reach chatbot server';
            setConnectionError(msg);
            setStatus('error');
        } finally {
            setIsConnecting(false);
        }
    };

    // Don't render anything if user is not logged in
    if (!user) return null;

    const handleConnect = async (e) => {
        e?.preventDefault();
        if (!password.trim()) {
            setConnectionError('Please enter your password');
            return;
        }

        setIsConnecting(true);
        setConnectionError('');

        try {
            const result = await chatbotService.login(user.email, password);
            if (result.success && result.session_id) {
                setSessionId(result.session_id);
                setStatus('connected');
                setPassword('');
                setMessages([]);
            } else {
                setConnectionError(result.message || 'Login failed. Check your password.');
                setStatus('error');
            }
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Cannot reach chatbot server';
            setConnectionError(msg);
            setStatus('error');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !sessionId || isLoading) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const result = await chatbotService.sendMessage(sessionId, text);
            if (result.success) {
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: result.message,
                    agent: result.agent_used,
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: result.message || 'Sorry, something went wrong. Please try again.',
                }]);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: 'Session expired. Please reconnect.',
                }]);
                setSessionId(null);
                setStatus('disconnected');
            } else {
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: '⚠️ Failed to get a response. The chatbot server may be down.',
                }]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearHistory = async () => {
        if (!sessionId) return;
        try {
            await chatbotService.logout(sessionId);
        } catch { /* ignore */ }
        setMessages([]);
        setSessionId(null);
        setStatus('disconnected');
    };

    const handleReconnect = () => {
        setConnectionError('');
        setStatus('disconnected');
        setSessionId(null);
        setMessages([]);
        setIsHistoryOpen(false);
    };

    const handleNewChat = async () => {
        if (!sessionId || isLoading) return;
        try {
            setIsLoading(true);
            const result = await chatbotService.startNewChat(sessionId);
            if (result.success) {
                setMessages([]);
                setIsHistoryOpen(false);
            }
        } catch (err) {
            console.error('Error starting new chat:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadConversation = async (conv) => {
        if (!sessionId || isLoading) return;
        try {
            setIsLoading(true);
            setIsHistoryOpen(false);
            const loadResult = await chatbotService.loadConversation(sessionId, conv.id);
            if (loadResult.success) {
                const historyResult = await chatbotService.getConversationMessages(sessionId, conv.id);
                if (historyResult.success) {
                    setMessages(historyResult.messages.map(m => ({
                        role: m.role,
                        content: m.content,
                        agent: m.agent_used
                    })));
                }
            }
        } catch (err) {
            console.error('Error loading conversation:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePanel = () => {
        setIsOpen(prev => !prev);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                className={`ai-chat-fab ${isOpen ? 'open' : ''}`}
                onClick={togglePanel}
                title={isOpen ? 'Close chat' : 'Chat with AI'}
                id="ai-chat-fab"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="ai-chat-panel" id="ai-chat-panel">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-left">
                            <div className="ai-chat-avatar">🤖</div>
                            <div className="ai-chat-header-info">
                                <h3>CYGNET<span style={{ color: '#FFB012' }}>.AI</span></h3>
                                <p>{status === 'connected' ? '● Online' : '○ Offline'}</p>
                            </div>
                        </div>
                        <div className="ai-chat-header-actions">
                            {sessionId && (
                                <>
                                    <button
                                        className="ai-chat-header-btn"
                                        onClick={handleNewChat}
                                        title="Start new chat"
                                        disabled={isLoading}
                                    >
                                        <Plus size={16} />
                                    </button>
                                    <button
                                        className={`ai-chat-header-btn ${isHistoryOpen ? 'active' : ''}`}
                                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                        title="View chat history"
                                    >
                                        <History size={16} />
                                    </button>
                                    <button
                                        className="ai-chat-header-btn"
                                        onClick={handleClearHistory}
                                        title="Delete session"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                            {status === 'error' && (
                                <button
                                    className="ai-chat-header-btn"
                                    onClick={handleReconnect}
                                    title="Retry connection"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Body — connecting or messages */}
                    {!sessionId ? (
                        <div className="ai-chat-login-prompt">
                            <div className="icon">{status === 'error' ? '❌' : '🚀'}</div>
                            <h4>{status === 'error' ? 'Connection Failed' : 'Connecting to AI...'}</h4>
                            <p>
                                {status === 'error'
                                    ? connectionError
                                    : `Authenticating ${user.email}...`}
                            </p>

                            {status === 'error' && (
                                <button
                                    onClick={handleAutoConnect}
                                    className="ai-chat-connect-btn"
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? 'Retrying…' : '🔄 Retry Connection'}
                                </button>
                            )}

                            {isConnecting && (
                                <div className="ai-chat-typing" style={{ marginTop: '20px' }}>
                                    <div className="ai-chat-typing-dot" />
                                    <div className="ai-chat-typing-dot" />
                                    <div className="ai-chat-typing-dot" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="ai-chat-body-container">
                            {/* History Overlay */}
                            {isHistoryOpen && (
                                <div className="ai-chat-history-pane">
                                    <div className="history-header">
                                        <h4>Chat History</h4>
                                        <button onClick={() => setIsHistoryOpen(false)} title="Back to chat"><ChevronLeft size={16} /></button>
                                    </div>
                                    <div className="history-list">
                                        {conversations.length === 0 ? (
                                            <div className="no-history">No past conversations found.</div>
                                        ) : (
                                            conversations.map(conv => (
                                                <div
                                                    key={conv.id}
                                                    className={`history-item ${messages.length > 0 && messages[0].id === conv.id ? 'active' : ''}`}
                                                    onClick={() => handleLoadConversation(conv)}
                                                >
                                                    <div className="history-title">{conv.title}</div>
                                                    <div className="history-date">
                                                        {new Date(conv.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Messages Area or Empty State */}
                            <div className={`ai-chat-main-area relative flex flex-col h-full bg-white ${isHistoryOpen ? 'dimmed' : ''}`}>
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10 bg-[#FAFAFA]">
                                        <h2 className="text-[2rem] leading-tight font-serif text-[#1a367c] mb-2 text-center" style={{ fontFamily: 'serif' }}>
                                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},<br />
                                            {user.first_name || user.name?.split(' ')[0] || 'there'}
                                        </h2>
                                        <p className="text-[0.6rem] font-bold text-[#8ba3c7] tracking-[0.2em] uppercase mb-8">Task Automation Suite</p>

                                        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-4 w-full mb-8 relative flex flex-col min-h-[120px]">
                                            <textarea
                                                className="w-full text-slate-600 outline-none resize-none pt-2 pb-6 px-1 text-base placeholder:text-slate-300 bg-transparent flex-1"
                                                placeholder="Tell me what you need done..."
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                            />
                                            <div className="flex justify-between items-center mt-auto">
                                                <div className="bg-[#FAFAFA] text-slate-500 text-[0.65rem] font-bold px-4 py-2 rounded-full border border-slate-100 flex items-center gap-2">
                                                    CYGNET 2.5 <ChevronLeft size={10} className="-rotate-90" />
                                                </div>
                                                <button
                                                    onClick={handleSend}
                                                    disabled={!inputText.trim() || isLoading}
                                                    className="bg-[#FAFAFA] hover:bg-slate-100 p-2.5 rounded-full text-slate-300 hover:text-slate-500 disabled:opacity-50 transition-colors"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                                            {[
                                                { id: 'Attendance', icon: <UserCheck size={14} />, prompt: "I need to check my attendance for this week." },
                                                { id: 'Desk', icon: <Monitor size={14} />, prompt: "I want to book a desk for tomorrow." },
                                                { id: 'IT Support', icon: <PenTool size={14} />, prompt: "I have an issue with my laptop and need IT support." },
                                                { id: 'Cafeteria', icon: <Coffee size={14} />, prompt: "What's on the cafeteria menu today?" }
                                            ].map(service => (
                                                <button
                                                    key={service.id}
                                                    onClick={() => {
                                                        setInputText(service.prompt);
                                                        setTimeout(() => {
                                                            if (inputRef.current) inputRef.current.focus();
                                                        }, 10);
                                                    }}
                                                    className="bg-white border border-slate-100 rounded-full py-3 px-3 text-[0.75rem] font-bold text-[#1a367c] flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-colors"
                                                >
                                                    {service.icon} <span className="truncate">{service.id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="ai-chat-messages flex-1">
                                            {messages.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`ai-chat-msg ${msg.role === 'user' ? 'user' : msg.role === 'system' ? 'system' : 'bot'}`}
                                                >
                                                    {msg.content}
                                                </div>
                                            ))}
                                            {isLoading && (
                                                <div className="ai-chat-typing">
                                                    <div className="ai-chat-typing-dot" />
                                                    <div className="ai-chat-typing-dot" />
                                                    <div className="ai-chat-typing-dot" />
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input area for active chat */}
                                        <div className="ai-chat-input-area border-t border-slate-100 p-4 bg-white">
                                            <textarea
                                                ref={inputRef}
                                                className="ai-chat-input"
                                                placeholder="Type your message…"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                rows={1}
                                                disabled={isLoading}
                                            />
                                            <button
                                                className="ai-chat-send-btn"
                                                onClick={handleSend}
                                                disabled={!inputText.trim() || isLoading}
                                                title="Send message"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Status bar */}
                                <div className={`ai-chat-status ${status}`}>
                                    {status === 'connected'
                                        ? `Connected as ${user.email}`
                                        : 'Disconnected'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default AIChatWidget;
