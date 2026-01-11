/**
 * Conversation Detail Page Component
 * @module Pages
 * @group Dashboard/Messages
 * 
 * This page displays a specific conversation between users.
 * It shows the message history, conversation participants, and provides functionality 
 * for product assignment if the conversation is related to a product.
 */

import { getConversationById } from '@/lib/actions/chat.actions';
import { ChatPageClient } from '@/components/shared/chat/chat-page-client';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const conversation = await getConversationById(resolvedParams.id);
  const convertedConversation = {
    ...conversation,
    participants: conversation.participants.map(p => ({
      user: {
        ...p.user,
        sellerRating: Number(p.user.sellerRating),
        clientRating: Number(p.user.clientRating)
      }
    }))
  };
  return <ChatPageClient initialConversation={convertedConversation} id={resolvedParams.id} />;
} 
