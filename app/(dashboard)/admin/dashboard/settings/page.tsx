"use client"

import { useState } from "react"

export default function Page() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [maintenance, setMaintenance] = useState(false)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Configure portal preferences.</p>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Email Notifications</div>
            <div className="text-sm text-muted-foreground">Receive system alerts via email.</div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary relative">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Maintenance Mode</div>
            <div className="text-sm text-muted-foreground">Temporarily disable new signups.</div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary relative">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        <div className="pt-2">
          <button className="px-4 h-10 rounded-md bg-primary text-primary-foreground">Save Changes</button>
        </div>
      </div>
    </div>
  )
}