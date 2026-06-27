import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import SupportMessage from '@/models/supportMessage.model';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const { userId } = await context.params;

    const messages = await SupportMessage.find({ userId })
      .sort({ createdAt: 1 });

    await SupportMessage.updateMany(
      { userId, sender: 'user', read: false },
      { read: true }
    );

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    await dbConnect();
    const { userId } = await context.params;
    const { text } = await req.json();

    if (!text?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 });

    const admin = await User.findOne({ email: session.user.email });
    const message = await SupportMessage.create({
      userId,
      adminId: admin?._id,
      sender: 'admin',
      text: text.trim(),
    });

    // Notifier l'utilisateur via socket
    await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        event: 'support-message',
        data: {
          messageId: message._id,
          sender: 'admin',
          text: message.text,
          createdAt: message.createdAt,
        },
      }),
    }).catch(() => {});

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}