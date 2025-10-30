"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="font-mono border-b border-border bg-background sticky top-0 z-40"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-primary font-mono">
                Offloadr
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex gap-8 items-center"
          >
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
                  href="/browse"
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Browse
                </Link>
              </li>
            </ul>

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
          </motion.nav>

          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:hidden text-foreground z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu - Full Screen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background animate-in fade-in duration-200 font-mono">
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
                href="/browse"
                className="text-2xl text-muted-foreground hover:text-primary transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </Link>

              {/* Auth Buttons */}
              <div className="pt-8 space-y-4">
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
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
