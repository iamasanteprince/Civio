import { useState } from 'react';
import { BarChart3, Users, CheckCircle } from 'lucide-react';
import type { Poll } from '@/types';
import { polls as initialPolls } from '@/data/polls';

const POLL_ACCENT_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
];

function PollCard({
  poll,
  onVote,
}: {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleVote = (optionId: string) => {
    if (selectedOption) return;
    setSelectedOption(optionId);
    onVote(poll.id, optionId);
  };

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0c1322]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 w-10 h-10 flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-snug mb-1">
              {poll.question}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{poll.description}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {poll.options.map((option, idx) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            const isSelected = selectedOption === option.id;
            const hasVoted = selectedOption !== null;
            const accent = POLL_ACCENT_COLORS[idx % POLL_ACCENT_COLORS.length];

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted}
                className={`relative w-full text-left rounded-xl border overflow-hidden transition-all ${
                  isSelected
                    ? 'border-indigo-500/50 ring-1 ring-indigo-500/20'
                    : hasVoted
                      ? 'border-slate-800'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                }`}
              >
                {hasVoted && (
                  <div
                    className={`absolute inset-y-0 left-0 ${accent} opacity-20 transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {isSelected && <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                    <span className={`text-sm ${isSelected ? 'font-semibold text-white' : 'text-slate-300'}`}>
                      {option.label}
                    </span>
                  </div>
                  {hasVoted && (
                    <span className="text-sm font-bold tabular-nums text-slate-300 flex-shrink-0">
                      {percentage}%
                    </span>
                  )}
                </div>
                {hasVoted && (
                  <div className="relative h-1 bg-slate-800/50">
                    <div
                      className={`absolute inset-y-0 left-0 ${accent} transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {totalVotes} total votes
          </span>
          <span>By {poll.author}</span>
          <span>{poll.postedAt}</span>
          {selectedOption && (
            <span className="text-emerald-400 font-medium ml-auto flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Vote recorded
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CivicPolls() {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);

  const handleVote = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((p) =>
        p.id === pollId
          ? {
              ...p,
              options: p.options.map((o) =>
                o.id === optionId ? { ...o, votes: o.votes + 1 } : o
              ),
              totalVotes: p.totalVotes + 1,
            }
          : p
      )
    );
  };

  const totalVotes = polls.reduce((sum, p) => sum + p.totalVotes, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
          Civic Polls & Votes
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Vote on community priorities, education policy, and youth initiatives. Your voice shapes the agenda.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-2 text-sm">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-300 font-semibold">{totalVotes}</span>
          <span className="text-slate-500">total community votes cast</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} onVote={handleVote} />
        ))}
      </div>
    </div>
  );
}
