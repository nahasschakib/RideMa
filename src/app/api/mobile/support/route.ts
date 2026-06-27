import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import SupportMessage from '@/models/supportMessage.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const messages = await SupportMessage.find({ userId: user._id })
      .sort({ createdAt: 1 })
      .limit(100);

    // Marquer les messages admin comme lus
    await SupportMessage.updateMany(
      { userId: user._id, sender: 'admin', read: false },
      { read: true }
    );

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 });

    const message = await SupportMessage.create({
      userId: user._id,
      sender: 'user',
      text: text.trim(),
    });

    // Notifier les admins via socket
    const admins = await User.find({ role: 'admin', socketId: { $ne: null } });
    if (admins.length > 0) {
      await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: String(admins[0]._id),
          event: 'support-message',
          data: {
            messageId: message._id,
            userId: user._id,
            userName: user.name,
            text: message.text,
            createdAt: message.createdAt,
          },
        }),
      }).catch(() => {});
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}