import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';
import Booking from '@/models/booking.model';
import Delivery from '@/models/delivery.model';
import Wallet from '@/models/wallet.model';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') ?? 'month'; // day, week, month, year

    // Calcul des dates
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        prevStartDate = new Date(startDate); prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(startDate);
        break;
      case 'week':
        startDate = new Date(now); startDate.setDate(now.getDate() - 7);
        prevStartDate = new Date(startDate); prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(startDate);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    // ── BOOKINGS ──
    const [totalBookings, completedBookings, cancelledBookings, prevCompletedBookings] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.countDocuments({ bookingStatus: 'completed', createdAt: { $gte: startDate } }),
      Booking.countDocuments({ bookingStatus: 'cancelled', createdAt: { $gte: startDate } }),
      Booking.countDocuments({ bookingStatus: 'completed', createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
    ]);

    // ── REVENUS ──
    const revenueAgg = await Booking.aggregate([
      { $match: { bookingStatus: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$fare' }, commission: { $sum: '$adminCommission' } } },
    ]);
    const prevRevenueAgg = await Booking.aggregate([
      { $match: { bookingStatus: 'completed', createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
      { $group: { _id: null, total: { $sum: '$fare' }, commission: { $sum: '$adminCommission' } } },
    ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const totalCommission = revenueAgg[0]?.commission ?? 0;
    const prevRevenue = prevRevenueAgg[0]?.total ?? 0;
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null;

    // ── LIVRAISONS ──
    const [totalDeliveries, completedDeliveries] = await Promise.all([
      Delivery.countDocuments({ createdAt: { $gte: startDate } }),
      Delivery.countDocuments({ status: 'delivered', createdAt: { $gte: startDate } }),
    ]);

    const deliveryRevenueAgg = await Delivery.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const deliveryRevenue = deliveryRevenueAgg[0]?.total ?? 0;

    // ── UTILISATEURS ──
    const [totalClients, newClients, totalPartners, activePartners] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startDate } }),
      User.countDocuments({ role: 'partner' }),
      User.countDocuments({ role: 'partner', partnerStatus: 'approved' }),
    ]);

    // ── GRAPHIQUE REVENUS QUOTIDIENS (30 derniers jours) ──
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyRevenueAgg = await Booking.aggregate([
      { $match: { bookingStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$fare' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── REVENUS PAR VILLE ──
    const cityRevenueAgg = await Booking.aggregate([
      { $match: { bookingStatus: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: '$city', revenue: { $sum: '$fare' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // ── TOP CHAUFFEURS ──
    const topDrivers = await Booking.aggregate([
      { $match: { bookingStatus: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: '$driver', earnings: { $sum: '$partnerAmount' }, rides: { $sum: 1 } } },
      { $sort: { earnings: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'driver' } },
      { $unwind: '$driver' },
      { $project: { name: '$driver.name', email: '$driver.email', earnings: 1, rides: 1 } },
    ]);

    // ── WALLET ADMIN ──
    const adminWallet = await Wallet.findOne({ ownerType: 'admin' });

    return NextResponse.json({
      period,
      overview: {
        totalRevenue,
        totalCommission,
        deliveryRevenue,
        grandTotal: totalRevenue + deliveryRevenue,
        revenueGrowth,
        totalBookings,
        completedBookings,
        cancelledBookings,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0,
        totalDeliveries,
        completedDeliveries,
        totalClients,
        newClients,
        totalPartners,
        activePartners,
        adminWalletBalance: adminWallet?.balance ?? 0,
      },
      charts: {
        dailyRevenue: dailyRevenueAgg,
        cityRevenue: cityRevenueAgg,
      },
      topDrivers,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}