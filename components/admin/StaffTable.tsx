"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Staff } from "@/components/forms/AddStaffForm"
import { toast } from "sonner"

export default function StaffTable({
  staff,
  onDelete,
}: {
  staff: Staff[]
  onDelete: (id: string) => void
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
              <td colSpan={3} className="p-4 text-muted-foreground">
                No staff yet.
              </td>
            </tr>
          ) : (
            staff.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">
                  {s.firstName} {s.lastName}
                </td>
                <td className="p-3">{s.username}</td>
                <td className="p-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(s.id)}>
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete staff account</DialogTitle>
                      </DialogHeader>
                      <p>Are you sure you want to delete this staff account?</p>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDeleteId(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (deleteId) {
                              onDelete(deleteId)
                              toast.success("Staff deleted")
                            }
                            setDeleteId(null)
                          }}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}