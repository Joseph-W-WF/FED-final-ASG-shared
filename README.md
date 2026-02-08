FED final assignment
Store web/app data into db.js

## Vendor Management page
**Done by:** Lervyn Ang (S10273196B)

### Overview
The Vendor Management module focuses on supporting hawker stall owners in managing their daily operations through a centralised interface. This module allows vendors to manage menu items, track rental agreements and renewals, monitor stall performance, and review order history. The features are designed to improve operational efficiency, provide better visibility of stall performance, and enhance decision-making.

### Implemented Features

#### Sidebar Navigation
A sidebar-based navigation system is used to provide quick access to all vendor-related features, including menu management, rental agreements, performance dashboard, and order history. This allows vendors to switch between features efficiently without leaving the vendor portal.

#### Menu Management (Multiple Cuisines per Item)
Vendors can add, edit, and delete menu items for their stall. Each menu item supports multiple cuisine tags, allowing flexible categorisation of food offerings, especially for fusion dishes. Menu items are filtered by stall ID to ensure vendors only manage their own stall’s menu.

#### Rental Agreement Management
This feature allows vendors to view all current and past rental agreements associated with their stall. Each agreement displays details such as agreement ID, rental period, monthly amount, and status (active or expired).

#### Rental Renewal
Vendors can renew rental agreements by updating the rental period and rental amount. Previous agreements are retained to maintain a history of rental changes over time. Agreement status is automatically updated based on the rental end date.

#### Stall Performance Dashboard
The stall performance dashboard provides an overview of key performance metrics, including total orders, total revenue, sales trends over time, and top-selling menu items. Vendors can filter performance data by month range to analyse trends more effectively. At this stage, dashboard data is simulated on the front end for demonstration purposes.

#### Vendor Order History
The vendor order history feature allows stall owners to review orders placed at their stall. Orders can be filtered by status such as active, completed, or cancelled. Each order displays customer details, ordered items, payment method, and order date, helping vendors track sales activity and identify frequent or high-spending customers

### Technologies Used (Vendor Module)
- HTML
- CSS
- JavaScript 
- Firebase Firestore (data storage)  

### Assumptions & Limitations
- This module focuses on front-end functionality and user interaction.
- Some dashboard analytics are generated on the client side for demonstration.
- Payment processing is not implemented, as it is handled by another system.
