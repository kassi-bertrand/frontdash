"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function Home() {
  // Dummy restaurants with fixed statuses
  const demoRestaurants = [
    {
      id: 1,
      name: "Bella Italia",
      image: "https://images.pexels.com/photos/2619967/pexels-photo-2619967.jpeg",
      status: "OPEN",
    },
    {
      id: 2,
      name: "Sakura Sushi",
      image: "https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg",
      status: "CLOSED",
    },
    {
      id: 3,
      name: "Taco Bar",
      image: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg",
      status: "OPEN",
    },
    {
      id: 4,
      name: "Burger Barn",
      image: "https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg",
      status: "CLOSED",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-4 border-b-2 border-red-600 bg-red-600">
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-2xl font-bold text-white"
        >
          Front<span className="text-black">Dash</span>
        </motion.div>
        <motion.nav
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-x-6"
        >
          <Link href="/register-restaurant" className="text-white font-semibold hover:text-red-200">
            Register a Restaurant
          </Link>
          <Link href="/login" className="text-white font-semibold hover:text-red-200">
            Login
          </Link>
        </motion.nav>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section
          className="relative h-[60vh] min-h-[300px] flex items-center justify-center text-white"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-black/50 p-10 rounded-lg text-center"
          >
            <h1 className="text-4xl sm:text-6xl font-extrabold">
              Welcome To <span className="text-red-500">FrontDash!</span>
            </h1>
          </motion.div>
        </section>

        {/* Restaurants */}
        <section className="flex-1 bg-red-50 py-10 border-t-2 border-red-600">
          <div className="px-4 sm:px-6 lg:px-10">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-2xl font-bold text-red-600 mb-6"
            >
              Hungry? Browse Our Restaurants!
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {demoRestaurants.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * i, duration: 0.5 }}
                  className="group shadow-md rounded-xl overflow-hidden border hover:shadow-xl transition relative"
                >
                  <img
                    src={r.image}
                    alt={r.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* Open/Closed Badge */}
                  <span
                    className={`absolute top-2 left-2 px-2 py-1 rounded text-sm font-semibold ${
                      r.status === "OPEN" ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                    }`}
                  >
                    {r.status}
                  </span>

                  <p className="p-3 text-center font-semibold text-red-600">
                    <Link href={`/restaurant/${r.id}`}>{r.name}</Link>
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-6 text-right"
            >
              <Link
                href="/restaurants"
                className="inline-block bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Show More →
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}



