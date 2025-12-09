# FrontDash - Food Delivery Web Application

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [User Interface Flow Diagrams](#-user-interface-flow-diagrams)
   - [Customer Interface Flow](#customer-interface-flow)
   - [Restaurant Interface Flow](#restaurant-interface-flow)
   - [Admin & Staff Interface Flow](#admin--staff-interface-flow)
4. [Project Structure](#-project-structure)
   - [Understanding the Next.js Structure](#understanding-the-nextjs-structure)
5. [Core Requirements Implementation Checklist](#-core-requirements-implementation-checklist)
6. [Bonus Features](#-bonus-features-25-total)
7. [Testing Requirements](#-testing-requirements)
8. [Getting Started](#-getting-started)
9. [Development Guidelines](#-development-guidelines)
10. [Endpoints](#endpoints)
11. [Admin Login (Local)](#admin-login-local)
12. [Authentication Model Note](#authentication-model-note)
13. [Team Members](#-team-members)
14. [License](#-license)
15. [Support](#-support)

## Project Overview

FrontDash is a comprehensive food delivery platform connecting restaurants with customers through an efficient delivery service. The system facilitates restaurant menu management, customer ordering, and administrative oversight of all operations.

Design clarifications reflected in the app and docs:
- Address modeled as a first-class value object:
  - Restaurant has a business Address
  - Order stores a delivery Address snapshot
- Endpoints summarized below for quick reference
- Authentication model clarified:
  - AccountLogin is the centralized credential store
  - Restaurant and StaffMember do NOT have structural (DB-enforced) foreign keys to AccountLogin in the domain model; authentication is handled by AuthService/AuthController

### Key Stakeholders
- **Restaurants**: Register and manage their menus, hours, and orders
- **Customers**: Browse restaurants and order food for delivery
- **FrontDash Staff**: Process orders and coordinate deliveries
- **FrontDash Admin**: Manage platform operations and approvals
- **Drivers**: Deliver orders from restaurants to customers

### 📋 Official Clarifications Document
The professor provided clarifications on 09-08-2025 that supersede certain requirements in the original PDF:
- **Staff Account Creation**: Admin only enters first/last name; system auto-generates username and password
- **Order Completion**: Staff records delivery TIME (not amount) to track performance
- **Full clarification document**: Available at `/docs/Project Clarification-09-08-2025.pdf`

### ⚠️ Important Clarifications (Professor's Updates)
Based on recent clarifications, the following adjustments have been made to the original requirements:

1. **Staff Account Creation**: Admin only enters first and last name. System auto-generates username (lastname + 2 digits) and password.
2. **Order Completion**: Staff records delivery time (not payment amount) when driver completes delivery to track estimated vs actual delivery times.
3. **Time Tracking**: System must record order placement time and compare with actual delivery time for future optimization.

## 🚀 Tech Stack

### Frontend & Backend (Monolithic Next.js Application)
- **Next.js 14+** with App Router and TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Hook Form** + Zod for form handling and validation
- **TanStack Query** for server state management

### Backend (API Routes within Next.js)
- **Next.js API Routes** for backend endpoints
- **Prisma ORM** for database management
- **PostgreSQL** database
- **Better-Auth** for authentication and authorization
- **Zod** for API validation
- **bcrypt** for additional password hashing

### Additional Services
- **Email Service**: Resend (for sending credentials)
- **Payment Processing**: Stripe (Test Mode)
- **Maps API**: Google Maps API (for delivery time calculations)
- **File Storage**: Uploadthing (for restaurant/menu images)
- **Queue Management**: BullMQ with Redis for production, in-memory for development

## User Interface Flow Diagrams

These diagrams show the complete screen flow for each user type in the FrontDash system. Each box represents a screen that needs to be implemented.

### Customer Interface Flow

```mermaid
graph TD
    Start([Customer Visits Site]) --> Home[Homepage<br/>- List of Restaurants<br/>- Restaurant Cards with Name/Logo<br/>- Open/Closed Status]
    
    Home --> SelectRest[Select Restaurant]
    SelectRest --> Menu[Restaurant Menu Page<br/>- All Menu Items<br/>- Item Images<br/>- Item Prices<br/>- Availability Status<br/>- Quantity Selectors]
    
    Menu --> Cart[Add Items to Cart<br/>- Select Quantities<br/>- Multiple Items]
    Cart --> Confirm[Order Confirmation Page<br/>- Restaurant Name<br/>- Current Date/Time<br/>- Item Details<br/>- Quantities & Subtotals]
    
    Confirm --> Billing[Billing Page<br/>- Items Summary<br/>- Total Before Service<br/>- Service Charge 8.25%<br/>- Tips Input<br/>- Grand Total]
    
    Billing --> Payment[Payment Form<br/>- Card Type Selection<br/>- 16-Digit Card Number<br/>- Cardholder Name<br/>- Billing Address<br/>- Expiry Date<br/>- 3-Digit CVV]
    
    Payment --> Verify{Third-Party<br/>Verification}
    Verify -->|Success| Delivery[Delivery Address Form<br/>- Building Number<br/>- Street Name<br/>- Apt/Unit Optional<br/>- City & State<br/>- Contact Name<br/>- Contact Phone]
    
    Verify -->|Failed| PaymentError[Payment Error<br/>- Retry Payment]
    PaymentError --> Payment
    
    Delivery --> Complete[Order Complete<br/>- Order Number<br/>- Estimated Delivery Time]
    
    %% Bonus Feature - Loyalty Program
    Home -.->|If Registered| LoyaltyLogin[Enter Customer Number<br/>- View Points Balance]
    LoyaltyLogin -.-> Menu
    Billing -.->|100+ Points| ApplyDiscount[10% Discount Applied<br/>- 100 Points Deducted]
    ApplyDiscount -.-> Payment
    
    style Start fill:#e1f5fe
    style Complete fill:#c8e6c9
    style PaymentError fill:#ffcdd2
```

### Restaurant Interface Flow

```mermaid
graph TD
    Start([Restaurant Access]) --> RegOrLogin{New or Existing?}
    
    %% Registration Flow
    RegOrLogin -->|New| Reg[Registration Form<br/>- Restaurant Name<br/>- Picture Upload Optional<br/>- Street Address<br/>- Phone Numbers<br/>- Contact Person<br/>- Email Address<br/>- Hours per Day<br/>- Initial Menu Items]
    
    Reg --> MenuSetup[Menu Item Setup<br/>For Each Item:<br/>- Item Name<br/>- Item Picture<br/>- Item Price<br/>- Availability Status]
    
    MenuSetup --> SubmitReg[Submit Registration<br/>- Goes to Admin Queue]
    SubmitReg --> WaitApproval[Wait for Approval<br/>- Email with Credentials]
    
    %% Login Flow
    RegOrLogin -->|Existing| Login[Login Page<br/>- Username<br/>- Password]
    WaitApproval --> Login
    
    Login --> Dashboard[Restaurant Dashboard<br/>- Restaurant Info<br/>- Current Menu<br/>- Operating Hours<br/>- Contact Details]
    
    %% Dashboard Actions
    Dashboard --> ChangePass[Change Password<br/>- Current Password<br/>- New Password<br/>- Confirm Password<br/>Min 6 chars, 1 upper,<br/>1 lower, 1 number]
    ChangePass --> Dashboard
    
    Dashboard --> EditMenu[Edit Menu<br/>- Add New Items<br/>- Edit Existing Items<br/>- Delete Items<br/>- Toggle Availability]
    EditMenu --> MenuItemForm[Menu Item Form<br/>- Name<br/>- Picture<br/>- Price<br/>- Availability]
    MenuItemForm --> EditMenu
    EditMenu --> Dashboard
    
    Dashboard --> EditHours[Edit Operating Hours<br/>- Set Hours per Day<br/>- Special Hours<br/>- Holiday Schedule]
    EditHours --> Dashboard
    
    Dashboard --> EditContact[Edit Contact Info<br/>- Phone Numbers<br/>- Email<br/>- Contact Person<br/>- Street Address]
    EditContact --> Dashboard
    
    Dashboard --> Withdraw[Withdraw from FrontDash<br/>- Reason for Withdrawal<br/>- Submit to Queue]
    Withdraw --> WaitWithdrawal[Wait for Admin<br/>Confirmation]
    
    Dashboard --> Logout[Logout]
    Logout --> Login
    
    style Start fill:#e1f5fe
    style Dashboard fill:#c8e6c9
    style WaitApproval fill:#fff9c4
    style WaitWithdrawal fill:#ffcdd2
```

### Admin & Staff Interface Flow

```mermaid
graph TD
    Start([FrontDash Portal]) --> LoginChoice{User Type}
    
    %% Admin Flow
    LoginChoice -->|Admin| AdminLogin[Admin Login<br/>- Username hardcoded<br/>- Password]
    AdminLogin --> AdminDash[Admin Dashboard<br/>- View All Queues<br/>- Manage Staff<br/>- Manage Drivers]
    
    %% Admin - Restaurant Management
    AdminDash --> RegQueue[Registration Queue<br/>- List of Pending<br/>Restaurant Registrations]
    RegQueue --> ReviewReg[Review Registration<br/>- View Restaurant Details<br/>- Approve/Disapprove]
    ReviewReg -->|Approve| CreateAccount[Create Restaurant Account<br/>- Generate Credentials<br/>- Send Email]
    ReviewReg -->|Disapprove| RejectReg[Reject Registration<br/>- Send Notification]
    CreateAccount --> RegQueue
    RejectReg --> RegQueue
    
    AdminDash --> WithQueue[Withdrawal Queue<br/>- List of Withdrawal Requests]
    WithQueue --> ReviewWith[Review Withdrawal<br/>- Check Payment Status<br/>- Approve/Deny]
    ReviewWith --> WithQueue
    
    %% Admin - Staff Management
    AdminDash --> StaffList[Staff Management<br/>- View All Staff]
    StaffList --> AddStaff[Add Staff Form<br/>- Full Name unique<br/>- Username: lastname+2digits<br/>- Auto-generate Password]
    AddStaff --> StaffList
    StaffList --> DeleteStaff[Delete Staff<br/>- Confirmation Dialog]
    DeleteStaff --> StaffList
    
    %% Admin - Driver Management
    AdminDash --> DriverList[Driver Management<br/>- View All Drivers]
    DriverList --> HireDriver[Hire Driver Form<br/>- Driver Name only]
    HireDriver --> DriverList
    DriverList --> FireDriver[Fire Driver<br/>- Confirmation Dialog]
    FireDriver --> DriverList
    
    AdminDash --> AdminLogout[Logout]
    
    %% Staff Flow
    LoginChoice -->|Staff| StaffLogin[Staff Login<br/>- Username<br/>- Password]
    StaffLogin --> FirstTime{First Login?}
    FirstTime -->|Yes| ForceChange[Force Password Change<br/>- New Password Required]
    ForceChange --> StaffDash
    FirstTime -->|No| StaffDash[Staff Dashboard<br/>- Order Queue<br/>- Active Orders]
    
    %% Staff - Order Management
    StaffDash --> OrderQueue[Order Queue<br/>- View Pending Orders<br/>- FIFO Processing]
    OrderQueue --> ProcessOrder[Process Order<br/>- Retrieve First Order<br/>- Save to Database<br/>- Remove from Queue]
    ProcessOrder --> CalcDelivery[Calculate Delivery Time<br/>- Auto-calculate from addresses<br/>- Manual override option]
    CalcDelivery --> AssignDriver[Assign Driver<br/>- Select Available Driver<br/>- Dispatch Order]
    AssignDriver --> TrackOrder[Track Order<br/>- Update Status<br/>- Wait for Completion]
    TrackOrder --> RecordComplete[Record Completion<br/>- Order Status<br/>- Delivery Time Recorded]
    RecordComplete --> StaffDash
    
    style Start fill:#e1f5fe
    style AdminDash fill:#c8e6c9
    style StaffDash fill:#c8e6c9
    style ForceChange fill:#fff9c4
```

## 📁 Project Structure

> **Note for Team**: This is our **target structure** as the project grows. We'll start simple with just the UI components for our current assignment, then gradually add the backend features (API routes, database, authentication) in future phases. Items marked with 🔮 are future implementations.

```
frontdash/
├── app/                              # Next.js App Router
│   ├── (public)/                    # Public routes (no auth)
│   ├── (auth)/                      # Auth pages layout group
│   ├── (dashboard)/                 # Protected dashboard routes
│   ├── api/                         # 🔮 API Routes (Backend - Future)
│   ├── layout.tsx                   # Root layout
│   ├── globals.css                  # Global styles
│   └── providers.tsx                # Client providers wrapper
├── components/                      # Reusable components
├── lib/                             # Library code (future: auth/db/email/payment/queue)
├── prisma/                          # Future: Database
├── public/                          # Static files
├── hooks/                           # Custom React hooks
├── types/                           # TypeScript types
├── middleware.ts                    # Future: Next.js middleware
├── next.config.ts                   # Next.js configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
└── README.md
```

### Understanding the Next.js Structure
(unchanged — see above for App Router notes)

## 🎯 Core Requirements Implementation Checklist
(unchanged — see existing checklist)

## 🌟 Bonus Features (25% Total)
(unchanged — see existing bonus section)

## 🧪 Testing Requirements
(unchanged — see existing testing section)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL (for future backend)
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/kassi-bertrand/frontdash.git
cd frontdash
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables (for future backend)
```bash
# macOS/Linux
cp .env.example .env.local
# Windows PowerShell
Copy-Item .env.example .env.local
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Endpoints

- Auth
  - POST /api/auth/login — login
  - POST /api/auth/change-password — changePassword
  - POST /api/auth/logout — logout
- Restaurants
  - GET /api/restaurants — list
  - GET /api/restaurants/:id — get
  - POST /api/restaurants/register — register
  - PUT /api/restaurants/:id/approve — approve
- Menu
  - GET /api/restaurants/:id/menu — getMenu
  - POST /api/restaurants/:id/menu — addItem
- Orders
  - POST /api/orders — createOrder
  - GET /api/orders/:orderNumber — getOrder
  - PUT /api/orders/:orderNumber/status — updateStatus
- Loyalty
  - POST /api/loyalty-members/register — registerMember
  - GET /api/loyalty-members/:loyaltyNumber — getMember
- Health
  - GET /health — health

Note: Additional planned API routes are listed in the “Route Structure” section above.

## Admin Login (Local)
- Admin login page: http://localhost:3000/admin/login
- Unified login (admin/staff): http://localhost:3000/login (if enabled)

If authentication isn't wired yet, the login page still renders; backend setup is required for real auth.

## Authentication Model Note
- AccountLogin is the canonical credential store (username, passwordHash, role, accountState)
- Restaurant and StaffMember do NOT have structural FK links to AccountLogin in the domain model
- AuthService/AuthController handle authentication and lookups
- Restaurant/Staff may store username as a string reference, but it is not enforced as a cascade FK

## 👥 Team Members

- Marione Ogboi
- Daniel Oni
- Kassi Nzalasse

## 📄 License

This project is developed for CS 5336/7336 - Web Application Development course.

## 📞 Support

For questions or issues, please contact the team or open an issue in the repository.