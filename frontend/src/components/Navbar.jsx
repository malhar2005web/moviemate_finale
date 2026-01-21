import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu, Search, Bookmark } from "lucide-react";
import { useAuthStore } from "../store/authUser";
import { useContentStore } from "../store/content";
import FlickskyButton from "./FlickskyButton";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { setContentType } = useContentStore();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between p-4 h-20">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-10 z-50">
        <Link to="/">
          <img
            src="/netflix-logo.png"
            alt="Netflix Logo"
            className="w-32 sm:w-40"
          />
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden sm:flex gap-4 items-center">
          <Link
            to="/"
            className="hover:underline"
            onClick={() => setContentType("movie")}
          >
            Movies
          </Link>

          <Link
            to="/"
            className="hover:underline"
            onClick={() => setContentType("tv")}
          >
            TV Shows
          </Link>

          <Link to="/history" className="hover:underline">
            Search History
          </Link>

          {/* ✅ WATCHLIST ADDED HERE */}
          <Link
            to="/watchlist"
            className="hover:underline flex items-center gap-1"
          >
            <Bookmark size={16} />
            Watchlist
          </Link>

          <Link to="/watchparty" className="hover:underline">
            Watch Party
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex gap-3 items-center z-50">
        <Link to="/search">
          <Search className="size-6 cursor-pointer" />
        </Link>

        <FlickskyButton />

        <img
          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
          alt={user?.username}
          className="h-8 rounded cursor-pointer"
        />

        <LogOut className="size-6 cursor-pointer" onClick={logout} />

        <div className="sm:hidden">
          <Menu
            className="size-6 cursor-pointer"
            onClick={toggleMobileMenu}
          />
        </div>
      </div>

      {/* MOBILE NAV */}
      {isMobileMenuOpen && (
        <div className="w-full sm:hidden mt-4 z-50 bg-black border rounded border-gray-800">
          <Link
            to="/"
            className="block hover:underline p-2"
            onClick={toggleMobileMenu}
          >
            Movies
          </Link>

          <Link
            to="/"
            className="block hover:underline p-2"
            onClick={toggleMobileMenu}
          >
            TV Shows
          </Link>

          <Link
            to="/history"
            className="block hover:underline p-2"
            onClick={toggleMobileMenu}
          >
            Search History
          </Link>

          {/* ✅ WATCHLIST IN MOBILE TOO */}
          <Link
            to="/watchlist"
            className="block hover:underline p-2 flex items-center gap-2"
            onClick={toggleMobileMenu}
          >
            <Bookmark size={16} />
            Watchlist
          </Link>

          <Link
            to="/watchparty"
            className="block hover:underline p-2"
            onClick={toggleMobileMenu}
          >
            Watch Party
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
