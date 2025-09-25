import { LoginForm } from '@/components/login-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Tabs defaultValue="restaurant" className="w-full max-w-md space-y-6">
        <TabsList className="mx-auto">
          <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
          <TabsTrigger value="staff">Admin & Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="restaurant" className="mt-4">
          <LoginForm variant="restaurant" />
        </TabsContent>
        <TabsContent value="staff" className="mt-4">
          <LoginForm variant="staff" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const metadata = {
  title: 'Login - FrontDash',
  description: 'Sign in to FrontDash portal as a restaurant, staff, or admin user',
}
