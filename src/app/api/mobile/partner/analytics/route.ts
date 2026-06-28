import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Booking from '@/models/booking.model';
import Wallet from '@/models/wallet.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') ?? 'week';

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now); startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Stats courses
    const [totalRides, completedRides, cancelledRides] = await Promise.all([
      Booking.countDocuments({ driver: user._id, createdAt: { $gte: startDate } }),
      Booking.countDocuments({ driver: user._id, bookingStatus: 'completed', createdAt: { $gte: startDate } }),
      Booking.countDocuments({ driver: user._id, bookingStatus: 'cancelled', createdAt: { $gte: startDate } }),
    ]);

    // Gains
    const earningsAgg = await Booking.aggregate([
      { $match: { driver: user._id, bookingStatus: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$partnerAmount' }, avgFare: { $avg: '$fare' } } },
    ]);
    const totalEarnings = earningsAgg[0]?.total ?? 0;
    const avgFare = earningsAgg[0]?.avgFare ?? 0;

    // Graphique gains quotidiens (30 jours)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyEarnings = await Booking.aggregate([
      { $match: { driver: user._id, bookingStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          earnings: { $sum: '$partnerAmount' },
          rides: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Wallet
    const wallet = await Wallet.findOne({ owner: user._id, ownerType: 'driver' });

    return NextResponse.json({
      period,
      stats: {
        totalRides,
        completedRides,
        cancelledRides,
        completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(1) : 0,
        totalEarnings,
        avgFare: avgFare.toFixed(1),
        walletBalance: wallet?.balance ?? 0,
      },
      dailyEarnings,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}