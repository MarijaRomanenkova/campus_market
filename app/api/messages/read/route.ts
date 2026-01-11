/**
 * Messages Read Status API Route
 * @module API
 * @group Chat
 * 
 * This API endpoint handles marking messages as read in a conversation.
 * It allows users to mark all unread messages in a conversation as read,
 * improving the chat experience by tracking message read status.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';
import { prisma } from "@/db/prisma";

/**
 * POST handler for marking messages as read
 * 
 * Marks all unread messages in a conversation as read.
 * Only marks messages not sent by the current user.
 * Validates that the user is a participant in the conversation.
 * 
 * @param {NextRequest} req - The incoming request
 * @returns {Promise<NextResponse>} JSON response with success status and count of marked messages
 * @example
 * // Request body format
 * // { "conversationId": "123" }
 * 
 * // Response format
 * // { "success": true, "markedAsRead": 5 }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { conversationId } = body;
    
    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversation ID" },
        { status: 400 }
      );
    }
    
    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: session.user.id
      }
    });
    
    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this conversation" },
        { status: 403 }
      );
    }
    
    // Mark all messages not sent by this user as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      markedAsRead: result.count 
    });
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
} 
