"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, getMessages, getRecentConversations, updateUserName } from "@/actions/conversation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Participant = { id: string; name: string | null; guestId: string | null };

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string | null; guestId: string | null };
};

type RecentConversation = {
  id: string;
  createdAt: Date;
  topic: string | null;
  mindState: string | null;
  moodColor: string | null;
  energyLevel: number | null;
  bodySensation: string | null;
  socialDesire: string | null;
  timePerception: string | null;
  emotionalWeather: string | null;
  host: { id: string; name: string | null; guestId: string | null };
  _count: { participants: number; messages: number };
};

type Props = {
  conversationId: string;
  currentUserId: string | null;
  initialMessages: Message[];
  initialParticipants: Participant[];
  currentConversation: RecentConversation | null;
  joinedConversations: RecentConversation[];
  initialRecentConversations: RecentConversation[];
  initialHasMore: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displayName(user: { name: string | null; guestId: string | null }): string {
  if (user.name) return user.name;
  if (user.guestId) return `Guest #${user.guestId.slice(0, 6)}`;
  return "Unknown";
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function truncateTopic(topic: string | null, wordLimit = 7): string {
  if (!topic) return "Untitled room";
  const words = topic.trim().split(/\s+/);
  if (words.length <= wordLimit) return topic;
  return words.slice(0, wordLimit).join(" ") + "…";
}

// ─── ConversationCard ─────────────────────────────────────────────────────────

function ConversationCard({
  conv,
  isExpanded,
  onToggle,
  joinLabel,
  onJoin,
}: {
  conv: RecentConversation;
  isExpanded: boolean;
  onToggle: () => void;
  joinLabel: string;
  onJoin: () => void;
}) {
  const moodTags = [
    conv.mindState,
    conv.moodColor,
    conv.bodySensation,
    conv.socialDesire,
    conv.timePerception,
    conv.emotionalWeather,
    conv.energyLevel != null ? `energy ${conv.energyLevel}%` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#f5f5f5] transition-colors"
        onClick={onToggle}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{truncateTopic(conv.topic)}</p>
          <p className="text-xs text-[#777777] mt-0.5">
            {conv._count.participants} participant{conv._count.participants !== 1 ? "s" : ""} ·{" "}
            {conv._count.messages} msg{conv._count.messages !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-[#999999] text-xs shrink-0">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#efefef] pt-3 space-y-3">
          {conv.topic && <p className="text-sm text-[#111111]">{conv.topic}</p>}
          {moodTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {moodTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-[#efefef] text-xs text-[#444444] capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <button
            className="w-full rounded-full py-2.5 text-sm font-semibold bg-[#111111] text-white hover:bg-[#333333] transition-colors"
            onClick={onJoin}
          >
            {joinLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConversationView({
  conversationId,
  currentUserId,
  initialMessages,
  initialParticipants,
  currentConversation,
  joinedConversations,
  initialRecentConversations,
  initialHasMore,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"chat" | "talks">("chat");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>(initialRecentConversations);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nicknamePopup, setNicknamePopup] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSavingName, startSavingName] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getMessages(conversationId).then((msgs) => setMessages(msgs as Message[]));
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    const cursor = recentConversations[recentConversations.length - 1]?.id;
    startLoadingMore(async () => {
      const { items, hasMore: more } = await getRecentConversations(cursor);
      setRecentConversations((prev) => [...prev, ...(items as RecentConversation[])]);
      setHasMore(more);
    });
  }, [hasMore, isLoadingMore, recentConversations]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  function openNicknamePopup() {
    const me = participants.find((p) => p.id === currentUserId);
    setNicknameInput(me?.name ?? "");
    setNicknamePopup(true);
  }

  function handleSaveNickname() {
    startSavingName(async () => {
      await updateUserName(nicknameInput);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUserId
            ? { ...p, name: nicknameInput.trim() || null }
            : p
        )
      );
      setNicknamePopup(false);
    });
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    startTransition(async () => {
      await sendMessage(conversationId, trimmed);
      const msgs = await getMessages(conversationId);
      setMessages(msgs as Message[]);
    });
  }

  return (
    <div className="flex flex-col h-screen bg-[#d8d8d8] text-[#111111]">
      {/* Tabs */}
      <div className="flex border-b border-[#b8b8b8] bg-[#d8d8d8] shrink-0">
        <button
          className={`flex-1 py-4 text-sm font-semibold transition-colors ${
            tab === "chat"
              ? "border-b-2 border-[#111111] text-[#111111]"
              : "text-[#777777]"
          }`}
          onClick={() => setTab("chat")}
        >
          Chat
        </button>
        <button
          className={`flex-1 py-4 text-sm font-semibold transition-colors ${
            tab === "talks"
              ? "border-b-2 border-[#111111] text-[#111111]"
              : "text-[#777777]"
          }`}
          onClick={() => setTab("talks")}
        >
          Available Talks
        </button>
      </div>

      {/* Chat tab */}
      {tab === "chat" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Participants bar */}
          <div className="shrink-0 border-b border-[#b8b8b8] px-4 py-2 flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#777777] shrink-0">
              {participants.length}
            </span>
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-[#444444]">{displayName(p)}</span>
                {p.id === currentUserId && (
                  <button
                    onClick={openNicknamePopup}
                    className="text-[#aaaaaa] hover:text-[#444444] transition-colors"
                    title="Edit nickname"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Messages + input */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-[#999999] mt-8">
                  No messages yet. Say hello!
                </p>
              )}
              {messages.map((msg) => {
                const isOwn = msg.author.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <span className="text-xs text-[#777777]">
                      {displayName(msg.author)} · {formatTime(msg.createdAt)}
                    </span>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? "bg-[#111111] text-white rounded-br-sm"
                          : "bg-white text-[#111111] rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 flex gap-2 p-4 border-t border-[#b8b8b8]">
              <input
                className="flex-1 rounded-full px-4 py-2 text-sm bg-white outline-none"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isPending}
              />
              <button
                className="rounded-full px-5 py-2 text-sm font-semibold bg-[#111111] text-white disabled:opacity-50"
                onClick={handleSend}
                disabled={isPending || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available talks tab */}
      {tab === "talks" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* My conversation — pinned */}
          {currentConversation && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] mb-3">
                My Conversation
              </p>
              <ConversationCard
                conv={currentConversation}
                isExpanded={expandedId === currentConversation.id}
                onToggle={() =>
                  setExpandedId(
                    expandedId === currentConversation.id ? null : currentConversation.id
                  )
                }
                joinLabel="Open"
                onJoin={() => router.push(`/conversation/${currentConversation.id}`)}
              />
            </div>
          )}

          {/* Joined conversations */}
          {joinedConversations.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] mb-3">
                Joined Conversations
              </p>
              <ul className="space-y-3">
                {joinedConversations.map((conv) => (
                  <li key={conv.id}>
                    <ConversationCard
                      conv={conv}
                      isExpanded={expandedId === conv.id}
                      onToggle={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                      joinLabel="Open"
                      onJoin={() => router.push(`/conversation/${conv.id}`)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Other conversations */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#777777] mb-3">
              Recent Conversations
            </p>
            {recentConversations.length === 0 && (
              <p className="text-center text-sm text-[#999999] mt-4">No other conversations yet.</p>
            )}
            <ul className="space-y-3">
              {recentConversations.map((conv) => (
                <li key={conv.id}>
                  <ConversationCard
                    conv={conv}
                    isExpanded={expandedId === conv.id}
                    onToggle={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                    joinLabel="Join"
                    onJoin={() => router.push(`/conversation/${conv.id}`)}
                  />
                </li>
              ))}
            </ul>
            <div ref={sentinelRef} className="py-2 text-center">
              {isLoadingMore && (
                <span className="text-xs text-[#999999]">Loading…</span>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Nickname popup */}
      {nicknamePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setNicknamePopup(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-[#111111]">Your nickname</h2>
            <input
              autoFocus
              className="w-full rounded-xl border border-[#e0e0e0] px-4 py-2.5 text-sm outline-none focus:border-[#111111] transition-colors"
              placeholder="Enter nickname…"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()}
              maxLength={32}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-full py-2.5 text-sm font-semibold border border-[#e0e0e0] text-[#444444] hover:bg-[#f5f5f5] transition-colors"
                onClick={() => setNicknamePopup(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-full py-2.5 text-sm font-semibold bg-[#111111] text-white disabled:opacity-50 transition-colors"
                onClick={handleSaveNickname}
                disabled={isSavingName}
              >
                {isSavingName ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
