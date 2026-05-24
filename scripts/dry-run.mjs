import mongoose from 'mongoose'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
env.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val.length) {
    const raw = val.join('=').trim()
    process.env[key.trim()] = raw.replace(/^["']|["']$/g, '')
  }
})

await mongoose.connect(process.env.MONGODB_URL)
const col = mongoose.connection.collection('bookings')
const docs = await col.find(
  { bookingStatus: { $in: ['requested', 'awaiting_payment', 'confirmed', 'started'] } },
  { projection: { bookingStatus: 1, updatedAt: 1, user: 1 } }
).toArray()
console.log(JSON.stringify(docs, null, 2))

const result = await col.updateMany(
  { bookingStatus: 'started' },
  { $set: { bookingStatus: 'completed' } }
)
console.log(`started → completed : ${result.modifiedCount} booking(s) mis à jour`)

await mongoose.disconnect()
