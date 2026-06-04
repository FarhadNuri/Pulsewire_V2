'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If we're already on the home page, scroll to top
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Otherwise, let the default Link behavior take over
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/bookmarks', label: 'Bookmarks' },
    { href: '/history', label: 'History' },
  ];

  return (
    <header className="bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2 md:gap-3">
            <img src="/logo.svg" alt="PulseWire Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <span className="text-xl md:text-2xl font-bold">
              <span className="text-red-600">PULSE</span>
              <span className="text-white">WIRE</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            {session?.user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`cursor-pointer px-3 lg:px-4 py-2 text-sm lg:text-base transition-colors relative ${
                      isActive(link.href)
                        ? 'text-red-600 font-semibold'
                        : 'text-white hover:text-red-600'
                    }`}
                  >
                    {link.label}
                    {isActive(link.href) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></span>
                    )}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="cursor-pointer ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm lg:text-base transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="cursor-pointer px-3 lg:px-4 py-2 text-white hover:text-red-600 font-medium text-sm lg:text-base"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="cursor-pointer px-3 lg:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm lg:text-base"
                >
                  Register
                </Link>
              </>
            )}
          </nav>


          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-red-600"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>


        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
            <div className="flex flex-col gap-2">
              {session?.user ? (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`cursor-pointer px-4 py-2 rounded-lg transition-colors ${
                        isActive(link.href)
                          ? 'bg-red-600 text-white font-semibold'
                          : 'text-white hover:bg-gray-800'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-left transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="cursor-pointer px-4 py-2 text-white hover:bg-gray-800 rounded-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
