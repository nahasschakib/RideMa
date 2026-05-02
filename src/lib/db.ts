import mongoose from "mongoose"

const mongodbUrl = process.env.MONGODB_URL

if (!mongodbUrl) {
  throw new Error("MONGODB_URL is not defined in environment variables")
}

let cached = global.mongooseConn
if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null }
}

const dbConnect = async () => {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUrl, {
      tls: true,
      tlsAllowInvalidCertificates: true,   // ← fix SSL
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then(c => c.connection)
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null   // ← reset pour permettre un retry
    console.error("Error connecting to MongoDB:", error)
    throw error             // ← propager l'erreur au lieu de retourner undefined
  }
}

export default dbConnect