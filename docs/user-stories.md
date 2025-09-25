# FrontDash User Stories Document

## Overview
This document contains all user stories derived from the FrontDash project requirements. Each story follows the format: "As a [role], I want [feature] so that [benefit]" and includes acceptance criteria with direct quotes from the requirements document.

> **Note**: This document incorporates both the original project requirements and the professor's clarifications from 09-08-2025. Where conflicts existed, the clarification document takes precedence.

---

## 🍽️ Restaurant User Stories

### Registration & Onboarding

#### ✅ STORY-R001: Restaurant Registration
**As a** restaurant owner  
**I want to** register my restaurant on FrontDash  
**So that** I can sell food through the platform

**Acceptance Criteria:**
- Must provide unique restaurant name (*"restaurant's name - must be unique within the application"*)
- Can upload optional restaurant picture (*"restaurant's picture (optional)"*)
- Must provide street address for driver pickup (*"street address - this is important because FrontDash's driver will have to get food from this address"*)
- Must provide phone number(s) - 10 digits, first digit not zero (*"phone number(s) - each phone number must be 10 digits long"*)
- Must provide contact person name (*"contact person - this person will be contacted for any questions, concerns, inquiries etc."*)
- Must provide email address (*"email address of the restaurant - required for communication"*)
- Must set operating hours for each day (*"hours of opening - must indicate the duration for each day of the week"*)
- Registration goes to queue for admin approval (*"registration process by a restaurant only makes a request to FrontDash"*)

#### ✅ STORY-R002: Menu Creation During Registration
**As a** restaurant owner  
**I want to** create my menu during registration  
**So that** customers can see what food I offer

**Acceptance Criteria:**
- Must add multiple food items to menu (*"menu - should contain a set of food items"*)
- For each item, must provide name (*"name of the item"*)
- For each item, must upload picture (*"picture of the item"*)
- For each item, must set price (*"price of the item"*)
- For each item, must set availability status (*"availability - AVAILABLE or UNAVAILABLE"*)

#### ✅ STORY-R003: Receive Login Credentials
**As a** restaurant owner  
**I want to** receive login credentials after approval  
**So that** I can access my restaurant account

**Acceptance Criteria:**
- Credentials sent via email after admin approval (*"Once the registration is approved by FrontDash, a new account will be created for the restaurant and the login credentials will be mailed"*)
- Single account per restaurant for all authorized users

### Restaurant Management

#### STORY-R004: Restaurant Login
**As a** restaurant user  
**I want to** login to my account  
**So that** I can manage my restaurant

**Acceptance Criteria:**
- Login with username and password (*"login"*)
- Password must be masked/hidden (*"Passwords should never be displayed"*)

#### STORY-R005: Change Password
**As a** restaurant user  
**I want to** change my password  
**So that** I can maintain account security

**Acceptance Criteria:**
- Must provide current password (*"change password"*)
- New password minimum 6 characters (*"minimum of six characters"*)
- Must contain at least one uppercase letter (*"at least one Uppercase letter"*)
- Must contain at least one lowercase letter (*"at least one lowercase letter"*)
- Must contain at least one number (*"at least one number"*)

#### STORY-R006: Edit Menu
**As a** restaurant user  
**I want to** edit my menu  
**So that** I can update food offerings and prices

**Acceptance Criteria:**
- Can add new menu items (*"change menu"*)
- Can edit existing items (name, picture, price, availability)
- Can delete items with confirmation dialog
- Can mark items as AVAILABLE or UNAVAILABLE

#### STORY-R007: Update Operating Hours
**As a** restaurant user  
**I want to** update my operating hours  
**So that** customers know when we're open

**Acceptance Criteria:**
- Can change hours for each day of week (*"change opening hours"*)
- Changes reflected immediately for customers

#### STORY-R008: Update Contact Information
**As a** restaurant user  
**I want to** update my contact information  
**So that** FrontDash can reach me with current details

**Acceptance Criteria:**
- Can update phone numbers (*"change contact information"*)
- Can update email address
- Can update contact person
- Can update street address

