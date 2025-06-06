"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, ChartNoAxesGantt } from "lucide-react";
import { useState, useEffect } from "react";

type HeaderProps = {
  className?: string;
};

// Define user roles from the User model
type UserRole = 'beheerder' | 'developer' | 'vrijwilliger' | 'stagiair' | 'user'

// Define the structure for route permissions
type RoutePermissions = {
  [key in UserRole]: string[]
}

export function Header({ className = "" }: HeaderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get the role from session or fallback to 'user'
  const userRole = (session?.user?.role as UserRole) || 'user';
  
  // Define which routes each role can access
  const routePermissions: RoutePermissions = {
    beheerder: [
      '/beheer/dashboard',
      '/beheer/gegevens',
      '/beheer/gebruikers',
      '/beheer/notities',
      '/beheer/projecten',
      '/beheer/agenda',
      '/beheer/contact',
      '/beheer/vrijwilligers',
      '/beheer/fotoboek',
      '/beheer/nieuwsbrief',
      '/beheer/handleiding',
    ],
    developer: [
      '/beheer/dashboard',
      '/beheer/gegevens',
      '/beheer/notities',
      '/beheer/projecten',
      '/beheer/agenda',
      '/beheer/contact',
      '/beheer/fotoboek',
      '/beheer/nieuwsbrief',
      '/beheer/handleiding',
    ],
    vrijwilliger: [
      '/beheer/dashboard',
      '/beheer/gegevens',
      '/beheer/agenda',
    ],
    stagiair: [
      '/beheer/dashboard',
      '/beheer/gegevens',
    ],
    user: [
      '/beheer/dashboard',
      '/beheer/gegevens',
    ],
  }

  // Dashboard navigation links
  const allDashboardLinks = [
    { href: '/beheer/dashboard', label: 'Dashboard' },
    { href: '/beheer/gegevens', label: 'Persoonlijke gegevens' },
    { href: '/beheer/gebruikers', label: 'Gebruikers' },
    { href: '/beheer/notities', label: 'Notities' },
    { href: '/beheer/projecten', label: 'Projecten' },
    { href: '/beheer/agenda', label: 'Agenda' },
    { href: '/beheer/contact', label: 'Contact' },
    { href: '/beheer/vrijwilligers', label: 'Vrijwilligers' },
    { href: '/beheer/fotoboek', label: 'Fotoboek' },
    { href: '/beheer/nieuwsbrief', label: 'Nieuwsbrief' },
  ]

  // Filter dashboard links based on user role
  const authorizedDashboardLinks = session ? allDashboardLinks.filter(link => 
    routePermissions[userRole].includes(link.href)
  ) : []

  // Handle the Handleiding link separately to style it differently
  const handleidingLink = { href: '/beheer/handleiding', label: 'Handleiding' }
  const showHandleiding = session && routePermissions[userRole].includes(handleidingLink.href)

  // Public navigation links
  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/agenda', label: 'Agenda' },
    { href: '/projecten', label: 'Projecten' },
    { href: '/nieuwsbrief', label: 'Nieuwsbrief' },
    { href: '/contact', label: 'Contact' },
    { href: '/fotoboek', label: 'Fotoboek' },
  ]
  
  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Function to handle sign-out
  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    signOut({ redirect: true, callbackUrl: '/' });
  };

  // Check if a link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check if we're on a dashboard page
  const isDashboardPage = pathname?.startsWith('/beheer');

  return (
    <>
      {/* Sticky header with fixed position - HIGHEST z-index */}
      <header 
        className={`fixed top-0 left-0 right-0 w-full z-[99999] bg-white shadow-md ${className}`}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-row items-center justify-between">
          
          {/* Left: Logo + Title */}
          <Link href="/">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-12 w-12" />
              <span className="text-2xl font-bold text-[#2E376F]">
                Stichting Asha
              </span>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex items-center justify-center w-10 h-10 text-[#2E376F] transition-all duration-300"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-6 h-6">
              <ChartNoAxesGantt 
                className={`absolute inset-0 transform transition-all duration-300 ease-in-out ${
                  isMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                }`} 
              />
              <X 
                className={`absolute inset-0 transform transition-all duration-300 ease-in-out ${
                  isMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
                }`} 
              />
            </div>
          </button>

          {/* Desktop Navigation - ONLY show public links (dashboard removed from desktop) */}
          <div className="hidden md:flex flex-1 justify-center">
            <nav className="flex flex-wrap justify-center gap-6 text-base font-medium">
              {/* Always show public navigation only */}
              {publicLinks.map(({ href, label }) => (
                <Link 
                  key={href}
                  href={href} 
                  className={`transition-colors duration-300 ${isActive(href) ? 'text-[#E4C67B]' : 'text-[#2E376F]'}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:block font-semibold text-right">
            {status === "loading" ? (
              <span className="text-[#2E376F]">Loading...</span>
            ) : session ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/beheer/dashboard" 
                  className={`transition-colors duration-300 ${isActive('/beheer/dashboard') ? 'text-[#E4C67B]' : 'text-[#2E376F]'}`}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-red-700 hover:text-red-800 transition-colors duration-200"
                >
                  Uitloggen <LogOut className="w-5 h-5 inline-block ml-1" />
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className={`transition-colors duration-300 ${isActive('/login') ? 'text-[#E4C67B]' : 'text-[#2E376F]'}`}
              >
                Inloggen
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu (Slide down when open) */}
        <div 
          className={`md:hidden w-full bg-white overflow-hidden transition-all duration-300 ease-in-out shadow-lg ${
            isMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
            {session && isDashboardPage ? (
              // Show dashboard navigation when logged in and on dashboard pages (mobile)
              <>
                {/* Dashboard section */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 mt-3">
                    Dashboard
                  </h3>
                  <div className="space-y-1">
                    {authorizedDashboardLinks.map(({ href, label }) => (
                      <Link 
                        key={href}
                        href={href} 
                        className={`block py-3 px-3 rounded-lg transition-all duration-200 ${
                          isActive(href) 
                            ? 'bg-[#E4C67B] bg-opacity-20 text-[#2E376F] font-semibold' 
                            : 'text-[#2E376F] hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                    
                    {/* Handleiding link with special styling */}
                    {showHandleiding && (
                      <>
                        <div className="my-3 border-t border-gray-200"></div>
                        <Link 
                          href={handleidingLink.href}
                          className={`flex items-center gap-2 py-3 px-3 rounded-lg transition-all duration-200 ${
                            isActive(handleidingLink.href) 
                              ? 'bg-[#E4C67B] bg-opacity-20 text-[#2E376F] font-semibold' 
                              : 'text-[#2E376F] hover:bg-gray-50'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                          </svg>
                          {handleidingLink.label}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Public section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Publiek
                  </h3>
                  <div className="space-y-1">
                    {publicLinks.map(({ href, label }) => (
                      <Link 
                        key={href}
                        href={href} 
                        className={`block py-3 px-3 rounded-lg transition-all duration-200 ${
                          isActive(href) 
                            ? 'bg-[#E4C67B] bg-opacity-20 text-[#2E376F] font-semibold' 
                            : 'text-[#2E376F] hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // Show regular navigation when not on dashboard pages (mobile)
              <div className="mt-3 space-y-1">
                {publicLinks.map(({ href, label }) => (
                  <Link 
                    key={href}
                    href={href} 
                    className={`block py-3 px-3 rounded-lg transition-all duration-200 ${
                      isActive(href) 
                        ? 'bg-[#E4C67B] bg-opacity-20 text-[#2E376F] font-semibold' 
                        : 'text-[#2E376F] hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile Auth Controls */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {status === "loading" ? (
                <span className="text-[#2E376F] block py-3 px-3">Loading...</span>
              ) : session ? (
                <div className="space-y-1">
                  {/* Show Dashboard link when logged in but not on dashboard pages */}
                  {!isDashboardPage && (
                    <Link 
                      href="/beheer/dashboard" 
                      className={`block py-3 px-3 rounded-lg transition-all duration-200 ${
                        isActive('/beheer/dashboard') 
                          ? 'bg-[#E4C67B] bg-opacity-20 text-[#2E376F] font-semibold' 
                          : 'text-[#2E376F] hover:bg-gray-50'
                      }`}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center text-red-700 hover:text-red-800 py-3 px-3 w-full text-left rounded-lg hover:bg-red-50 transition-all duration-200"
                  >
                    <span>Uitloggen</span> 
                    <LogOut className="w-5 h-5 ml-2" />
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className={`block py-3 px-3 rounded-lg transition-all duration-200 ${
                    isActive('/login') 
                      ? 'bg-[#E4C67B] bg-opacity-20 text-[#2E376F] font-semibold' 
                      : 'text-[#2E376F] hover:bg-gray-50'
                  }`}
                >
                  Inloggen
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Body offset to prevent content from being hidden behind fixed header */}
      <style jsx global>{`
        body {
          padding-top: 5rem !important;
          margin-top: 0 !important;
        }
        html {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  );
}