import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  ExternalLink,
  Building2,
  DollarSign,
  Languages,
  CheckCircle,
  XCircle,
  ThumbsUp,
  Users,
  MessageSquare,
  Compass,
} from 'lucide-react';
import type { ChatMessage, CopilotResult, University, Initiative } from '@/types';
import { getCopilotAnswer } from '@/data/copilotEngine';

const QUICK_PROMPTS = [
  'List universities with $0 application fees',
  'Which universities waive IELTS for WAEC students?',
  'What coding workspaces are available in the community?',
  'Tell me about Minnesota State University Mankato',
  'How do I get application fee waivers?',
  'What volunteer opportunities are open?',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi, I'm Civio Copilot. I search Civio's live database of 8 universities and 8 community initiatives. Ask me about fee waivers, IELTS exemptions, scholarships, coding workspaces, or any institution by name.",
  timestamp: new Date(),
};

function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();

    if (trimmed === '') {
      return <div key={i} className="h-2" />;
    }

    if (trimmed.startsWith('• ')) {
      return (
        <div key={i} className="flex gap-2 mb-0.5 pl-1">
          <span className="text-slate-500 flex-shrink-0">•</span>
          <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    }

    if (trimmed.startsWith('✓ ')) {
      return (
        <div key={i} className="flex gap-2 mb-0.5 pl-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        return (
          <div key={i} className="flex gap-2 mb-0.5">
            <span className="text-slate-500 flex-shrink-0 font-semibold">{match[1]}.</span>
            <span className="flex-1">{renderInline(match[2])}</span>
          </div>
        );
      }
    }

    if (trimmed.startsWith('🔴') || trimmed.startsWith('🟡')) {
      return (
        <p key={i} className="mb-1">{trimmed}</p>
      );
    }

    return (
      <p key={i} className="mb-1">
        {renderInline(trimmed)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const CATEGORY_PILL_STYLES: Record<string, string> = {
  Education: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  Business: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'Public Policy': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  Environment: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  Community: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'Tech & Coding': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
};

function UniversityResultCard({ university }: { university: University }) {
  const feeColor =
    university.applicationFeeType === 'free'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
      : university.applicationFeeType === 'waiver'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
        : 'bg-blue-500/15 text-blue-300 border-blue-500/25';

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 w-9 h-9 flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white leading-tight">{university.name}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{university.city}, {university.country}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${feeColor}`}>
            <DollarSign className="w-3 h-3" />
            {university.applicationFeeDisplay}
          </span>
          {university.englishWaiver.available ? (
            <span className="inline-flex items-center gap-1 rounded-md border bg-emerald-500/10 text-emerald-300 border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium">
              <Languages className="w-3 h-3" />
              English Waiver
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border bg-slate-700/30 text-slate-400 border-slate-600/30 px-2 py-0.5 text-[11px] font-medium">
              <XCircle className="w-3 h-3" />
              No Waiver
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex gap-2">
            <span className="text-slate-500 font-semibold flex-shrink-0">Fee:</span>
            <span>{university.feeNote}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 font-semibold flex-shrink-0">English:</span>
            <span>{university.englishWaiver.detail}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 font-semibold flex-shrink-0">Tests:</span>
            <span>{university.intel.standardizedTests}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 font-semibold flex-shrink-0">Deadlines:</span>
            <span>{university.intel.deadlines}</span>
          </div>
        </div>
      </div>

      <a
        href={university.portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full border-t border-slate-700/60 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-blue-300 transition-all hover:bg-slate-700/50 hover:text-blue-200"
      >
        Official Application Portal
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function InitiativeResultCard({ initiative }: { initiative: Initiative }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 w-9 h-9 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white leading-tight">{initiative.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5">By {initiative.author} · {initiative.postedAt}</p>
          </div>
        </div>

        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold mb-2 ${CATEGORY_PILL_STYLES[initiative.category] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
          {initiative.category}
        </span>

        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-3">{initiative.description}</p>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            {initiative.endorsements}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {initiative.volunteersJoined}/{initiative.volunteersNeeded}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {initiative.comments.length}
          </span>
        </div>
      </div>

      {initiative.link && (
        <a
          href={initiative.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full border-t border-slate-700/60 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-indigo-300 transition-all hover:bg-slate-700/50 hover:text-indigo-200"
        >
          Join Initiative
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: CopilotResult }) {
  if (result.kind === 'university') {
    return <UniversityResultCard university={result.university} />;
  }
  return <InitiativeResultCard initiative={result.initiative} />;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex items-center justify-center rounded-xl w-9 h-9 flex-shrink-0 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
      </div>
      <div className={`flex flex-col gap-3 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-indigo-600/20 border border-indigo-500/30 text-slate-100'
              : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
          }`}
        >
          <div className="text-sm leading-relaxed">
            {formatMessageContent(message.content)}
          </div>
        </div>

        {message.results && message.results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
            {message.results.map((result, idx) => (
              <ResultCard key={idx} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CivioCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = getCopilotAnswer(trimmed);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer.content,
        timestamp: new Date(),
        results: answer.results,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 700 + Math.random() * 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/20 to-blue-700/20 border border-indigo-500/30 w-14 h-14 mb-3">
          <Compass className="w-7 h-7 text-indigo-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
          Civio Copilot
        </h1>
        <p className="text-slate-400 text-sm">
          AI advisor powered by Civio's live database — fee waivers, initiatives, scholarships & community resources.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 w-9 h-9 flex-shrink-0">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="px-4 sm:px-6 pb-3 border-t border-slate-800/50 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Quick Prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isTyping}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about universities, fee waivers, initiatives, or volunteering..."
              disabled={isTyping}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