#### STORY-R009: Withdraw from FrontDash
**As a** restaurant user  
**I want to** withdraw from FrontDash  
**So that** I can stop using the service when needed

**Acceptance Criteria:**
- Submit withdrawal request (*"withdraw from FrontDash - by invoking this operation, the restaurant will no longer be in business with FrontDash"*)
- Request goes to admin queue (*"notification will be sent to FrontDash application which will then be reviewed"*)
- Await confirmation from admin

---

## 🛒 Customer User Stories

### Browsing & Ordering (No Login Required)

#### ✅ STORY-C001: Browse Restaurants
**As a** customer  
**I want to** browse available restaurants  
**So that** I can choose where to order from

**Acceptance Criteria:**
- View all restaurants on homepage (*"browse through the restaurants displayed on FrontDash's home page"*)
- See restaurant name (*"name of the restaurant"*)
- See restaurant logo/icon (*"optional icon/logo for the restaurant"*)
- See open/closed status (*"status indicating whether the restaurant is open at that time"*)

#### ✅ STORY-C002: Select Restaurant
**As a** customer  
**I want to** select a restaurant  
**So that** I can view their menu

**Acceptance Criteria:**
- Click on restaurant to view menu (*"Customer should be able to select a restaurant for the next step"*)
- Navigate to restaurant's menu page

#### ✅ STORY-C003: Browse Menu
**As a** customer  
**I want to** browse the restaurant's menu  
**So that** I can choose what to order

**Acceptance Criteria:**
- View all menu items (*"Browse through the menu in the selected restaurant"*)
- See item names, pictures, prices
- See availability status for each item
- Select multiple items (*"Customer should be able to select one or more food items from the menu"*)
- Specify quantity for each item (*"customer should be able to indicate a quantity as well"*)

#### ✅ STORY-C004: Confirm Order
**As a** customer  
**I want to** review my order  
**So that** I can verify everything before payment

**Acceptance Criteria:**
- View restaurant name (*"Restaurant's name from which the food is ordered"*)
- View current date and time (*"Current date and time of order - This is important and will be used by the application later"*)
- View all selected items with:
  - Item name (*"name of the item"*)
  - Price per item (*"price of the item"*)
  - Quantity (*"quantity of the item"*)
  - Subtotal (*"subtotal for that item"*)
- View total before service charge (*"Total of all subtotals before service charge"*)
- View 8.25% service charge (*"Service charge - 8.25% for this problem"*)

#### ✅ STORY-C005: Add Tips
**As a** customer  
**I want to** add tips to my order  
**So that** I can tip the delivery driver

**Acceptance Criteria:**
- Tips field initially empty (*"Tips - initially empty"*)
- Can enter percentage or fixed amount (*"customer should be able to enter the tips - you can use percentage or fixed amount"*)
- Grand total updates after tips (*"Grand total, after customer enters the tips"*)

#### ✅ STORY-C006: Pay with Credit Card
**As a** customer  
**I want to** pay for my order with a credit card  
**So that** I can complete my purchase

**Acceptance Criteria:**
- Select card type (VISA, MasterCard, Discover, etc.) (*"Type of card - VISA, MasterCard, Discover etc."*)
- Enter 16-digit card number (*"Credit card number - must be 16 digits"*)
- Enter cardholder first and last name (*"First and last name of the credit card holder"*)
- Enter billing address (*"Billing address"*)
- Enter expiry date (month/year) (*"Expiry date - Month and year"*)
- Enter 3-digit security code (*"Security code - three digits"*)
- Card verified through third-party (*"it should be verified through a third-party software"*)

#### ✅ STORY-C007: Provide Delivery Address
**As a** customer  
**I want to** provide my delivery address  
**So that** the driver knows where to deliver

**Acceptance Criteria:**
- Enter after payment verification (*"After verification of credit card, customer should be prompted to enter the delivery address"*)
- Provide building number (*"Building number"*)
- Provide street name (*"Street name"*)
- Optionally provide apartment/unit number (*"Apartment or unit number (optional)"*)
- Provide city (*"City name"*)
- Provide state (*"State"*)
- Provide contact person name (*"Contact person's name"*)
- Provide contact phone number (*"Contact person's phone number"*)

