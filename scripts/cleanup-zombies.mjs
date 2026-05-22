import mongoose from 'mongoose'

await mongoose.connect(process.env.MONGODB_URL)

const result = await mongoose.connection.collection('bookings').updateMany(
  {
    bookingStatus: { $in: ["requested", "awaiting_payment", "confirmed"] },
    updatedAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) }
  },
  { $set: { bookingStatus: "expired" } }
)

console.log('Bookings expirés:', result.modifiedCount)
await mongoose.disconnect()
