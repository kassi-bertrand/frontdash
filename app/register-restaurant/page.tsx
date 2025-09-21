"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChangeEvent, useState, useEffect } from "react"
import React from "react"
import ProgressBar from "./progressbar"
import { CheckCircle2 } from "lucide-react"


type Availability = "AVAILABLE" | "UNAVAILABLE"

export default function RegisterRestaurant() {
  const [step, setStep] = useState(1)

  const [restaurant, setRestaurant] = useState({
    name: "",
    picture: null as File | null,
    building: "",
    street: "",
    city: "",
     state: "",
    address: "",
    phones: [""],
    contactPerson: "",
    email: "",
    cuisine: "", 
    customCuisine: "", 
    hours: [
      { day: "Monday", open: "", close: "", closed: false },
      { day: "Tuesday", open: "", close: "", closed: false },
      { day: "Wednesday", open: "", close: "", closed: false },
      { day: "Thursday", open: "", close: "", closed: false },
      { day: "Friday", open: "", close: "", closed: false },
      { day: "Saturday", open: "", close: "", closed: false },
      { day: "Sunday", open: "", close: "", closed: false },
    ],
    menu: [
      {
        name: "",
        picture: null as File | null,
        price: "",
        availability: "AVAILABLE" as Availability,
      },
    ],
  })

  // -------- Handlers --------
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRestaurant((prev) => ({ ...prev, [name]: value }))
  }

  const [imageUploaded, setImageUploaded] = useState(false);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
  
      setRestaurant({ ...restaurant, picture: file }); // save file in state if needed
      setImageUploaded(true); // show success message
    }
  };

  const handleHoursChange = (
    index: number,
    field: "open" | "close",
    value: string
  ) => {
    const updatedHours = [...restaurant.hours]
    updatedHours[index][field] = value
    setRestaurant((prev) => ({ ...prev, hours: updatedHours }))
  }

  const toggleClosed = (index: number) => {
    const updatedHours = [...restaurant.hours]
    updatedHours[index].closed = !updatedHours[index].closed
    if (updatedHours[index].closed) {
      updatedHours[index].open = ""
      updatedHours[index].close = ""
    }
    setRestaurant({ ...restaurant, hours: updatedHours })
  }

  const [phoneErrors, setPhoneErrors] = useState<string[]>(
    restaurant.phones.map(() => "")
  )

  const handlePhoneChange = (index: number, value: string) => {
    let digits = value.replace(/\D/g, "")
    let error = ""

    if (digits.startsWith("0")) {
      error = "Phone numbers cannot start with 0!"
      digits = ""
    }

    digits = digits.slice(0, 10)

    let formatted = digits
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)})-${digits.slice(
        3,
        6
      )}-${digits.slice(6)}`
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)})-${digits.slice(3)}`
    } else if (digits.length > 0) {
      formatted = `(${digits}`
    }

    const newPhones = [...restaurant.phones]
    newPhones[index] = formatted
    setRestaurant((prev) => ({ ...prev, phones: newPhones }))

    const newErrors = [...phoneErrors]
    newErrors[index] = error
    setPhoneErrors(newErrors)
  }

  const addPhone = () =>
    setRestaurant((prev) => ({ ...prev, phones: [...prev.phones, ""] }))
  const removePhone = (index: number) =>
    setRestaurant((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }))

  const [showStep1Error, setShowStep1Error] = useState(false);

  useEffect(() => {
    const hasMissingFields =
      !restaurant.name.trim() ||
      !restaurant.contactPerson.trim() ||
      !restaurant.address.trim() ||
      !restaurant.email.trim() ||
      restaurant.phones.length === 0 ||
      restaurant.phones.some((phone) => phone.trim() === "");
  
    if (!hasMissingFields) {
      setShowStep1Error(false);
    }
  }, [restaurant]); 


  
  const [showStep2Error, setShowStep2Error] = useState<string>("")
  
