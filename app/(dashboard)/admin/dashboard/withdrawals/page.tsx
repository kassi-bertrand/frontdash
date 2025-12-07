"use client"

import { useState } from "react"

type Withdrawal = {
  id: string
  restaurantName: string
  reason: string
  requestedAt: string
}

export default function Page() {
  const [requests, setRequests] = useState<Withdrawal[]>([
    { id: "W-2001", restaurantName: "Burger Hub", reason: "Switching platforms", requestedAt: "2025-09-20" },
  ])

  const approve = (id: string) => {
    setRequests((prev) => prev.filter((w) => w.id !== id))
    alert(`Withdrawal ${id} approved (demo)`)
  }

  const deny = (id: string) => {
    setRequests((prev) => prev.filter((w) => w.id !== id))
    alert(`Withdrawal ${id} denied (demo)`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Withdrawal Requests</h1>
        <p className="text-sm text-muted-foreground">Manage restaurant withdrawal requests.</p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Restaurant</th>
              <th className="text-left p-3">Reason</th>
              <th className="text-left p-3">Requested</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-muted-foreground">No requests.</td>
              </tr>
            ) : (
              requests.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="p-3">{w.id}</td>
                  <td className="p-3">{w.restaurantName}</td>
                  <td className="p-3">{w.reason}</td>
                  <td className="p-3">{w.requestedAt}</td>
                  <td className="p-3 space-x-2">
                    <button className="px-3 py-1 rounded-md bg-primary text-primary-foreground" onClick={() => approve(w.id)}>
                      Approve
                    </button>
                    <button className="px-3 py-1 rounded-md bg-destructive text-destructive-foreground" onClick={() => deny(w.id)}>
                      Deny
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