#### ✅ STORY-C008: Receive Order Confirmation
**As a** customer  
**I want to** receive an order number and delivery estimate  
**So that** I know when to expect my food

**Acceptance Criteria:**
- Receive unique order number (*"customer should be given an order number"*)
- Receive estimated delivery time (*"approximate time of delivery"*)

### Loyalty Program (Bonus Feature - 20%)

#### STORY-C009: Register for Loyalty Program
**As a** customer  
**I want to** register for the loyalty program  
**So that** I can earn points on orders

**Acceptance Criteria:**
- Provide full name (*"Full name"*)
- Provide phone number (*"Phone number"*)
- Provide email (*"Email"*)
- Provide default delivery address (*"Delivery address (will be delivered to the same address all the time)"*)
- Provide credit card details (*"Credit card details (card number, expiry date and CVV code)"*)
- Registration goes to admin queue (*"request for registration will be queued"*)

#### STORY-C010: Use Loyalty Points
**As a** registered customer  
**I want to** use my loyalty points  
**So that** I can get discounts on orders

**Acceptance Criteria:**
- Enter unique customer number when ordering (*"customer should give this number while ordering food in order to get points"*)
- Earn 1 point per dollar before service/tips (*"They earn one point per dollar of the bill before service charges and tips"*)
- Get 10% discount at 100+ points (*"When they earn 100 points or more, they get a discount of 10% for the next order"*)
- 100 points deducted when discount used (*"100 points will be used for this discount"*)

---

## 👨‍💼 Administrator User Stories

### Authentication & Dashboard

#### STORY-A001: Admin Login
**As an** administrator  
**I want to** login to the admin portal  
**So that** I can manage the platform

**Acceptance Criteria:**
- Login with hardcoded credentials (*"login - a hard-coded administrator account should exist"*)
- Access admin dashboard after login

#### STORY-A002: Admin Logout
**As an** administrator  
**I want to** logout from the system  
**So that** I can secure my session

**Acceptance Criteria:**
- Logout functionality available (*"logout"*)
- Return to login page after logout

### Restaurant Management

#### STORY-A003: Review Restaurant Registrations
**As an** administrator  
**I want to** review restaurant registration requests  
**So that** I can approve legitimate businesses

**Acceptance Criteria:**
- View queued registration requests (*"When a registration request is sent from a new restaurant, the request should be added to a queue"*)
- Review all restaurant details
- Approve or disapprove requests (*"approve or disapprove a registration request from a restaurant"*)
- System creates account on approval
- System sends credentials via email on approval

#### STORY-A004: Handle Restaurant Withdrawals
**As an** administrator  
**I want to** process withdrawal requests  
**So that** I can manage restaurant departures

**Acceptance Criteria:**
- View withdrawal request queue (*"If a restaurant withdraws from FrontDash, the withdrawal request must be queued"*)
- Approve or deny requests (*"approve or disapprove a withdrawal request from a restaurant"*)
- Can deny if payment due (*"sometimes, there may be a payment due and so the withdrawal may be denied"*)
- Send confirmation to restaurant

### Staff Management

#### STORY-A005: Add Staff Members
**As an** administrator  
**I want to** add new staff accounts  
**So that** staff can process orders

