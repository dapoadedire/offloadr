import React from "react";
import Link from "next/link";
import { Mail, Github, Twitter, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="font-mono border-t border-border bg-card mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary font-mono">
                Offloadr
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sell your stuff before you leave campus. Simple, local, and safe.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/marketplace"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Browse Items
                </Link>
              </li>
              <li>
                <Link
                  href="/items/new"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Start Selling
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Saved Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <a
                  href="mailto:adedireadedapo20@gmail.com?subject=Contact%20from%20Offloadr%20Website&body=Hi%20Offloadr%20Team%2C%0A%0A"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/guidelines"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/guidelines#reporting"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Report Listing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground
            flex-wrap
            "
            >
              <span>© {new Date().getFullYear()} Offloadr</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Made with{" "}
                <Heart className="h-3 w-3 fill-primary text-primary" /> for
                students
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="mailto:adedireadedapo20@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/offloadr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/offloadr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