const [showMenu, setShowMenu] = useState(false)

  const handleMenuChange = (
    index: number,
    field: "name" | "price" | "availability",
    value: string
  ) => {
    const newMenu = [...restaurant.menu]

    if (field === "price") {
      const numberValue = parseFloat(value)
      newMenu[index][field] =
        isNaN(numberValue) || numberValue < 0
          ? "0.00"
          : numberValue.toFixed(2)
    } else if (field === "availability") {
      newMenu[index][field] = value as Availability
    } else {
      newMenu[index][field] = value
    }

    setRestaurant((prev) => ({ ...prev, menu: newMenu }))
  }

  const handleMenuPictureChange = (index: number, file: File) => {
    const newMenu = [...restaurant.menu]
    newMenu[index].picture = file
    setRestaurant((prev) => ({ ...prev, menu: newMenu }))
  }

  const [activeImageTab, setActiveImageTab] = useState<"restaurant" | "menu">("restaurant")

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hour, minute] = time.split(":").map(Number)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`
  }
  const [menuIndex, setMenuIndex] = useState(0)

  const addMenuItem = () =>
    setRestaurant((prev) => ({
      ...prev,
      menu: [
        ...prev.menu,
        {
          name: "",
          picture: null,
          price: "",
          availability: "AVAILABLE",
        },
      ],
    }))

  const removeMenuItem = (index: number) =>
    setRestaurant((prev) => ({
      ...prev,
      menu: prev.menu.filter((_, i) => i !== index),
    }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Restaurant registration data:", restaurant)
    setStep(4) // jump to "success" screen
  }


  
    // define steps here
    const steps = [
      "Restaurant Info",
      "Menu & Hours Of Operation",
      "Vertification",
      "Go Live",
    ]

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
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
          <Link
            href="/login"
            className="text-white font-semibold hover:text-red-200"
          >
            Login
          </Link>
        </motion.nav>
      </header>
  
      <main className="flex justify-center mt-12 px-4">
        <div className="w-full max-w-6xl p-6 bg-red-50 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center text-red-600 mb-8">
            Get Your Restaurant On FrontDash!
          </h2>

         {/* Step-specific message */}
<div className="text-left mb-6 text-gray-600 font-semibold text-lg">
  {step === 1 && "Tell Us About Your Restaurant!"}
  {step === 2 && "Upload Your Menu & Set Opening Hours!"}
  {step === 3 && "Verify Your Details Before Submission!"}
  {step === 4 && "All Done! 🎉"}
</div>

<ProgressBar step={step} steps={steps} />

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 sm:gap-8"
          >
            {/* Step 1: Restaurant Info */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                {/* Name + Contact Person */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="font-semibold mb-1 block">Restaurant Name</label>
                    <input
                      type="text"
                      name="name"
                      value={restaurant.name}
                      onChange={handleChange}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="font-semibold mb-1 block">Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={restaurant.contactPerson}
                      onChange={handleChange}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
                      required
                    />
                  </div>
                </div>
  
                  {/* Address */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="font-semibold mb-1 block">Building #</label>
        <input
          type="text"
          name="building"
          value={restaurant.building}
          onChange={handleChange}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
          required
        />
      </div>
      <div>
        <label className="font-semibold mb-1 block">Street</label>
        <input
          type="text"
          name="street"
          value={restaurant.street}
          onChange={handleChange}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
          required
        />
      </div>
      <div>
        <label className="font-semibold mb-1 block">City</label>
        <input
          type="text"
          name="city"
          value={restaurant.city}
          onChange={handleChange}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
          required
        />
      </div>
      <div>
        <label className="font-semibold mb-1 block">State</label>
        <input
          type="text"
          name="state"
          value={restaurant.state}
          onChange={handleChange}
          className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
          required
        />
      </div>
    </div>

    {/* Email */}
    <div>
      <label className="font-semibold mb-1 block">Email</label>
      <input
        type="email"
        name="email"
        value={restaurant.email}
        onChange={handleChange}
        pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
        title="Please enter a valid email address (e.g. name@example.com)"
        className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
        required
      />
    </div>

  
               {/* Phones + Restaurant Image */}
<div className="flex flex-col md:flex-row gap-4 items-start">
  {/* Phone Numbers */}
  <div className="flex-1 flex flex-col gap-2">
    <p className="font-semibold">Phone Number(s)</p>
    {restaurant.phones.map((phone, index) => (
      <div key={index} className="flex gap-2 items-center">
        <input
          type="tel"
          value={phone}
          onChange={(e) => handlePhoneChange(index, e.target.value)}
          placeholder="(123)-456-7890"
          required
          className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
        />
        {restaurant.phones.length > 1 && (
          <button
            type="button"
            onClick={() => removePhone(index)}
            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

  {/* Restaurant Image Upload */}
  <div className="flex-1 flex flex-col gap-2">
    <p className="font-semibold">Upload Restaurant Image (Optional)</p>
    <label
      htmlFor="restaurantImage"
      className="flex flex-col items-center rounded-lg p-4 text-white bg-red-600 shadow-sm sm:p-6 cursor-pointer hover:bg-red-700 w-full"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"
        />
      </svg>
      <span className="mt-4 font-medium">Browse Files</span>
      <input
        type="file"
        id="restaurantImage"
        accept="image/*"
        onChange={handlePictureChange}
        className="sr-only"
      />
    </label>

    {/* Success message */}
    {imageUploaded && (
      <p className="text-green-600 text-sm mt-2">
        Image successfully updated!
      </p>
    )}
  </div>
</div>

              </div>
            )}
{/* Step 2: Menu Upload + Opening Hours */}
{step === 2 && (
  <div className="flex flex-col gap-6">
    {/* Cuisine Selector (not collapsible) */}
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-red-600 text-lg">Cuisine Type</p>
      <select
        value={restaurant.cuisine}
        onChange={(e) =>
          setRestaurant({ ...restaurant, cuisine: e.target.value })
        }
        className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 w-full"
      >
        <option value="">Select Cuisine</option>
        <option value="Italian">Italian</option>
        <option value="Mexican">Mexican</option>
        <option value="Chinese">Chinese</option>
        <option value="Japanese">Japanese</option>
        <option value="Indian">Indian</option>
        <option value="French">French</option>
        <option value="Mediterranean">Mediterranean</option>
        <option value="American">American</option>
        <option value="Vegan">Vegan</option>
        <option value="Other">Other</option>
      </select>

      {restaurant.cuisine === "Other" && (
        <input
          type="text"
          placeholder="Enter cuisine"
          value={restaurant.customCuisine ?? ""}
          onChange={(e) =>
            setRestaurant({ ...restaurant, customCuisine: e.target.value })
          }
          className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
        />
      )}
    </div>

    {/* Collapsible: Menu Upload */}
    <details className="border rounded-lg">
      <summary className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded-t-lg font-semibold">
        Menu Upload
      </summary>
      <div className="p-4 space-y-4">
        {restaurant.menu.map((item, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3 bg-gray-50"
          >
            {/* Name + Price */}
            <div className="flex gap-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleMenuChange(index, "name", e.target.value)}
                placeholder="Dish Name"
                className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
              />

              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  handleMenuChange(index, "price", e.target.value)
                }
                placeholder="Price"
                className="w-32 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* File Upload with Thumbnail */}
            <div>
              <span className="text-sm text-gray-600">Upload Image (Optional)</span>
              <div
                className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-red-500 transition"
                onClick={() => {
                  const el = document.getElementById(
                    `menu-file-${index}`
                  ) as HTMLInputElement | null;
                  el?.click();
                }}
              >
                <input
                  id={`menu-file-${index}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMenuPictureChange(index, file);
                  }}
                />
                {item.picture ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={URL.createObjectURL(item.picture)}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                    <span className="text-green-600 text-sm">Image Uploaded</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Click to upload</span>
                )}
              </div>
            </div>

            {/* Availability as Pill Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Availability (Toggle On/Off): </label>
                <button
                  type="button"
                  onClick={() =>
                    handleMenuChange(
                      index,
                      "availability",
                      item.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE"
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    item.availability === "AVAILABLE"
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {item.availability}
                </button>
              </div>

              {restaurant.menu.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMenuItem(index)}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addMenuItem}
          className="self-start px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Add Menu Item
        </button>
      </div>
    </details>

    {/* Collapsible: Opening Hours */}
    <details className="border rounded-lg">
      <summary className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded-t-lg font-semibold">
        Opening Hours
      </summary>
      <div className="p-4 space-y-3">
        {restaurant.hours.map((h, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
          >
            <span className="w-24 font-medium">{h.day}</span>
            <input
              type="time"
              value={h.open}
              onChange={(e) => handleHoursChange(i, "open", e.target.value)}
              disabled={h.closed}
              className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 flex-1"
            />
            <span className="mx-1">to</span>
            <input
              type="time"
              value={h.close}
              onChange={(e) => handleHoursChange(i, "close", e.target.value)}
              disabled={h.closed}
              className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 flex-1"
            />

            {/* Prettier toggle */}
            <button
              type="button"
              onClick={() => toggleClosed(i)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                h.closed
                  ? "bg-gray-400 text-white"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {h.closed ? "Closed" : "Open"}
            </button>
          </div>
        ))}
      </div>
    </details>
  </div>
)}

