import { Request, Response } from 'express';
import prisma from '../services/prisma';
import { RequireAuthProp } from '@clerk/clerk-sdk-node';

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkId = (req as any).auth?.userId;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkId = (req as any).auth?.userId;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: 'New Chat',
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, isPinned } = req.body;
    const clerkId = (req as any).auth?.userId;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation || conversation.userId !== user.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        title: title !== undefined ? title : conversation.title,
        isPinned: isPinned !== undefined ? isPinned : conversation.isPinned,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const clerkId = (req as any).auth?.userId;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation || conversation.userId !== user.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.conversation.delete({ where: { id } });

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const continueInNewChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const clerkId = (req as any).auth?.userId;

    if (!content) {
      res.status(400).json({ error: 'Missing content' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Create new conversation
    const newConv = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: 'Continued Chat',
      },
    });

    // Add hidden system message
    await prisma.message.create({
      data: {
        conversationId: newConv.id,
        role: 'system',
        content: 'The following context comes from another conversation. Continue discussing only this topic unless the user changes it.',
      },
    });

    // Add the copied assistant response
    await prisma.message.create({
      data: {
        conversationId: newConv.id,
        role: 'assistant',
        content: content,
      },
    });

    res.status(201).json(newConv);
  } catch (error) {
    console.error('Error in continueInNewChat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
