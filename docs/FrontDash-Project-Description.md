# FrontDash Project Description

## Overview
FrontDash is a company that delivers food to customers' doorsteps. A customer using FrontDash's service orders favorite dishes from one or more restaurants listed on the company's website. A FrontDash employee picks up the food from the selected restaurant and delivers it to the customer. The goal of this project is to build a web-based system that supports operations for the three parties involved—FrontDash, restaurants, and customers—and manages communication among them.

## Restaurant Requirements
A restaurant that wishes to sell food through FrontDash must register with the company and provide:

- Restaurant name (must be unique within the application)
- Restaurant picture (optional)
- Street address (required for driver pickup)
- Phone number(s) (each must be 10 digits long)
- Contact person (primary point of contact for questions or concerns)
- Email address (used for communication with FrontDash)
- Hours of opening (duration for each day of the week)
- Menu details for each food item, including:
  - Item name
  - Item picture
  - Item price
  - Availability (`AVAILABLE` or `UNAVAILABLE`)

Once a registration request is approved by FrontDash, a single account is created for the restaurant and credentials are sent to the provided email address. Authorized restaurant personnel share that account. The restaurant portal supports:

- Login and logout
- Change password
- Change menu
- Change opening hours
- Change contact information
- Withdraw from FrontDash (triggers review and confirmation by FrontDash)

Registration and withdrawal requests enter queues for FrontDash to approve or decline.

## Customer Experience
Customers do not need to log in. They must be able to:

- Browse the list of restaurants, seeing each name, optional logo, and current open/closed status
- Select a restaurant to view its menu
- Browse the selected restaurant's menu, choose one or more items, and specify quantities
- Confirm the order on a billing page that shows:
  - Restaurant name
  - Current date and time
  - Ordered items with name, price, quantity, and subtotal
  - Total before service charge
  - Service charge (8.25%)
  - Tip entry (percentage or fixed amount)
  - Grand total after tips
- Pay by credit card by providing:
  - Card type (VISA, MasterCard, Discover, etc.)
  - 16-digit card number
  - Cardholder first and last name
  - Billing address
  - Expiry month and year
  - 3-digit security code

Credit card details must be verified (third-party verification can be mocked). After verification, the customer supplies a delivery address including building number, street name, optional apartment/unit, city, state, contact person, and phone number. The system then issues an order number and an estimated delivery time.

## FrontDash Operations
FrontDash maintains queues and workflows:

- Restaurant registration and withdrawal requests are queued for administrator review.
- Customer orders are queued after credit card verification and order number generation.

### Administrator Capabilities
FrontDash has exactly one administrator who can:

- Log in and out (admin account is hard-coded)
- Approve or disapprove restaurant registrations
- Approve or disapprove restaurant withdrawals (may deny if payments are due)
- Add staff accounts (unique full name, username of last name plus two digits, auto-generated initial password)
- Delete staff accounts
- Hire drivers (unique driver name)
- Fire drivers

### Staff Capabilities
Staff members can:

- Log in and out
- Change password (forced on first login)
- Retrieve the first order from the order queue and persist it before removal
- Compute estimated delivery time (automatically or manually) using restaurant and customer addresses
- Dispatch a driver for an order
- Record order status and amount after delivery

## Implementation Rules
The following rules apply throughout the system:

- Passwords are never displayed and must be stored encrypted/masked.
- Non-admin usernames contain at least two characters followed by two digits.
- Passwords must be at least six characters with at least one uppercase letter, one lowercase letter, and one number.
- All user input requires validation (e.g., 16-digit credit card numbers with non-zero leading digit, 10-digit phone numbers with non-zero leading digit, names with at least two letters).
- Every action should produce UI feedback (success and error states) without relying on database inspection.
- Any destructive action must show a confirmation dialog (e.g., "Are you sure you want to delete the account <username>?").
- Restaurant, customer, and FrontDash components should function independently and concurrently.

## Bonus Features
Optional enhancements include:

- **Customer Loyalty Program (20%)**: Customers register (full name, phone, email, delivery address, credit card details). Registrations are queued for approval. Approved customers receive a unique number for redeeming points (1 point per pre-fee dollar, 10% discount when ≥100 points, deduct 100 points on redemption).
- **Spring Security Integration (5%)**: Implement Spring Security features and submit a report with implementation details and sample code.
