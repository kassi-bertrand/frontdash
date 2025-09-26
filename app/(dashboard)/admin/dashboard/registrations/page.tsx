"use client"

import { useState } from "react"

type Registration = {
  id: string
  restaurantName: string
  contact: string
  email: string
}

export default function Page() {
  const [pending, setPending] = useState<Registration[]>([
    { id: "R-1001", restaurantName: "Sushi World", contact: "Ken W.", email: "ken@sushiworld.com" },
    { id: "R-1002", restaurantName: "Pasta Place", contact: "Maria P.", email: "maria@pastaplace.io" },
  ])

  const approve = (id: string) => {
    setPending((prev) => prev.filter((r) => r.id !== id))
    alert(`Approved ${id} (demo)`)
  }

  const reject = (id: string) => {
    setPending((prev) => prev.filter((r) => r.id !== id))
    alert(`Rejected ${id} (demo)`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Registration Queue</h1>
        <p className="text-sm text-muted-foreground">Restaurants awaiting approval.</p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Restaurant</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-muted-foreground">No pending registrations.</td>
              </tr>
            ) : (
              pending.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.restaurantName}</td>
                  <td className="p-3">{r.contact}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3 space-x-2">
                    <button className="px-3 py-1 rounded-md bg-primary text-primary-foreground" onClick={() => approve(r.id)}>
                      Approve
                    </button>
                    <button className="px-3 py-1 rounded-md bg-destructive text-destructive-foreground" onClick={() => reject(r.id)}>
                      Reject
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