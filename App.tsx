
import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DocumentViewer } from './components/DocumentViewer';
import { orchestrateRequest, executeAgentTask } from './services/agentService';
import { AgentType, ChatMessage, AuditLogEntry } from './types';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      sender: AgentType.ORCHESTRATOR,
      text: "Welcome to MHO (Manage Hospital Operations). I am the Central Manager. How can I assist you today? (e.g., 'Check my insurance claim', 'Schedule a cardiology appointment')",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType>(AgentType.ORCHESTRATOR);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addAuditLog = (agent: AgentType, action: string) => {
    const newLog: AuditLogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      action,
      status: 'SUCCESS'
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      sender: 'User',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Orchestrator Phase
      // NOTE: We reset visualization to Orchestrator briefly to show processing
      setCurrentAgent(AgentType.ORCHESTRATOR);
      const delegation = await orchestrateRequest(userMsg.text);
      
      addAuditLog(AgentType.ORCHESTRATOR, `Delegated to ${delegation.agent}`);
      
      // Artificial delay for UI effect (switching agents)
      await new Promise(r => setTimeout(r, 600));
      setCurrentAgent(delegation.agent);

      // 2. Execution Phase
      const historyContext = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
      const response = await executeAgentTask(delegation.agent, userMsg.text, historyContext);

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        sender: delegation.agent,
        timestamp: new Date(),
        documentData: response.document,
        groundingSources: response.groundingSources
      };

      setMessages(prev => [...prev, agentMsg]);
      addAuditLog(delegation.agent, response.document ? `Generated ${response.document.type}` : 'Responded to query');

    } catch (error) {
      console.error("Error processing request", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, but I encountered a secure connection error. Please try again.",
        sender: AgentType.ORCHESTRATOR,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      setCurrentAgent(AgentType.ORCHESTRATOR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar 
        activeAgent={currentAgent} 
        auditLogs={auditLogs} 
        onSelectAgent={setCurrentAgent}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen relative w-full">
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden bg-white p-4 border-b flex items-center justify-between shadow-sm z-10">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="text-slate-600 hover:text-slate-900 focus:outline-none"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </button>
             <span className="font-bold text-slate-700">MHO System</span>
           </div>
           <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium border border-indigo-100 truncate max-w-[120px]">
             {currentAgent}
           </span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] sm:max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Sender Label */}
                <span className={`text-[10px] mb-1 px-2 ${msg.role === 'user' ? 'text-slate-400' : 'text-indigo-500 font-semibold'}`}>
                   {msg.role === 'user' ? 'You' : msg.sender}
                </span>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-br-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                }`}>
                  {msg.text}
                  
                  {/* Document Attachment */}
                  {msg.documentData && (
                    <DocumentViewer data={msg.documentData} />
                  )}

                  {/* Grounding Sources */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Sources</p>
                      <ul className="space-y-1">
                        {msg.groundingSources.map((source, idx) => (
                          <li key={idx}>
                            <a 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              🔗 {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Timestamp */}
                <span className="text-[10px] text-slate-300 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-pulse">
               <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 flex items-center gap-2">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                 <span className="text-xs text-slate-400 ml-2">Processing...</span>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t border-slate-200">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isLoading ? "Please wait..." : "Type request (e.g., 'Generate invoice for surgery')"}
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 disabled:opacity-50 disabled:bg-slate-100"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Send
            </button>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-center">
             <p className="text-[10px] text-slate-400">
               MHO System ensures all data handling complies with HIPAA standards. 
               Identities are role-masked.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
