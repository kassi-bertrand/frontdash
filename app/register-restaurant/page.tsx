'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChangeEvent, useState, useEffect } from 'react'
import React from 'react'
import ProgressBar from './progressbar'
import { CheckCircle2 } from 'lucide-react'

type Availability = 'AVAILABLE' | 'UNAVAILABLE'

type FilePreviewProps = {
  file: File
  alt: string
  width: number
  height: number
  className?: string
}

/**
 * Renders a temporary preview for a locally uploaded image using Next/Image so
 * we get consistent styling without committing the asset.
 */
function FilePreview({ file, alt, width, height, className }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!previewUrl) {
    return null
  }

  return (
    <Image
      src={previewUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  )
}

/**
 * Multi-step onboarding wizard used for restaurant self-registration. Holds
 * mock state and validation that the backend team can later replace with form
 * actions and API calls.
 */
export default function RegisterRestaurant() {
  const [step, setStep] = useState(1)

  const [restaurant, setRestaurant] = useState({
    name: '',
    picture: null as File | null,
    building: '',
    street: '',
    city: '',
    state: '',
    address: '',
    phones: [''],
    contactPerson: '',
    email: '',
    cuisine: '',
    customCuisine: '',
    hours: [
      { day: 'Monday', open: '', close: '', closed: false },
      { day: 'Tuesday', open: '', close: '', closed: false },
      { day: 'Wednesday', open: '', close: '', closed: false },
      { day: 'Thursday', open: '', close: '', closed: false },
      { day: 'Friday', open: '', close: '', closed: false },
      { day: 'Saturday', open: '', close: '', closed: false },
      { day: 'Sunday', open: '', close: '', closed: false },
    ],
    menu: [
      {
        name: '',
        picture: null as File | null,
        price: '',
        availability: 'AVAILABLE' as Availability,
      },
    ],
  })

  // -------- Handlers --------
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    // Update restaurant state
    setRestaurant((prev) => ({ ...prev, [name]: value }));
  
    // Clear field error if the field is now valid
    setFieldErrors((prev) => ({
      ...prev,
      [name]:
        name === 'email'
          ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.trim() === ''
            ? 'Valid Email is required'
            : ''
          : value.trim() === ''
          ? `${name} is required`
          : '',
    }));
  
    // Optionally hide the general Step 1 error if no errors remain
    setShowStep1Error(false);
  };

  
  const [imageUploaded, setImageUploaded] = useState(false)

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      setRestaurant({ ...restaurant, picture: file }) // save file in state if needed
      setImageUploaded(true) // show success message
    }
  }

  const handleHoursChange = (index: number, field: 'open' | 'close', value: string) => {
    const updatedHours = [...restaurant.hours]
    updatedHours[index][field] = value
    setRestaurant((prev) => ({ ...prev, hours: updatedHours }))
  }

  const toggleClosed = (index: number) => {
    const updatedHours = [...restaurant.hours]
    updatedHours[index].closed = !updatedHours[index].closed
    if (updatedHours[index].closed) {
      updatedHours[index].open = ''
      updatedHours[index].close = ''
    }
    setRestaurant({ ...restaurant, hours: updatedHours })
  }

  const [phoneErrors, setPhoneErrors] = useState<string[]>(
    restaurant.phones.map(() => ''),
  )

  const handlePhoneChange = (index: number, value: string) => {
    let digits = value.replace(/\D/g, '');
    let error = '';
  
    // Check for leading 0
    if (digits.startsWith('0')) {
      error = 'Phone numbers cannot start with 0!';
      digits = '';
    }
  
    // Limit to 10 digits
    digits = digits.slice(0, 10);
  
    // Format the phone number
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)})-${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
  
    // Update restaurant phones
    const newPhones = [...restaurant.phones];
    newPhones[index] = formatted;
    setRestaurant((prev) => ({ ...prev, phones: newPhones }));
  
    // Update phone errors
    const newErrors = [...phoneErrors];
    newErrors[index] = 
      error || (digits.length === 10 ? '' : 'Phone number must be 10 digits');
    setPhoneErrors(newErrors);
  
    if (!newErrors.some((err) => err)) {
      setShowStep1Error(false);
    }
  };
  

  const addPhone = () =>
    setRestaurant((prev) => ({ ...prev, phones: [...prev.phones, ''] }))
  const removePhone = (index: number) =>
    setRestaurant((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }))

  const [showStep1Error, setShowStep1Error] = useState(false)

  useEffect(() => {
    const hasMissingFields =
      !restaurant.name.trim() ||
      !restaurant.contactPerson.trim() ||
      !restaurant.address.trim() ||
      !restaurant.email.trim() ||
      restaurant.phones.length === 0 ||
      restaurant.phones.some((phone) => phone.trim() === '')

    if (!hasMissingFields) {
      setShowStep1Error(false)
    }
  }, [restaurant])

  const [showStep2Error, setShowStep2Error] = useState<string>('')

  const [showMenu, setShowMenu] = useState(false)

 // Add this at the top of your component
 const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

 const newFieldErrors: typeof fieldErrors = {
   name: !restaurant.name.trim() ? 'Restaurant Name is required' : '',
   contactPerson: !restaurant.contactPerson.trim() ? 'Contact Person is required' : '',
   building: !restaurant.building.trim() ? 'Building is required' : '',
   street: !restaurant.street.trim() ? 'Street is required' : '',
   city: !restaurant.city.trim() ? 'City is required' : '',
   state: !restaurant.state.trim() ? 'State is required' : '',
   email:
     !restaurant.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(restaurant.email)
       ? 'Valid Email is required'
       : '',
 };
 