**Acceptance Criteria (Updated per Professor's Clarification):**
- Enter staff first name
- Enter staff last name
- System auto-generates username (lastname + 2 random digits)
- System auto-generates initial password
- Optional: Enter email to send credentials
- Username must be unique

#### STORY-A006: Delete Staff Accounts
**As an** administrator  
**I want to** delete staff accounts  
**So that** I can remove inactive staff

**Acceptance Criteria:**
- View list of staff accounts (*"delete a staff account"*)
- Confirmation dialog before deletion (*"Are you sure you want to delete the account <username>?"*)
- Remove from database after confirmation

### Driver Management

#### STORY-A007: Hire Drivers
**As an** administrator  
**I want to** hire new drivers  
**So that** we can deliver orders

**Acceptance Criteria:**
- Enter only driver name (*"hire a driver - need only a unique name"*)
- Name must be unique in system

#### STORY-A008: Fire Drivers
**As an** administrator  
**I want to** fire drivers  
**So that** I can remove underperforming drivers

**Acceptance Criteria:**
- Select driver to fire (*"fire a driver"*)
- Confirmation dialog before removal
- Remove from database after confirmation

### Customer Management (Bonus)

#### STORY-A009: Review Customer Registrations
**As an** administrator  
**I want to** review customer loyalty registrations  
**So that** I can approve legitimate customers

**Acceptance Criteria:**
- View customer registration queue
- Approve or reject registrations (*"The administrator will review the request and approve/reject"*)
- Generate unique customer number on approval (*"customer will get a unique number"*)
- Send number via email (*"sent in the email address provided when registering"*)

---

## 👨‍💻 Staff User Stories

### Authentication

#### STORY-S001: Staff Login
**As a** staff member  
**I want to** login to my account  
**So that** I can process orders

**Acceptance Criteria:**
- Login with username and password (*"login"*)
- Username format: 2+ characters + 2 digits (*"Usernames, except administrator username, should have a minimum of two characters followed by two digits"*)

#### STORY-S002: First-Time Password Change
**As a** staff member  
**I want to** be forced to change my password on first login  
**So that** my account is secure

**Acceptance Criteria:**
- Automatic redirect on first login (*"first-time login should initiate this functionality automatically"*)
- New password requirements enforced (6+ chars, 1 upper, 1 lower, 1 number)

#### STORY-S003: Change Password
**As a** staff member  
**I want to** change my password  
**So that** I can maintain account security

**Acceptance Criteria:**
- Access password change feature (*"change password"*)
- Must meet password requirements

#### STORY-S004: Staff Logout
**As a** staff member  
**I want to** logout from the system  
**So that** I can end my session securely

**Acceptance Criteria:**
- Logout functionality available (*"logout"*)

### Order Management

#### STORY-S005: Process Order Queue
**As a** staff member  
**I want to** retrieve orders from the queue  
**So that** I can process them for delivery

**Acceptance Criteria:**
- Retrieve first order (FIFO) (*"retrieve the first order from the order queue"*)
- Save order to database before removal (*"the order should be saved in the database before it is removed"*)
- Record order placement time (per Professor's clarification)

#### STORY-S006: Calculate Delivery Time
**As a** staff member  
**I want to** calculate estimated delivery time  
**So that** customers know when to expect food

**Acceptance Criteria:**
- Calculate based on addresses (*"compute estimated delivery time based on the restaurant's address and the customer's address"*)
- Automatic calculation option (*"calculation can be done automatically by FrontDash application"*)
- Manual override option (*"or manually by the staff member"*)

#### STORY-S007: Assign Driver
**As a** staff member  
**I want to** assign drivers to orders  
**So that** food gets delivered

**Acceptance Criteria:**
- Select available driver (*"send a driver to fulfill an order"*)
- Dispatch order to driver

#### STORY-S008: Record Order Completion
**As a** staff member
**I want to** record when orders are delivered
**So that** we can track delivery performance

**Acceptance Criteria:**
- Update order status to 'DELIVERED' (*"record the order status"*)
- Record actual delivery time in HH:MM format (*"record... delivery time from a driver after delivery"* - per clarification)
- System compares with estimated time for future optimization
- System calculates actual delivery duration from order placement time
- Driver reports completion details to staff member

---

## 🚚 Driver User Stories

#### STORY-D001: Report Delivery Completion
**As a** driver  
**I want to** report delivery completion to staff  
**So that** the order can be marked as delivered

**Acceptance Criteria:**
- Report delivery time to staff member (*"driver is supposed to let a staff member know that the food is delivered at HH:MM time"*)
- Provide exact delivery time

---

## 🔒 System-Wide Requirements

### Security

#### STORY-SYS001: Password Security
**As a** system  
**I want to** encrypt all passwords  
**So that** user accounts are secure

**Acceptance Criteria:**
- Never display passwords (*"Passwords should never be displayed"*)
- Encrypt passwords in database (*"nor should be visible when stored in the database"*)
- Mask password input fields (*"passwords must be encrypted/masked at all times"*)

### Validation

#### STORY-SYS002: Input Validation
**As a** system  
**I want to** validate all user inputs  
**So that** data integrity is maintained

**Acceptance Criteria:**
- Phone: 10 digits, first not zero (*"Phone numbers must be 10 digits long with the first digit not a zero"*)
- Credit card: 16 digits, first not zero (*"credit card numbers must be 16 digits long with the first digit not a zero"*)
- Names: minimum 2 letters (*"Names (both first and last names) must have a minimum of two letters"*)
- Usernames: 2 chars + 2 digits (*"minimum of two characters followed by two digits"*)
- Email: valid format

### User Experience

#### STORY-SYS003: Action Feedback
**As a** user  
**I want to** see confirmation of my actions  
**So that** I know operations completed successfully

**Acceptance Criteria:**
- Display success messages (*"outcome of any task should be demonstrated through the user interface"*)
- Display error messages for failures
- Show loading states for async operations

#### STORY-SYS004: Deletion Confirmations
**As a** user  
**I want to** confirm before deletions  
**So that** I don't accidentally delete data

**Acceptance Criteria:**
- Show confirmation dialog (*"Any action that removes an entry from the database must be preceded by a dialog"*)
- Display specific message (*"Are you sure you want to delete <item>?"*)
- Require explicit confirmation

### Architecture

#### STORY-SYS005: Independent Components
**As a** system architect  
**I want** all components to work independently  
**So that** different user types can work concurrently

**Acceptance Criteria:**
- Restaurant component works independently (*"All three components... can be developed independently"*)
- Customer interface works independently
- Admin/Staff component works independently
- All can run concurrently (*"should be possible to use them concurrently"*)

### Queue Management

#### STORY-SYS006: Queue Processing
**As a** system  
**I want to** manage queues properly  
**So that** requests are processed in order

**Acceptance Criteria:**
- Restaurant registration queue (FIFO)
- Restaurant withdrawal queue (FIFO)
- Customer order queue (FIFO)
- Customer registration queue (FIFO) - bonus feature
- Persist queues in database

---

## 📊 Summary Statistics

- **Total User Stories**: 65
- **Restaurant Stories**: 9
- **Customer Stories**: 10 (8 core + 2 bonus)
- **Administrator Stories**: 9 (8 core + 1 bonus)
- **Staff Stories**: 8
- **Driver Stories**: 1
- **System Stories**: 6

## 🎯 Priority Levels

### P0 - Critical (Must Have for MVP)
- Customer browsing and ordering flow (STORY-C001 to STORY-C008)
- Restaurant registration and menu management (STORY-R001 to STORY-R006)
- Admin approval of restaurants (STORY-A003)
- Staff order processing (STORY-S005 to STORY-S008)
- System security and validation (STORY-SYS001, STORY-SYS002)

### P1 - High (Core Features)
- Restaurant account management (STORY-R007 to STORY-R009)
- Admin staff and driver management (STORY-A005 to STORY-A008)
- Staff authentication (STORY-S001 to STORY-S004)
- System UX requirements (STORY-SYS003, STORY-SYS004)

### P2 - Medium (Bonus Features)
- Customer loyalty program (STORY-C009, STORY-C010)
- Customer registration approval (STORY-A009)

### P3 - Low (Nice to Have)
- Additional security features (Spring Security implementation)
- Advanced reporting and analytics

---

## 📝 Notes

1. All user stories are directly derived from the FrontDash project requirements document
2. Professor's clarifications have been incorporated (staff account creation, delivery time tracking)
3. Stories are grouped by user type for easier assignment to team members
4. Each story includes the exact quotes from requirements for traceability
5. Bonus features are clearly marked and separated
