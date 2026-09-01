import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, Send, Bot, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';

export const LiveChatWidgetModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentWorkspace, setSelectedLead, setActiveView } = useWorkspace();
  const { showToast } = useNotification();

  const [messages, setMessages] = useState<{ sender: 'lead' | 'assistant'; content: string }[]>([
    {
      sender: 'assistant',
      content: `Welcome to ${currentWorkspace.name}! I am ${currentWorkspace.aiConfig.assistantName}, your qualification assistant. How can I assist you with your inquiry?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message = inputText;
    const newMessages = [...messages, { sender: 'lead' as const, content: message }];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.chatSimulator(
        currentWorkspace.id,
        newMessages,
        message,
        { service: currentWorkspace.aiConfig.services[0]?.name || 'General Inquiry', location: 'Website Widget', budget: 'Evaluating' }
      );

      setMessages((prev) => [...prev, { sender: 'assistant', content: res.reply }]);

      if (res.liveAnalysis && res.liveAnalysis.score >= 50 && !leadCreated) {
        setLeadCreated(true);
        showToast({
          type: 'hot',
          title: 'Lead Ingested from Widget',
          message: `Visitor scored ${res.liveAnalysis.score}/100 and added to CRM pipeline.`
        });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Widget error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm w-full max-w-md h-[580px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Widget Header */}
        <div className="p-4 border-b border-[#1a1a1a] bg-[#080808] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-[#171717] border border-[#262626] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-white">
                {currentWorkspace.aiConfig.assistantName}
              </h3>
              <p className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online & Ready
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-[#737373] hover:text-white hover:bg-[#111111]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050505]">
          {messages.map((m, idx) => {
            const isLead = m.sender === 'lead';
            return (
              <div key={idx} className={`flex flex-col ${isLead ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-sm text-xs leading-relaxed ${
                    isLead
                      ? 'bg-[#171717] text-white border border-[#262626]'
                      : 'bg-[#0a0a0a] text-[#e5e5e5] border border-[#1a1a1a]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#737373] py-1">
              <Sparkles className="w-3 h-3 animate-spin text-[#c5a059]" />
              <span className="font-light">Typing response...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1a1a1a] bg-[#0a0a0a] flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question or request a quote..."
            className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-3.5 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