// Updated Next button handler for Step 1
const handleStep1Next = () => {
  const errors: { [key: string]: string } = {};

  errors.name = !restaurant.name.trim() ? 'Restaurant Name is required' : '';
  errors.contactPerson = !restaurant.contactPerson.trim() ? 'Contact Person is required' : '';
  errors.building = !restaurant.building.trim() ? 'Building is required' : '';
  errors.street = !restaurant.street.trim() ? 'Street is required' : '';
  errors.city = !restaurant.city.trim() ? 'City is required' : '';
  errors.state = !restaurant.state.trim() ? 'State is required' : '';
  errors.email =
    !restaurant.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(restaurant.email)
      ? 'Valid Email is required'
      : '';
  errors.phones =
    restaurant.phones.length === 0 || restaurant.phones.some((phone) => phone.trim() === '')
      ? 'At least one phone number is required'
      : '';

  setFieldErrors(errors);

  const hasErrors = Object.values(errors).some((v) => v !== ''); // any non-empty string means error

  if (!hasErrors) {
    setStep(step + 1);
  }
};



  const handleMenuChange = (
    index: number,
    field: 'name' | 'price' | 'availability',
    value: string,
  ) => {
    const newMenu = [...restaurant.menu]

    if (field === 'price') {
      const numberValue = parseFloat(value)
      newMenu[index][field] =
        isNaN(numberValue) || numberValue < 0 ? '0.00' : numberValue.toFixed(2)
    } else if (field === 'availability') {
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

  const [activeImageTab, setActiveImageTab] = useState<'restaurant' | 'menu'>(
    'restaurant',
  )

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hour, minute] = time.split(':').map(Number)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`
  }
  const [menuIndex, setMenuIndex] = useState(0)

  const addMenuItem = () =>
    setRestaurant((prev) => ({
      ...prev,
      menu: [
        ...prev.menu,
        {
          name: '',
          picture: null,
          price: '',
          availability: 'AVAILABLE',
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
    console.log('Restaurant registration data:', restaurant)
    setStep(4) // jump to "success" screen
  }

  // define steps here
  const steps = [
    'Restaurant Info',
    'Menu & Hours Of Operation',
    'Vertification',
    'Go Live',
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
          <Link href="/login" className="text-white font-semibold hover:text-red-200">
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
            {step === 1 && 'Tell Us About Your Restaurant!'}
            {step === 2 && 'Upload Your Menu & Set Opening Hours!'}
            {step === 3 && 'Verify Your Details Before Submission!'}
            {step === 4 && 'All Done! 🎉'}
          </div>

          <ProgressBar step={step} steps={steps} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
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
          className={`p-3 rounded-lg border focus:ring-2 focus:ring-red-500 w-full ${
            fieldErrors.name ? 'border-red-600 animate-pulse' : 'border-gray-300'
          }`}
        />
        {fieldErrors.name && (
          <p className="text-red-600 text-sm mt-1">Restaurant Name is required</p>
        )}
      </div>
      <div className="flex-1">
        <label className="font-semibold mb-1 block">Contact Person</label>
        <input
          type="text"
          name="contactPerson"
          value={restaurant.contactPerson}
          onChange={handleChange}
          className={`p-3 rounded-lg border focus:ring-2 focus:ring-red-500 w-full ${
            fieldErrors.contactPerson ? 'border-red-600 animate-pulse' : 'border-gray-300'
          }`}
        />
        {fieldErrors.contactPerson && (
          <p className="text-red-600 text-sm mt-1">Contact Person is required</p>
        )}
      </div>
    </div>

    {/* Address */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {['building','street','city','state'].map((field) => (
        <div key={field}>
          <label className="font-semibold mb-1 block">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
          <input
            type="text"
            name={field}
            value={restaurant[field as keyof typeof restaurant] as string}
            onChange={handleChange}
            className={`p-3 rounded-lg border focus:ring-2 focus:ring-red-500 w-full ${
              fieldErrors[field as keyof typeof restaurant] ? 'border-red-600 animate-pulse' : 'border-gray-300'
            }`}
          />
          {fieldErrors[field as keyof typeof restaurant] && (
            <p className="text-red-600 text-sm mt-1">{field.charAt(0).toUpperCase() + field.slice(1)} is required</p>
          )}
        </div>
      ))}
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
        className={`p-3 rounded-lg border focus:ring-2 focus:ring-red-500 w-full ${
          fieldErrors.email ? 'border-red-600 animate-pulse' : 'border-gray-300'
        }`}
      />
      {fieldErrors.email && (
        <p className="text-red-600 text-sm mt-1">Valid Email is required</p>
      )}
    </div>

    {/* Phones */}
    <div className="flex flex-col md:flex-row gap-4 items-start">
    <div className="flex-1 flex flex-col gap-2">
  <p className="font-semibold">Phone Number(s)</p>
  {restaurant.phones.map((phone, index) => (
    <div key={index} className="flex flex-col gap-1">
      <div className="flex gap-2 items-center">
        <input
          type="tel"
          value={phone}
          onChange={(e) => handlePhoneChange(index, e.target.value)}
          placeholder="(123)-456-7890"
          required
          className={`flex-1 p-2 rounded-lg border w-full focus:ring-2 ${
            phoneErrors[index]
              ? 'border-red-600 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
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
      {/* Inline phone error */}
      {phoneErrors[index] && (
        <p className="text-red-600 text-sm">{phoneErrors[index]}</p>
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


      {/* Restaurant Image */}
      <div className="flex-1 flex flex-col gap-2">
        <p className="font-semibold">Upload Restaurant Image (Optional)</p>
        <label
          htmlFor="restaurantImage"
          className="flex flex-col items-center rounded-lg p-4 text-white bg-red-600 shadow-sm sm:p-6 cursor-pointer hover:bg-red-700 w-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"/>
          </svg>
          <span className="mt-4 font-medium">Browse Files</span>
          <input type="file" id="restaurantImage" accept="image/*" onChange={handlePictureChange} className="sr-only"/>
        </label>

        {imageUploaded && (
          <p className="text-green-600 text-sm mt-2">Image successfully updated!</p>
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

                  {restaurant.cuisine === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter cuisine"
                      value={restaurant.customCuisine ?? ''}
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
                            onChange={(e) =>
                              handleMenuChange(index, 'name', e.target.value)
                            }
                            placeholder="Dish Name"
                            className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
                          />

                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleMenuChange(index, 'price', e.target.value)
                            }
                            placeholder="Price"
                            className="w-32 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        {/* File Upload with Thumbnail */}
                        <div>
                          <span className="text-sm text-gray-600">
                            Upload Image (Optional)
                          </span>
                          <div
                            className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-red-500 transition"
                            onClick={() => {
                              const el = document.getElementById(
                                `menu-file-${index}`,
                              ) as HTMLInputElement | null
                              el?.click()
                            }}
                          >
                            <input
                              id={`menu-file-${index}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleMenuPictureChange(index, file)
                              }}
                            />
                            {item.picture ? (
                              <div className="flex items-center gap-2">
                                <FilePreview
                                  file={item.picture}
                                  alt="Menu item preview"
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded object-cover"
                                />
                                <span className="text-green-600 text-sm">
                                  Image Uploaded
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Click to upload</span>
                            )}
                          </div>
                        </div>

                        {/* Availability as Pill Toggle */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">
                              Availability (Toggle On/Off):{' '}
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                handleMenuChange(
                                  index,
                                  'availability',
                                  item.availability === 'AVAILABLE'
                                    ? 'UNAVAILABLE'
                                    : 'AVAILABLE',
                                )
                              }
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                                item.availability === 'AVAILABLE'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
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
                          onChange={(e) => handleHoursChange(i, 'open', e.target.value)}
                          disabled={h.closed}
                          className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 flex-1"
                        />
                        <span className="mx-1">to</span>
                        <input
                          type="time"
                          value={h.close}
                          onChange={(e) => handleHoursChange(i, 'close', e.target.value)}
                          disabled={h.closed}
                          className="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 flex-1"
                        />

                        {/* Prettier toggle */}
                        <button
                          type="button"
                          onClick={() => toggleClosed(i)}
                          className={`px-4 py-2 rounded-full font-medium transition ${
                            h.closed
                              ? 'bg-gray-400 text-white'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {h.closed ? 'Closed' : 'Open'}
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
                      <p>
                        <span className="font-semibold">Name:</span> {restaurant.name}
                      </p>
                      <p>
                        <span className="font-semibold">Contact Person:</span>{' '}
                        {restaurant.contactPerson}
                      </p>
                      <p>
                        <span className="font-semibold">Email:</span> {restaurant.email}
                      </p>

                      {/* One-line Address */}
                      <p>
                        <span className="font-semibold">Address:</span>{' '}
                        {restaurant.building} {restaurant.street}, {restaurant.city},{' '}
                        {restaurant.state}
                      </p>

                      <p>
                        <span className="font-semibold">Phone(s):</span>{' '}
                        {restaurant.phones.join(', ')}
                      </p>
                      <p>
                        <span className="font-semibold">Cuisine:</span>{' '}
                        {restaurant.cuisine}
                      </p>
                    </div>

                    {restaurant.picture && (
                      <div className="flex justify-center">
                        <FilePreview
                          file={restaurant.picture}
                          alt="Restaurant preview"
                          width={192}
                          height={192}
                          className="h-48 w-48 rounded-lg border object-cover shadow"
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
                            <p>
                              <span className="font-semibold">Item:</span>{' '}
                              {restaurant.menu[menuIndex].name}
                            </p>
                            <p>
                              <span className="font-semibold">Price:</span> $
                              {restaurant.menu[menuIndex].price}
                            </p>
                            <p>
                              <span className="font-semibold">Availability:</span>{' '}
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  restaurant.menu[menuIndex].availability === 'AVAILABLE'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {restaurant.menu[menuIndex].availability}
                              </span>
                            </p>
                          </div>

                          {/* Right: Image */}
                          {restaurant.menu[menuIndex].picture && (
                            <FilePreview
                              file={restaurant.menu[menuIndex].picture}
                              alt={`Menu item ${restaurant.menu[menuIndex].name}`}
                              width={160}
                              height={160}
                              className="h-40 w-40 rounded-lg border object-cover shadow"
                            />
                          )}
                        </div>

                        {/* Overlay arrows */}
                        {restaurant.menu.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setMenuIndex(
                                  (menuIndex - 1 + restaurant.menu.length) %
                                    restaurant.menu.length,
                                )
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
                        <span className="font-semibold">{h.day}:</span>{' '}
                        {h.closed
                          ? 'Closed'
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
                  <p className="mt-2 text-gray-600">
                    Thank you for choosing{' '}
                    <span className="font-semibold text-red-600">FrontDash</span>!
                  </p>

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
              <div
                className={`flex mt-6 ${step === 1 ? 'flex-col items-end gap-2' : 'justify-between'}`}
              >
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

{step === 1 && (
  <div className="flex flex-col items-end gap-2">
    {/* General Step Error */}
    {showStep1Error && (
      <p className="text-red-600 text-sm self-start">
        Please check that you have correctly filled out all required fields before continuing.
      </p>
    )}

    {/* Next Button */}
    <button
      type="button"
      onClick={() => {
        // Validate fields
        const newFieldErrors: typeof fieldErrors = {
          name: !restaurant.name.trim() ? 'Restaurant Name is required' : '',
          contactPerson: !restaurant.contactPerson.trim() ? 'Contact Person is required' : '',
          building: !restaurant.building.trim() ? 'Building is required' : '',
          street: !restaurant.street.trim() ? 'Street is required' : '',
          city: !restaurant.city.trim() ? 'City is required' : '',
          state: !restaurant.state.trim() ? 'State is required' : '',
          email:
            !restaurant.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(restaurant.email)
              ? 'Valid Email is required'
              : '',
        }

        // Validate phones
        const newPhoneErrors = restaurant.phones.map(
          (phone) => (phone.trim() === '' ? 'Phone is required' : '')
        )

        setFieldErrors(newFieldErrors)
        setPhoneErrors(newPhoneErrors)

        // Check if any errors exist
        const hasErrors =
          Object.values(newFieldErrors).some((msg) => msg !== '') ||
          newPhoneErrors.some((msg) => msg !== '')

        if (hasErrors) {
          setShowStep1Error(true)
        } else {
          setShowStep1Error(false)
          setStep(step + 1)
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
                            item.name.trim() !== '' &&
                            item.price !== '' &&
                            item.price !== '0.00' && // ignore the default placeholder
                            parseFloat(item.price) > 0,
                        )

                        const hasOpenDay = restaurant.hours.some(
                          (day) =>
                            !day.closed &&
                            day.open?.trim() !== '' &&
                            day.close?.trim() !== '',
                        )

                        console.log({ hasMenuItem, hasOpenDay })

                        if (!hasMenuItem) {
                          setShowStep2Error(
                            'Please add at least one menu item with a name and price.',
                          )
                          return
                        }

                        if (!hasOpenDay) {
                          setShowStep2Error(
                            'Please ensure at least one time slot is filled out.',
                          )
                          return
                        }

                        // Passed validation
                        setShowStep2Error('')
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
  )
}
