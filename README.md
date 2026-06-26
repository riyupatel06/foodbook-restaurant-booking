# RestaurantBooking

RestaurantBooking is a MERN stack restaurant table booking platform with customer, vendor, and admin panels. The system allows users to browse restaurants, view food menus, book tables, make payments, download invoices, give feedback, and manage their booking history.

The project also includes a vendor dashboard for restaurant owners to manage restaurant details, tables, menus, bookings, payments, and customer feedback. An admin panel is included to manage users, vendors, restaurants, bookings, payments, and platform settings.

Built using React.js for the frontend, Node.js and Express.js for the backend, MongoDB for the database, and JWT for secure authentication.

## Features

* Customer registration and login
* Vendor registration and login
* Admin authentication and protected admin dashboard
* Restaurant browsing with restaurant details page
* Table booking with date, time, and guest selection
* Customer booking history
* Food menu listing and restaurant menu management
* Online payment workflow
* Invoice generation for bookings and payments
* Customer feedback and restaurant reviews
* Loyalty points system for repeat customers
* Notifications for bookings, payments, and updates
* QR check-in support for restaurant visits
* Rebooking option for previous bookings
* Vendor dashboard for restaurant management
* Vendor table management with add, view, update, and delete functionality
* Vendor booking management and booking status updates
* Vendor payment and invoice management
* Admin dashboard with platform overview
* Admin management for users, vendors, restaurants, bookings, and payments
* Admin approval and control for restaurant/vendor records
* Seed scripts for demo restaurants, menu items, tables, vendors, and users
* Responsive user interface for customer, vendor, and admin panels
* MongoDB database integration

## Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* Vite
* React Router
* Axios
* Tailwind CSS

### Backend

* Node.js
* Express.js
* JSON Web Token authentication
* bcrypt.js
* Mongoose
* Nodemailer
* Multer
* Email and SMS integration hooks

### Database

* MongoDB Atlas

### Testing

* Node.js test runner
* Supertest

## Project Structure

```text
RestaurantBooking/
├── backend/       # Node.js, Express.js, and MongoDB backend API
├── frontend-new/  # Customer React.js application
├── vendor/        # Vendor React.js dashboard
├── admin/         # Admin React.js dashboard
├── .gitignore
└── README.md
```

## Ports

| App            | Port | URL                               |
| -------------- | ---- | --------------------------------- |
| Backend Server | 5000 | http://localhost:5000             |
| Customer App   | 5173 | http://localhost:5173             |
| Vendor Panel   | 5174 | http://localhost:5174             |
| Admin Panel    | 5175 | http://localhost:5175/admin/login |

## Prerequisites

* Node.js 18 or newer
* npm
* MongoDB connection string
* MongoDB Atlas account or local MongoDB setup

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/RestaurantBooking.git
cd RestaurantBooking
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install customer frontend dependencies:

```bash
cd ../frontend-new
npm install
```

Install vendor panel dependencies:

```bash
cd ../vendor
npm install
```

Install admin panel dependencies:

```bash
cd ../admin
npm install
```

## Environment Setup

Create environment files from the examples:

```bash
copy backend\.env.example backend\.env
```

Update `backend/.env` with your MongoDB connection string, JWT secret, admin credentials, Google OAuth keys, and other required configuration.

Example backend environment:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_EMAIL=admin@restaurantbooking.app
ADMIN_PASSWORD=your_admin_password
VENDOR_SEED_PASSWORD_PREFIX=your_vendor_password_prefix
SEED_USER_PASSWORD=your_seed_user_password
```

Optional email and SMS variables can also be added in the backend `.env` file.

Real `.env` files are ignored by Git and should not be uploaded to GitHub.

## Run The Project

Open four terminals.

Terminal 1: Start Backend

```bash
cd backend
npm run dev
```

Backend server:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

Terminal 2: Start Customer App

```bash
cd frontend-new
npm run dev
```

Customer website:

```text
http://localhost:5173
```

Terminal 3: Start Vendor Panel

```bash
cd vendor
npm run dev
```

Vendor dashboard:

```text
http://localhost:5174
```

Terminal 4: Start Admin Panel

```bash
cd admin
npm run dev
```

Admin dashboard:

```text
http://localhost:5175/admin/login
```

## Database Seed

Run the seed script to add demo restaurants, menus, tables, vendors, and users:

```bash
cd backend
npm run seed
```

Run catalog seed if available:

```bash
npm run seed:catalog
```

## Admin Login

Use the admin email and password configured in your backend `.env` file:

```env
ADMIN_EMAIL=admin@restaurantbooking.app
ADMIN_PASSWORD=your_admin_password
```

Then open:

```text
http://localhost:5175/admin/login
```

## Available Scripts

In the backend folder:

```bash
npm run dev
npm start
npm run seed
npm run seed:catalog
npm test
npm run lint
```

In the frontend, vendor, and admin folders:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## API Routes

The backend exposes the following route groups:

```text
/api/auth
/api/restaurants
/api/menu
/api/tables
/api/bookings
/api/payments
/api/invoices
/api/feedback
/api/notifications
/api/ai
/api/customer
/api/vendor
/api/admin
```

## Screens

* Customer home page
* Customer login and register page
* Restaurant listing page
* Restaurant details page
* Table booking page
* Booking history page
* Payment page
* Invoice page
* Feedback and review page
* Customer profile page
* Vendor login and register page
* Vendor dashboard
* Vendor restaurant management page
* Vendor menu management page
* Vendor table management page
* Vendor booking management page
* Vendor payment and invoice page
* Admin login page
* Admin dashboard
* Admin users page
* Admin vendors page
* Admin restaurants page
* Admin bookings page
* Admin payments page
* Admin settings page

## Notes

* Run the backend first before opening the customer, vendor, or admin panels.
* The project uses MongoDB, so database access depends on a valid connection string in `backend/.env`.
* Do not commit `.env` files or real credentials.
* Use `.env.example` only as a template.
* Rotate any credentials that were accidentally committed or shared.
* `node_modules`, `dist`, and real environment files should be ignored by Git.
