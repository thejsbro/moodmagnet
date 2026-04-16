import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { joinConversation, getMessages, getRecentConversations } from "@/actions/conversation";
import ConversationView from "./ConversationView";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;

  const exists = await db.conversation.findUnique({ where: { id }, select: { id: true } });
  if (!exists) notFound();

  // Auto-join when visiting
  await joinConversation(id);

  // Read cookie to identify current user
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value ?? null;
  const currentUser = guestId
    ? await db.user.findUnique({ where: { guestId }, select: { id: true } })
    : null;

  const myConversationSelect = {
    id: true,
    createdAt: true,
    topic: true,
    mindState: true,
    moodColor: true,
    energyLevel: true,
    bodySensation: true,
    socialDesire: true,
    timePerception: true,
    emotionalWeather: true,
    host: { select: { id: true, name: true, guestId: true } },
    _count: { select: { participants: true, messages: true } },
  } as const;

  const [initialMessages, recentConversations, myConversation, joinedConversations, participantsAfterJoin] =
    await Promise.all([
      getMessages(id),
      getRecentConversations(),
      currentUser
        ? db.conversation.findFirst({
            where: { hostId: currentUser.id },
            orderBy: { createdAt: "desc" },
            select: myConversationSelect,
          })
        : Promise.resolve(null),
      currentUser
        ? db.conversation.findMany({
            where: {
              participants: { some: { id: currentUser.id } },
              hostId: { not: currentUser.id },
            },
            orderBy: { createdAt: "desc" },
            select: myConversationSelect,
          })
        : Promise.resolve([]),
      db.conversation.findUnique({
        where: { id },
        select: { participants: { select: { id: true, name: true, guestId: true } } },
      }),
    ]);

  return (
    <ConversationView
      conversationId={id}
      currentUserId={currentUser?.id ?? null}
      initialMessages={initialMessages}
      initialParticipants={participantsAfterJoin?.participants ?? []}
      currentConversation={myConversation ?? null}
      joinedConversations={joinedConversations}
      initialRecentConversations={recentConversations.items}
      initialHasMore={recentConversations.hasMore}
    />
  );
}
