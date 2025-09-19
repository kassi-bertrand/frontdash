"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function Home() {
  return (

    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-10 py-4 border-b-2 border-red-600 bg-red-600">
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
          <Link
            href="/register-restaurant"
            className="text-white font-semibold hover:text-red-200"
          >
            Register a Restaurant
          </Link>
          <Link
            href="/login"
            className="text-white font-semibold hover:text-red-200"
          >
            Login
          </Link>
        </motion.nav>
      </header>

      {/* Hero */}
      <section
        className="relative h-[400px] flex items-center justify-center text-white"
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
        <h1 className="text-6xl font-extrabold">
  Welcome To <span className="text-red-500">FrontDash!</span>
</h1>


        </motion.div>
      </section>

      {/* Restaurants */}
      <section className="bg-red-50 py-10 border-t-2 border-red-600">
        <div className="px-10">
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold text-red-600 mb-6"
          >
            Hungry? Browse Our Restaurants!
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((id, i) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * i, duration: 0.5 }}
                className="group shadow-md rounded-xl overflow-hidden border hover:shadow-xl transition"
              >
                <img
                  src="https://images.pexels.com/photos/4109130/pexels-photo-4109130.jpeg"
                  alt="Restaurant"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                />
                <p className="p-3 text-center font-semibold text-red-600">
                  <Link href={`/restaurant/${id}`}>Restaurant {id}</Link>
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
    </div>
  )
}
