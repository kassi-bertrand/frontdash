"use client"

import { useState } from "react"

type Driver = { id: string; name: string }

export default function Page() {
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: "D-1", name: "Driver A" },
    { id: "D-2", name: "Driver B" },
  ])
  const [name, setName] = useState("")

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setDrivers((prev) => [...prev, { id: crypto.randomUUID(), name: name.trim() }])
    setName("")
  }

  const fire = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Drivers</h1>
        <p className="text-sm text-muted-foreground">Hire or remove drivers.</p>
      </div>

      <form onSubmit={add} className="rounded-lg border p-4 space-y-3 max-w-md">
        <h2 className="text-lg font-medium">Hire Driver</h2>
        <input
          className="h-10 w-full px-3 rounded-md border bg-background"
          placeholder="Driver full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="px-4 h-10 rounded-md bg-primary text-primary-foreground" type="submit">
          Hire
        </button>
      </form>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-muted-foreground">No drivers.</td>
              </tr>
            ) : (
              drivers.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.id}</td>
                  <td className="p-3">{d.name}</td>
                  <td className="p-3">
                    <button
                      className="px-3 py-1 rounded-md bg-destructive text-destructive-foreground"
                      onClick={() => fire(d.id)}
                    >
                      Fire
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}