import { useState, useRef, useLayoutEffect } from 'react';
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
  Users,
  Award,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import type {
  ApiUniversity,
  AsanteMessage,
  AsanteResult,
  CivioUser,
  Initiative,
  Opportunity,
  University,
} from '@/types';
import { getAsanteAnswer, getAsanteLocalAnswer } from '@/data/asanteEngine';
import { getUniversityWebsite } from '@/data/universityDirectory';
import { getGuestSessionId, sanitizePlainText } from '@/utils/inputSecurity';

const QUICK_PROMPTS = [
  'Find universities with $0 application fees',
  'Which schools accept WAEC/WASSCE instead of IELTS?',
  'How much is the German blocked account (Sperrkonto)?',
  "Explain Canada's PAL & proof-of-funds requirements",
  'Show fully funded scholarships for African students',
];

const WELCOME_MESSAGE: AsanteMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm Asante, your guide across Civiohub. Ask me about universities with $0 application fees, IELTS/WAEC waivers, visa proof-of-funds rules, or global scholarships.",
  timestamp: new Date(),
};

function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();

    if (trimmed === '') {
      return <div key={i} className="h-2" />;
    }

    if (/^(?:•|-|\*)\s/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^(?:•|-|\*)\s/, '');
      return (
        <div key={i} className="flex gap-2 mb-0.5 pl-1">
          <span className="text-slate-500 flex-shrink-0">•</span>
          <span className="flex-1">{renderInline(bulletContent)}</span>
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

interface InitiativeManagementProps {
  currentUser: CivioUser | null;
  onUpdateInitiative: (initiativeId: string, fields: Pick<Initiative, 'title' | 'description' | 'goal'>) => void;
  onDeleteInitiative: (initiativeId: string) => void;
}

function UniversityResultCard({ university }: { university: University }) {
  const feeStatusLabel = university.applicationFeeType === 'free'
    ? '$0 App Fee'
    : university.applicationFeeType === 'waiver'
      ? 'Fee Waiver Available'
      : 'Standard Fee';
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
          <div className="flex items-center justify-center rounded-lg bg-blue-600 w-9 h-9 flex-shrink-0">
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
            {feeStatusLabel}{university.applicationFeeType === 'paid' ? ` · ${university.applicationFeeDisplay}` : ''}
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
            <span>{university.englishWaiver.detail}{university.englishWaiver.acceptedProofs.length > 0 ? ` Accepted evidence: ${university.englishWaiver.acceptedProofs.join(', ')}.` : ''}</span>
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

function InitiativeResultCard({
  initiative,
  currentUser,
  onUpdateInitiative,
  onDeleteInitiative,
}: InitiativeManagementProps & { initiative: Initiative }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initiative.title);
  const [description, setDescription] = useState(initiative.description);
  const [goal, setGoal] = useState(initiative.goal);
  const guestSessionId = (() => {
    try {
      return getGuestSessionId();
    } catch {
      return '';
    }
  })();
  const canManage = Boolean(
    currentUser?.email.trim().toLowerCase() === 'iamasanteprince@gmail.com' ||
    (currentUser && initiative.userId === currentUser.id) ||
    (initiative.guestSessionId && initiative.guestSessionId === guestSessionId)
  );
  const saveEdits = () => {
    const safeTitle = sanitizePlainText(title).slice(0, 160);
    const safeDescription = sanitizePlainText(description).slice(0, 5000);
    const safeGoal = sanitizePlainText(goal).slice(0, 1000);
    if (!safeTitle || !safeDescription || !safeGoal) return;
    onUpdateInitiative(initiative.id, {
      title: safeTitle,
      description: safeDescription,
      goal: safeGoal,
    });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className="flex items-center justify-center rounded-lg bg-blue-600 w-9 h-9 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} aria-label="Edit initiative title" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white" />
            ) : <h4 className="text-sm font-bold text-white leading-tight">{initiative.title}</h4>}
              <p className="text-xs text-slate-400 mt-0.5">{initiative.organizer} · {initiative.postedAt}</p>
          </div>
        </div>

        <span className={`mb-2 mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
          initiative.verificationStatus === 'verified'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        }`}>
          {initiative.verificationStatus === 'verified' ? 'Verified Organizer' : 'Verification pending'}
        </span>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold mb-2 ${CATEGORY_PILL_STYLES[initiative.category] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
          {initiative.category}
        </span>

        {editing ? (
          <div className="mb-3 space-y-2">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} aria-label="Edit initiative description" rows={3} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200" />
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={1000} aria-label="Edit initiative goal" rows={2} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200" />
            <div className="flex gap-2">
              <button type="button" onClick={saveEdits} className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Save</button>
              <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300"><X className="h-3 w-3" /> Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-3">{initiative.description}</p>
            <p className="mb-3 text-xs text-slate-400"><span className="font-semibold text-slate-300">Goal:</span> {initiative.goal}</p>
          </>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {initiative.volunteersJoined}/{initiative.volunteersNeeded}
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
      {canManage && !editing && (
        <div className="flex gap-1 border-t border-slate-700/60 px-3 py-2">
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-white">
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this post?')) onDeleteInitiative(initiative.id);
            }}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function GlobalUniversityResultCard({ university }: { university: ApiUniversity }) {
  const portal = getUniversityWebsite(university);
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white">{university.name}</h4>
            <p className="mt-0.5 text-xs text-slate-400">{university.country}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          <span className="mb-1 block font-semibold text-slate-300">Application fee: Not indexed</span>
          <span className="mb-1 block font-semibold text-slate-300">English-testing policy: Not indexed</span>
          Global directory entries do not include admissions requirements. Confirm current fees and testing policies with the institution.
        </p>
      </div>
      {portal && (
        <a
          href={portal}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-1.5 border-t border-slate-700/60 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-blue-300 hover:bg-slate-700/50"
        >
          Official institution website <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function OpportunityResultCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700">
            <Award className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white">{opportunity.title}</h4>
            <p className="mt-0.5 text-xs text-slate-400">{opportunity.organization}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-300">{opportunity.fundingType} · Deadline: {opportunity.deadline}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{opportunity.benefits}</p>
      </div>
      <a
        href={opportunity.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-1.5 border-t border-slate-700/60 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-slate-700/50"
      >
        Official opportunity page <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function ResultCard({
  result,
  initiativeManagement,
}: {
  result: AsanteResult;
  initiativeManagement: InitiativeManagementProps;
}) {
  if (result.kind === 'university') {
    return <UniversityResultCard university={result.university} />;
  }
  if (result.kind === 'initiative') {
    return <InitiativeResultCard initiative={result.initiative} {...initiativeManagement} />;
  }
  if (result.kind === 'opportunity') return <OpportunityResultCard opportunity={result.opportunity} />;
  return <GlobalUniversityResultCard university={result.university} />;
}

function MessageBubble({
  message,
  initiativeManagement,
}: {
  message: AsanteMessage;
  initiativeManagement: InitiativeManagementProps;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex items-center justify-center rounded-xl w-9 h-9 flex-shrink-0 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-blue-600 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
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
              <ResultCard key={idx} result={result} initiativeManagement={initiativeManagement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AsanteProps extends InitiativeManagementProps {
  initiatives: Initiative[];
}

export default function Asante({
  initiatives,
  currentUser,
  onUpdateInitiative,
  onDeleteInitiative,
}: AsanteProps) {
  const [messages, setMessages] = useState<AsanteMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: AsanteMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const respond = async () => {
      let answer: Awaited<ReturnType<typeof getAsanteAnswer>>;
      try {
        answer = await getAsanteAnswer(trimmed, initiatives);
      } catch {
        try {
          answer = getAsanteLocalAnswer(trimmed, initiatives);
        } catch {
          answer = {
            content: 'I could not load Civio’s indexed guidance right now. Please try again in a moment.',
            results: [],
          };
        }
      }

      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 22_000);
        let response: Response;
        try {
          response = await fetch('/api/asante', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: trimmed, context: answer.content.slice(0, 16_000) }),
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeout);
        }

        if (!response.ok) throw new Error('Gemini is temporarily unavailable.');
        const payload: unknown = await response.json();
        if (
          typeof payload !== 'object' ||
          payload === null ||
          !('text' in payload) ||
          typeof payload.text !== 'string' ||
          !payload.text.trim()
        ) {
          throw new Error('Gemini returned an invalid response.');
        }
        answer = { ...answer, content: payload.text.trim() };
      } catch {
        answer = {
          ...answer,
          content: `${answer.content}\n\n_Gemini is unavailable right now; this response uses Civio's local indexed guidance._`,
        };
      }

      const assistantMsg: AsanteMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer.content,
        timestamp: new Date(),
        results: answer.results,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    };
    void respond();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 w-14 h-14 mb-3">
          <Sparkles className="w-7 h-7 text-blue-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
          Asante
        </h1>
        <p className="text-slate-400 text-sm">
          Your Admissions, Visa &amp; Opportunity Intelligence Mentor
        </p>
      </div>

      <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Sparkles className="h-3 w-3" />
          Try asking Asante
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isTyping}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <div className="w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              initiativeManagement={{ currentUser, onUpdateInitiative, onDeleteInitiative }}
            />
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex items-center justify-center rounded-lg bg-blue-600 w-9 h-9 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
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

        <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about visas, proof of funds, universities, fee waivers, or opportunities..."
              disabled={isTyping}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-slate-800 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-600">
            When available, your question and relevant indexed guidance are sent to Google Gemini to generate a response.
          </p>
        </form>
      </div>
    </div>
  );
}
