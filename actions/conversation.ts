"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOrCreateGuestUser() {
  const cookieStore = await cookies();

  let guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    guestId = crypto.randomUUID();
    cookieStore.set("guest_id", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return db.user.upsert({
    where: { guestId },
    create: { guestId },
    update: {},
  });
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type MoodData = {
  topic?: string;
  mindState?: string | null;
  moodColor?: string;
  energyLevel?: number;
  bodySensation?: string | null;
  socialDesire?: string | null;
  timePerception?: string | null;
  emotionalWeather?: string | null;
};

export async function createConversation(mood: MoodData): Promise<{ conversationId: string }> {
  const user = await getOrCreateGuestUser();

  const conversation = await db.conversation.create({
    data: {
      hostId: user.id,
      topic: mood.topic || null,
      mindState: mood.mindState ?? null,
      moodColor: mood.moodColor ?? null,
      energyLevel: mood.energyLevel ?? null,
      bodySensation: mood.bodySensation ?? null,
      socialDesire: mood.socialDesire ?? null,
      timePerception: mood.timePerception ?? null,
      emotionalWeather: mood.emotionalWeather ?? null,
    },
  });

  return { conversationId: conversation.id };
}

export async function updateUserName(name: string): Promise<void> {
  const user = await getOrCreateGuestUser();
  await db.user.update({
    where: { id: user.id },
    data: { name: name.trim() || null },
  });
}

export async function joinConversation(conversationId: string): Promise<void> {
  const user = await getOrCreateGuestUser();

  await db.conversation.update({
    where: { id: conversationId },
    data: {
      participants: {
        connect: { id: user.id },
      },
    },
  });
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<void> {
  const user = await getOrCreateGuestUser();

  await db.message.create({
    data: {
      content,
      conversationId,
      authorId: user.id,
    },
  });
}

export async function getMessages(conversationId: string) {
  return db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true, guestId: true } },
    },
  });
}

const PAGE_SIZE = 10;

export async function getRecentConversations(cursor?: string) {
  const user = await getOrCreateGuestUser();

  const items = await db.conversation.findMany({
    where: { hostId: { not: user.id } },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      host: { select: { id: true, name: true, guestId: true } },
      topic: true,
      mindState: true,
      moodColor: true,
      energyLevel: true,
      bodySensation: true,
      socialDesire: true,
      timePerception: true,
      emotionalWeather: true,
      _count: { select: { participants: true, messages: true } },
    },
  });

  const hasMore = items.length > PAGE_SIZE;
  return { items: items.slice(0, PAGE_SIZE), hasMore };
}
