"use client"

import Link from "next/link"
import { motion } from "framer-motion"

import { ChangeEvent, useState } from "react"

type Availability = "AVAILABLE" | "UNAVAILABLE"

export default function RegisterRestaurant() {
  const [restaurant, setRestaurant] = useState({
    name: "",
    picture: null as File | null,
    address: "",
    phones: [""],
    contactPerson: "",
    email: "",
    hours: [
        { day: "Monday", open: "", close: "" },
        { day: "Tuesday", open: "", close: "" },
        { day: "Wednesday", open: "", close: "" },
        { day: "Thursday", open: "", close: "" },
        { day: "Friday", open: "", close: "" },
        { day: "Saturday", open: "", close: "" },
        { day: "Sunday", open: "", close: "" },
      ],
    menu: [
      { name: "", picture: null as File | null, price: "", availability: "AVAILABLE" as Availability }
    ]
  })

  // ---- Handlers ----
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRestaurant(prev => ({ ...prev, [name]: value }))
  }

  const handlePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setRestaurant(prev => ({ ...prev, picture: file }))
  }

  const handleHoursChange = (index: number, field: "open" | "close", value: string) => {
    const updatedHours = [...restaurant.hours]
    updatedHours[index][field] = value
    setRestaurant(prev => ({ ...prev, hours: updatedHours }))
  }
  
  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...restaurant.phones]
    newPhones[index] = value
    setRestaurant(prev => ({ ...prev, phones: newPhones }))
  }

  const addPhone = () => setRestaurant(prev => ({ ...prev, phones: [...prev.phones, ""] }))
  const removePhone = (index: number) =>
    setRestaurant(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }))

  const handleMenuChange = (
    index: number,
    field: "name" | "price" | "availability",
    value: string
  ) => {
    const newMenu = [...restaurant.menu]

    if (field === "price") {
      const numberValue = parseFloat(value)
      newMenu[index][field] = isNaN(numberValue) || numberValue < 0 ? "0.00" : numberValue.toFixed(2)
    } else if (field === "availability") {
      newMenu[index][field] = value as Availability
    } else {
      newMenu[index][field] = value
    }

    setRestaurant(prev => ({ ...prev, menu: newMenu }))
  }

  const handleMenuPictureChange = (index: number, file: File) => {
    const newMenu = [...restaurant.menu]
    newMenu[index].picture = file
    setRestaurant(prev => ({ ...prev, menu: newMenu }))
  }

  const addMenuItem = () =>
    setRestaurant(prev => ({
      ...prev,
      menu: [...prev.menu, { name: "", picture: null, price: "", availability: "AVAILABLE" }]
    }))

  const removeMenuItem = (index: number) =>
    setRestaurant(prev => ({ ...prev, menu: prev.menu.filter((_, i) => i !== index) }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Restaurant registration data:", restaurant)
    // send to backend via fetch/axios
  }

  return (
    <div
    className="min-h-screen flex flex-col bg-cover bg-center"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092')",
    }}
  >
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
        <Link href="/" className="text-white font-semibold hover:text-red-200">
          Home
        </Link>
        <Link href="/login" className="text-white font-semibold hover:text-red-200">
          Login
        </Link>
      </motion.nav>
    </header>

    <main className="flex justify-center mt-12 px-4">
    <div className="w-full max-w-3xl p-12 bg-red-50 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-red-600 mb-8">Register a Restaurant!</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Restaurant Name */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Restaurant Name</label>
          <input
            type="text"
            name="name"
            value={restaurant.name}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

      
        {/* Restaurant Picture */}
<div className="flex flex-col">
  <label className="font-semibold mb-1">Upload Restaurant Image (Optional)</label>
  <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
    {/* Camera icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7h2l1 2h12l1-2h2M5 7v13h14V7M9 11a3 3 0 116 0 3 3 0 01-6 0z"
      />
    </svg>
    <span className="text-gray-700">
      {restaurant.picture ? restaurant.picture.name : "Choose File"}
    </span>
    <input
      type="file"
      accept="image/*"
      onChange={handlePictureChange}
      className="hidden"
    />
  </label>
</div>


        {/* Address */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Street Address</label>
          <input
            type="text"
            name="address"
            value={restaurant.address}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* Contact Person */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Contact Person</label>
          <input
            type="text"
            name="contactPerson"
            value={restaurant.contactPerson}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={restaurant.email}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        {/* Opening Hours */}
        <div className="flex flex-col gap-2">
  <p className="font-semibold">Opening Hours</p>
  {restaurant.hours.map((h, i) => (
    <div key={i} className="flex gap-2 items-center">
      <span className="w-24 font-medium">{h.day}</span>
      <input
        type="time"
        value={h.open}
        onChange={e => handleHoursChange(i, "open", e.target.value)}
        className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
      />
      <span>to</span>
      <input
        type="time"
        value={h.close}
        onChange={e => handleHoursChange(i, "close", e.target.value)}
        className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
      />
    </div>
  ))}
</div>


        {/* Phone Numbers */}
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Phone Number(s)</p>
          {restaurant.phones.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <input
  type="tel"
  value={phone}
  onChange={e => handlePhoneChange(index, e.target.value)}
  pattern="\(\d{3}\)-\d{3}-\d{4}"
  placeholder="(123)-456-7890"
  required
  className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
/>
              {restaurant.phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPhone}
            className="self-start px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Add Phone
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-2 mt-4">
          <p className="font-semibold">Menu Items</p>
          {restaurant.menu.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 border p-3 rounded-lg">
              
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={e => handleMenuChange(index, "name", e.target.value)}
                  required
                  className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
                />
              </div>


              <label className="font-semibold mb-1">Upload Menu Image (Optional)</label>
              <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
             
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7h2l1 2h12l1-2h2M5 7v13h14V7M9 11a3 3 0 116 0 3 3 0 01-6 0z"
    />
  </svg>
  <span className="text-gray-700">
    {item.picture ? item.picture.name : "Choose File"}
  </span>
  <input
    type="file"
    accept="image/*"
    onChange={e => {
      const file = e.target.files?.[0]
      if (file) handleMenuPictureChange(index, file)
    }}
    className="hidden"
  />
</label>


              <div className="flex flex-col">
                <label className="font-semibold mb-1">Price</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={e => handleMenuChange(index, "price", e.target.value)}
                  required
                  min={0}
                  step={0.01}
                  className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold mb-1">Availability</label>
                <select
                  value={item.availability}
                  onChange={e => handleMenuChange(index, "availability", e.target.value)}
                  className={`p-2 rounded-lg border border-gray-300 ${
                    item.availability === "AVAILABLE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </div>

              {restaurant.menu.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMenuItem(index)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMenuItem}
            className="self-start px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mt-2"
          >
            Add Menu Item
          </button>
        </div>

        <button
          type="submit"
          className="mt-6 w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-green-500 transition"
        >
          Register My Restaurant!
        </button>
      </form>
    </div>
    </main>
</div>
  )
}





