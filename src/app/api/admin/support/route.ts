import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import SupportMessage from '@/models/supportMessage.model';
import { NextRequest, NextResponse } from 'next/server';

// GET — liste des conversations
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();

    // Grouper par userId — dernière conversation
    const conversations = await SupportMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$text' },
          lastSender: { $first: '$sender' },
          lastAt: { $first: '$createdAt' },
          unread: {
            $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$read', false] }] }, 1, 0] },
          },
        },
      },
      { $sort: { lastAt: -1 } },
    ]);

    // Enrichir avec les infos utilisateur
    const userIds = conversations.map(c => c._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email mobileNumber');
    const userMap = new Map(users.map(u => [String(u._id), u]));

    const result = conversations.map(c => ({
      userId: c._id,
      user: userMap.get(String(c._id)) ?? null,
      lastMessage: c.lastMessage,
      lastSender: c.lastSender,
      lastAt: c.lastAt,
      unread: c.unread,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}