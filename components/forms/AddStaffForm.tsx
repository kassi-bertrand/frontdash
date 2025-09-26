"use client"

import { useMemo, useState } from "react"

export type Staff = {
  id: string
  firstName: string
  lastName: string
  username: string
}

export default function AddStaffForm({
  onAdd,
  existingUsernames = [],
}: {
  onAdd: (s: Staff) => void
  existingUsernames?: string[]
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const username = useMemo(() => {
    if (!lastName) return ""
    const base = lastName.replace(/[^A-Za-z]/g, "").toLowerCase()
    let suffix = "01"
    for (let i = 1; i < 100; i++) {
      const s = String(i).padStart(2, "0")
      if (!existingUsernames.includes(`${base}${s}`)) {
        suffix = s
        break
      }
    }
    return base ? `${base}${suffix}` : ""
  }, [lastName, existingUsernames])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (firstName.trim().length < 2) return setError("First name must be at least 2 letters")
    if (lastName.trim().length < 2) return setError("Last name must be at least 2 letters")
    if (!username) return setError("Could not generate username. Check last name.")
    if (existingUsernames.includes(username)) return setError("Username already exists")
    setSaving(true)
    onAdd({
      id: crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username,
    })
    setFirstName("")
    setLastName("")
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-3 items-end">
      {error && <div className="md:col-span-3 text-sm text-red-600">{error}</div>}
      <div className="grid gap-2">
        <label className="text-sm">First Name</label>
        <input
          className="h-10 px-3 rounded-md border bg-background"
          placeholder="e.g., John"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Last Name</label>
        <input
          className="h-10 px-3 rounded-md border bg-background"
          placeholder="e.g., Smith"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Username (auto-generated)</div>
        <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center">
          {username || "lastname + 2 digits"}
        </div>
        <div className="text-xs text-muted-foreground">
          Initial password will be auto-generated and emailed. It will not be displayed.
        </div>
      </div>
      <button className="md:col-span-3 px-4 h-10 rounded-md bg-primary text-primary-foreground" disabled={saving}>
        {saving ? "Adding..." : "Add Staff"}
      </button>
    </form>
  )
}