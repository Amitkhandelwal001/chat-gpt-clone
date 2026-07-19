import { Request, Response } from 'express';
import prisma from '../services/prisma';

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkId = (req as any).auth?.userId;
    const { email, profileImage } = req.body;
    let { name } = req.body;

    if (!clerkId || !email) {
      res.status(400).json({ error: 'Missing required user fields' });
      return;
    }

    if (!name) {
      name = email.split('@')[0];
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          profileImage,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { clerkId },
        data: {
          email,
          name,
          profileImage,
        },
      });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
