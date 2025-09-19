
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DataTable } from "./components/data-table"
import { SectionCards } from "./components/section-cards"
import restaurantData from "./restaurant-data.json"
import staffData from "./staff-data.json"
import driverData from "./driver-data.json"

export default async function Page() {
  // TODO: Replace with actual API calls to backend
  // const restaurantData = await fetch('/api/admin/restaurants?limit=5&sort=created_desc').then(res => res.json())
  // const staffData = await fetch('/api/admin/staff?limit=5&sort=created_desc').then(res => res.json())
  // const driverData = await fetch('/api/admin/drivers?limit=5&sort=created_desc').then(res => res.json())

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable
          restaurantData={restaurantData}
          staffData={staffData}
          driverData={driverData}
        />
      </div>
    </div>
  )
}