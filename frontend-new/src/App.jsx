import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteShell from "./components/SiteShell";
import Home from "./pages/customer/Home";
import Restaurants from "./pages/customer/Restaurants";
import RestaurantDetails from "./pages/customer/RestaurantDetails";
import TableBooking from "./pages/customer/TableBooking";
import Payment from "./pages/customer/Payment";
import MyBookings from "./pages/customer/MyBookings";
import BookingSuccess from "./pages/customer/BookingSuccess";
import Invoice from "./pages/customer/Invoice";
import Feedback from "./pages/customer/Feedback";
import FoodMenu from "./pages/customer/FoodMenu";
import EventBooking from "./pages/customer/EventBooking";
import LoyaltyPoints from "./pages/customer/LoyaltyPoints";
import QRCheckIn from "./pages/customer/QRCheckIn";
import LastMinuteDeals from "./pages/customer/LastMinuteDeals";
import RebookTable from "./pages/customer/RebookTable";
import Notifications from "./pages/customer/Notifications";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import UserProfile from "./pages/customer/UserProfile";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurant/:id" element={<RestaurantDetails />} />
          <Route path="/booking" element={<TableBooking />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/menu" element={<FoodMenu />} />
          <Route path="/events" element={<EventBooking />} />
          <Route path="/loyalty" element={<LoyaltyPoints />} />
          <Route path="/qr-checkin" element={<QRCheckIn />} />
          <Route path="/last-minute-deals" element={<LastMinuteDeals />} />
          <Route path="/rebook" element={<RebookTable />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
