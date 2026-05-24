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
  { bookingStatus: 'requested' },
  { projection: { bookingStatus: 1, driver: 1, user: 1, createdAt: 1 } }
).toArray()
console.log(JSON.stringify(docs, null, 2))
await mongoose.disconnect()
