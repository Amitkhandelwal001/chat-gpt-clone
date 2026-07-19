import { Request, Response } from 'express';
import prisma from '../services/prisma';
import openai from '../services/openai';
import { RequireAuthProp } from '@clerk/clerk-sdk-node';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.conversationId as string;
    const clerkId = (req as any).auth?.userId;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.userId !== user.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.conversationId as string;
    const { content } = req.body;
    const clerkId = (req as any).auth?.userId;

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation || conversation.userId !== user.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Save the user's message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
      },
    });

    // Generate title if it's the first actual user message (and title is default)
    if (conversation.title === 'New Chat' || conversation.title === 'Continued Chat') {
      try {
        const titleResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates a very short (2-4 words) title for a conversation based on the first prompt. Output ONLY the title, no quotes, no extra text.' },
            { role: 'user', content }
          ],
          max_tokens: 10,
        });
        const generatedTitle = titleResponse.choices[0]?.message?.content?.trim();
        if (generatedTitle) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { title: generatedTitle }
          });
        }
      } catch (titleError) {
        console.error('Failed to generate title:', titleError);
      }
    }

    // Prepare messages for OpenAI (include previous messages)
    const allMessages = [...conversation.messages, userMessage];
    const openAiMessages = allMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Call OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openAiMessages,
      max_tokens: 300, // Added to limit token usage as requested
    });

    const aiContent = aiResponse.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiContent,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(200).json(assistantMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
