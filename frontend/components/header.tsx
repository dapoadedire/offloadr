"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X, User, LogOut, Heart, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="font-mono border-b border-border bg-background sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-primary font-mono">
                Offloadr
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-8 items-center">
            <ul className="flex gap-6 items-center">
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Browse
                </Link>
              </li>
            </ul>

            {isAuthenticated && user ? (
              <ul className="flex gap-3 items-center">
                <li>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-8 w-8 ring-1 ring-primary ring-offset-1 ring-offset-background">
                          <AvatarImage src={user.avatar_url || undefined} alt={`${user.firstname} ${user.lastname}`} />
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.firstname} {user.lastname}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/my-listings" className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          My Listings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/favorites" className="cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          Favorites
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user.id}`} className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              </ul>
            ) : (
              <ul className="flex gap-3 items-center">
                <li>
                  <Button asChild variant="outline" className="font-medium">
                    <Link href="/login">Log in</Link>
                  </Button>
                </li>
                <li>
                  <Button asChild className="font-medium">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </li>
              </ul>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-foreground z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-background animate-in fade-in duration-200 font-mono">
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl font-bold text-primary font-mono">
                  Offloadr
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu Content */}
            <nav className="flex-1 flex flex-col justify-center px-8 space-y-8">
              <Link
                href="/#how-it-works"
                className="text-2xl text-muted-foreground hover:text-primary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it works
              </Link>
              <Link
                href="/marketplace"
                className="text-2xl text-muted-foreground hover:text-primary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </Link>

              {/* Auth Buttons */}
              <div className="pt-8 space-y-4">
                {isAuthenticated && user ? (
                  <>
                    <div className="pb-4 border-b border-border">
                      <p className="text-sm font-medium">{user.firstname} {user.lastname}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full font-medium text-lg h-12 justify-start"
                    >
                      <Link href="/my-listings" onClick={() => setMobileMenuOpen(false)}>
                        <Package className="mr-2 h-5 w-5" />
                        My Listings
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full font-medium text-lg h-12 justify-start"
                    >
                      <Link href="/favorites" onClick={() => setMobileMenuOpen(false)}>
                        <Heart className="mr-2 h-5 w-5" />
                        Favorites
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full font-medium text-lg h-12 justify-start"
                    >
                      <Link href={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)}>
                        <User className="mr-2 h-5 w-5" />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full font-medium text-lg h-12 justify-start text-destructive hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full font-medium text-lg h-12"
                    >
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button asChild className="w-full font-medium text-lg h-12">
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Sign up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