{/* Step 3: Verification */}
{step === 3 && (
  <div>
    <h3 className="text-xl font-semibold mb-4 text-red-600">
      Like what you see?
    </h3>

    <div className="bg-white p-6 rounded-lg shadow-md space-y-8">
      {/* Restaurant Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-bold mb-2">Restaurant Info</h4>
          <p><span className="font-semibold">Name:</span> {restaurant.name}</p>
          <p><span className="font-semibold">Contact Person:</span> {restaurant.contactPerson}</p>
          <p><span className="font-semibold">Email:</span> {restaurant.email}</p>

          {/* One-line Address */}
          <p>
            <span className="font-semibold">Address:</span>{" "}
            {restaurant.building} {restaurant.street}, {restaurant.city}, {restaurant.state}
          </p>

          <p><span className="font-semibold">Phone(s):</span> {restaurant.phones.join(", ")}</p>
          <p><span className="font-semibold">Cuisine:</span> {restaurant.cuisine}</p>
        </div>

        {restaurant.picture && (
          <div className="flex justify-center">
            <img
              src={URL.createObjectURL(restaurant.picture)}
              alt="Restaurant preview"
              className="w-48 h-48 object-cover rounded-lg border shadow"
            />
          </div>
        )}
      </div>

      {/* Menu Items Carousel */}
      <div>
        <h4 className="text-lg font-bold mb-4">Menu Items</h4>
        {restaurant.menu.length > 0 && (
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="bg-gray-50 p-6 rounded-lg shadow flex flex-col md:flex-row items-center gap-6">
              {/* Left: Info */}
              <div className="flex-1">
                <p><span className="font-semibold">Item:</span> {restaurant.menu[menuIndex].name}</p>
                <p><span className="font-semibold">Price:</span> ${restaurant.menu[menuIndex].price}</p>
                <p>
                  <span className="font-semibold">Availability:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      restaurant.menu[menuIndex].availability === "AVAILABLE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {restaurant.menu[menuIndex].availability}
                  </span>
                </p>
              </div>

              {/* Right: Image */}
              {restaurant.menu[menuIndex].picture && (
                <img
                  src={URL.createObjectURL(restaurant.menu[menuIndex].picture)}
                  alt={`Menu item ${restaurant.menu[menuIndex].name}`}
                  className="w-40 h-40 object-cover rounded-lg border shadow"
                />
              )}
            </div>

            {/* Overlay arrows */}
            {restaurant.menu.length > 1 && (
  <>
    <button
      type="button"
      onClick={() =>
        setMenuIndex((menuIndex - 1 + restaurant.menu.length) % restaurant.menu.length)
      }
      className="absolute -left-12 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition"
    >
      ←
    </button>
    <button
      type="button"
      onClick={() =>
        setMenuIndex((menuIndex + 1) % restaurant.menu.length)
      }
      className="absolute -right-12 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition"
    >
      →
    </button>
  </>
)}
          </div>
        )}
      </div>

      {/* Opening Hours */}
      <div>
        <h4 className="text-lg font-bold mb-2">Opening Hours</h4>
        {restaurant.hours.map((h, i) => (
          <p key={i}>
            <span className="font-semibold">{h.day}:</span>{" "}
            {h.closed
              ? "Closed"
              : `${formatTime(h.open)} – ${formatTime(h.close)}`}
          </p>
        ))}
      </div>
    </div>
  </div>
)}

            {/* Step 4: Success */}
{step === 4 && (
  <div className="flex items-center justify-center py-16 bg-gradient-to-b from-red-50 to-white">
    <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-md w-full">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-green-600">
        Registration Form Submitted!
      </h3>
      <p className="mt-3 text-gray-700">
        Please wait for an admin to verify and approve. <br />
        Check your email for updates.
      </p>
      <p className="mt-2 text-gray-600">Thank you for choosing <span className="font-semibold text-red-600">FrontDash</span>!</p>

      {/* Back Home Button */}
      <div className="mt-8">
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-red-600 text-white font-medium rounded-lg shadow hover:bg-red-700 transition transform hover:scale-105"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  </div>
)}


 {/* Navigation buttons */}
{step < 4 && (
  <div className={`flex mt-6 ${step === 1 ? "flex-col items-end gap-2" : "justify-between"}`}>
    
    {/* Back button */}
    {step > 1 && (
      <button
        type="button"
        onClick={() => setStep(step - 1)}
        className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
      >
        Back
      </button>
    )}

    {/* Step 1: Next button with inline error */}
    {step === 1 && (
      <div className="flex flex-col items-end gap-2">
        {showStep1Error && (
          <p className="text-red-600 text-sm self-start">
            Please check that you have correctly filled out all required fields before continuing.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            const hasMissingFields =
    !restaurant.name.trim() ||
    !restaurant.contactPerson.trim() ||
    !restaurant.building.trim() ||
    !restaurant.street.trim() ||
    !restaurant.city.trim() ||
    !restaurant.state.trim() ||
    !restaurant.email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(restaurant.email) || // regex check
    restaurant.phones.length === 0 ||
    restaurant.phones.some((phone) => phone.trim() === "");

            if (hasMissingFields) {
              setShowStep1Error(true); // show alert
            } else {
              setShowStep1Error(false);
              setStep(step + 1); // go to next step
            }
          }}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800"
        >
          Next
        </button>
      </div>
    )}

    {/* Step 2: Next button with validation */}
{step === 2 && (
  <div className="flex flex-col items-end gap-2">
    {showStep2Error && (
      <p className="text-red-600 text-sm self-start">{showStep2Error}</p>
    )}

    <button
      type="button"
      onClick={() => {
        const hasMenuItem = restaurant.menu.some(
          (item) =>
            item.name.trim() !== "" &&
            item.price !== "" &&
            item.price !== "0.00" &&  // ignore the default placeholder
            parseFloat(item.price) > 0
        )
        
        const hasOpenDay = restaurant.hours.some(
          (day) =>
            !day.closed &&
            day.open?.trim() !== "" &&
            day.close?.trim() !== ""
        )

        console.log({ hasMenuItem, hasOpenDay })

        if (!hasMenuItem) {
          setShowStep2Error("Please add at least one menu item with a name and price.")
          return
        }

        if (!hasOpenDay) {
          setShowStep2Error("Please ensure at least one time slot is filled out.")
          return
        }

        // Passed validation
        setShowStep2Error("")
        setStep(step + 1)
      }}
      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800"
    >
      Next
    </button>
  </div>
)}

    {/* Step 3: Submit button */}
    {step === 3 && (
      <button
        type="submit"
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Submit
      </button>
    )}
  </div>
)}


          </form>
          
        </div>
      </main>
    </div>
  );
}

