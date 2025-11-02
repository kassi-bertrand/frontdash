"use client"

import { Staff } from "@/components/forms/AddStaffForm"
import { useState } from "react"

export default function StaffTable({
  staff,
  onDelete,
}: {
  staff: Staff[]
  onDelete: (id: string) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Username</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-4 text-muted-foreground">No staff yet.</td>
            </tr>
          ) : (
            staff.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.firstName} {s.lastName}</td>
                <td className="p-3">{s.username}</td>
                <td className="p-3">
                  {confirmId === s.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Delete this account?</span>
                      <button
                        className="px-3 py-1 rounded-md bg-destructive text-destructive-foreground"
                        onClick={() => {
                          onDelete(s.id)
                          setConfirmId(null)
                        }}
                      >
                        Confirm
                      </button>
                      <button className="px-3 py-1 rounded-md border" onClick={() => setConfirmId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="px-3 py-1 rounded-md bg-destructive text-destructive-foreground" onClick={() => setConfirmId(s.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}