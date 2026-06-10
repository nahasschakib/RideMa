const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: "/partner/bookings/:id",
        destination: "/partner/bookings?bookingId=:id",
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
}
export default nextConfig