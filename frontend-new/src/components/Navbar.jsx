import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">

      <div className="container mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link to="/">
          <h1 className="text-3xl font-bold text-orange-500">
            RestorantBooking
          </h1>
        </Link>

        {/* Menu */}
        <div className="hidden md:flex items-center gap-8">

          <Link
            to="/"
            className="hover:text-orange-500 transition"
          >
            Home
          </Link>

          <Link
            to="/restaurants"
            className="hover:text-orange-500 transition"
          >
            Restaurants
          </Link>

          <Link
            to="/menu"
            className="hover:text-orange-500 transition"
          >
            Menu
          </Link>

          <Link
            to="/booking"
            className="hover:text-orange-500 transition"
          >
            Book Table
          </Link>

        </div>

        {/* Buttons */}
        <div className="flex gap-3">

          <button className="border border-orange-500 px-5 py-2 rounded-lg hover:bg-orange-500">
            Login
          </button>

          <button className="bg-orange-500 px-5 py-2 rounded-lg hover:bg-orange-600">
            Register
          </button>

        </div>

      </div>

    </nav>
  );
}