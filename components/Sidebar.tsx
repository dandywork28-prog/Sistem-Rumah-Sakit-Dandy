
import React from 'react';
import { AgentType, AuditLogEntry } from '../types';

interface SidebarProps {
  activeAgent: AgentType;
  auditLogs: AuditLogEntry[];
  onSelectAgent: (agent: AgentType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeAgent, auditLogs, onSelectAgent, isOpen, onClose }) => {
  const agents = [
    { id: AgentType.ORCHESTRATOR, label: 'Central Manager', icon: '🧠', color: 'text-indigo-600' },
    { id: AgentType.ADMISSION, label: 'Patient Admission', icon: '📋', color: 'text-purple-600' },
    { id: AgentType.SCHEDULING, label: 'Scheduling', icon: '📅', color: 'text-blue-600' },
    { id: AgentType.PHARMACY, label: 'Pharmacy', icon: '💊', color: 'text-teal-600' },
    { id: AgentType.BILLING, label: 'Billing & RCM', icon: '💳', color: 'text-emerald-600' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 h-screen flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-slate-800 text-white p-1 rounded">MHO</span> System
            </h1>
            <p className="text-xs text-slate-500 mt-1">Hospital Operations Agent</p>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active Agent Status */}
        <div className="p-4 bg-slate-50 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active Sub-Agents</h2>
          <div className="space-y-2">
            {agents.map((agent) => (
              <button 
                key={agent.id}
                onClick={() => {
                  onSelectAgent(agent.id);
                  if (window.innerWidth < 768) onClose(); // Close on mobile selection
                }}
                className={`w-full flex items-center p-2 rounded-md transition-all cursor-pointer text-left ${
                  activeAgent === agent.id 
                    ? 'bg-white shadow-md ring-1 ring-gray-200 scale-102' 
                    : 'opacity-50 hover:opacity-100 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl mr-3">{agent.icon}</span>
                <span className={`text-sm font-medium ${activeAgent === agent.id ? agent.color : 'text-gray-600'}`}>
                  {agent.label}
                </span>
                {activeAgent === agent.id && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live Audit Log */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
           <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-center">
              <span>Audit Log (Immutable)</span>
              <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">HIPAA ON</span>
           </h2>
           <div className="space-y-3">
              {auditLogs.slice().reverse().map((log) => (
                <div key={log.id} className="bg-white p-2 rounded border border-gray-100 text-xs shadow-sm">
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>{log.timestamp}</span>
                    <span className={`font-mono font-bold ${log.status === 'SUCCESS' ? 'text-green-600' : 'text-amber-600'}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="font-medium text-gray-700 truncate">{log.agent}</div>
                  <div className="text-gray-500 truncate" title={log.action}>{log.action}</div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center text-gray-400 py-4 italic">System idle. Waiting for requests...</div>
              )}
           </div>
        </div>

        <div className="p-4 border-t border-gray-200 text-[10px] text-gray-400 text-center">
          Powered by Gemini 2.5 Flash | Compliance Mode Active
        </div>
      </div>
    </>
  );
};
