"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FileQuestion, Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardContent className="py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-full bg-muted w-32 h-32 flex items-center justify-center mx-auto mb-8"
            >
              <FileQuestion className="h-16 w-16 text-muted-foreground" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
              <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Link href="/marketplace">
                <Button className="w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Marketplace
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </motion.div>

            {/* Popular links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 pt-8 border-t border-border"
            >
              <p className="text-sm text-muted-foreground mb-4">
                Looking for something specific?
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/marketplace">
                  <Button variant="link" size="sm">
                    Marketplace
                  </Button>
                </Link>
                <Link href="/items/new">
                  <Button variant="link" size="sm">
                    Sell an Item
                  </Button>
                </Link>
                <Link href="/favorites">
                  <Button variant="link" size="sm">
                    My Favorites
                  </Button>
                </Link>
                <Link href="/my-listings">
                  <Button variant="link" size="sm">
                    My Listings
                  </Button>
                </Link>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
