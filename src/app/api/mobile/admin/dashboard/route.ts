import { NextRequest, NextResponse } from 'next/server';
import { getEmailFromRequest } from '@/lib/mobile-auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Booking from '@/models/booking.model';
import Vehicle from '@/models/vehicle.model';

export async function GET(req: NextRequest) {
  try {
    const email = await getEmailFromRequest(req);
    if (!email) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await dbConnect();

    const admin = await User.findOne({ email });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') ?? 'week';

    const now = new Date();
    let dateFilter = new Date();
    if (period === 'week') dateFilter.setDate(now.getDate() - 7);
    else if (period === 'month') dateFilter.setMonth(now.getMonth() - 1);
    else dateFilter = new Date(0);

    // Stats utilisateurs
    const [
      totalUsers,
      totalPartners,
      approvedPartners,
      pendingPartners,
      rejectedPartners,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'partner' }),
      User.countDocuments({ role: 'partner', partnerStatus: 'approved' }),
      User.countDocuments({ role: 'partner', partnerStatus: 'pending' }),
      User.countDocuments({ role: 'partner', partnerStatus: 'rejected' }),
    ]);

    // Stats bookings sur la période
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
    ] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: dateFilter } }),
      Booking.countDocuments({ bookingStatus: 'completed', createdAt: { $gte: dateFilter } }),
      Booking.countDocuments({ bookingStatus: 'cancelled', createdAt: { $gte: dateFilter } }),
    ]);

    // Revenus admin sur la période
    const revenueAgg = await Booking.aggregate([
      {
        $match: {
          bookingStatus: 'completed',
          createdAt: { $gte: dateFilter },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$fare' },
          totalCommission: { $sum: '$adminCommission' },
          totalPartnerPayout: { $sum: '$partnerAmount' },
        },
      },
    ]);

    const revenue = revenueAgg[0] ?? {
      totalRevenue: 0,
      totalCommission: 0,
      totalPartnerPayout: 0,
    };

    // Graphe revenus par jour
    const earningsAgg = await Booking.aggregate([
      {
        $match: {
          bookingStatus: 'completed',
          createdAt: { $gte: dateFilter },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%d/%m', date: '$createdAt' },
          },
          commission: { $sum: '$adminCommission' },
          revenue: { $sum: '$fare' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartData = earningsAgg.map(e => ({
      date: e._id,
      commission: Math.round(e.commission * 100) / 100,
      revenue: Math.round(e.revenue * 100) / 100,
      count: e.count,
    }));

    // Partenaires en attente de review
    const pendingReviews = await User.find({
      role: 'partner',
      partnerStatus: 'pending',
      partnerOnBoardingSteps: { $gte: 3 },
    }).select('name email createdAt').limit(5);

    // Nouveaux utilisateurs sur la période
    const newUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: dateFilter },
    });
    const newPartners = await User.countDocuments({
      role: 'partner',
      createdAt: { $gte: dateFilter },
    });

    return NextResponse.json({
      period,
      users: { totalUsers, totalPartners, approvedPartners, pendingPartners, rejectedPartners, newUsers, newPartners },
      bookings: { totalBookings, completedBookings, cancelledBookings },
      revenue: {
        totalRevenue: Math.round(revenue.totalRevenue * 100) / 100,
        totalCommission: Math.round(revenue.totalCommission * 100) / 100,
        totalPartnerPayout: Math.round(revenue.totalPartnerPayout * 100) / 100,
      },
      chartData,
      pendingReviews,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}