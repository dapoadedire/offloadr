"use client";

import React from "react";
import { motion } from "motion/react";
import { Button } from "./button";
import {
  ShieldCheck,
  MapPin,
  Zap,
  Package,
  GraduationCap,
  Recycle,
} from "lucide-react";
import { ItemShowcase } from "../item-showcase";

export const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 font-mono">
      <div className="flex flex-col items-center text-center gap-6 sm:gap-8">
        {/* Social proof badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-2 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm"
        >
          <span
            className="text-primary font-medium text-xs
          sm:text-sm  
          "
          >
            Join 20+ students already selling on campus
          </span>
        </motion.div>

        {/* Hero heading */}
        <div className="space-y-4 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-pretty leading-tight [word-spacing:-0.2em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-mono"
          >
            Sell your stuff before you{" "}
            <span className="text-primary">leave campus</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-pretty leading-tight text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Offloadr makes moving out stress-free. <br />
            List items in minutes, connect with buyers instantly, and get paid
            before you pack.
          </motion.p>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-3 sm:gap-4 flex-wrap justify-center"
        >
          <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8">
            Start Selling
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base sm:text-lg px-6 sm:px-8"
          >
            Browse Items
          </Button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap gap-4 sm:gap-6 md:gap-8 items-center justify-center text-xs sm:text-sm text-muted-foreground mt-4"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Campus Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-success" />
            <span>Safe Meetups</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-success" />
            <span>Fast Listings</span>
          </div>
        </motion.div>

        {/* Item Showcase */}
        <ItemShowcase />

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-mono">
              List in Minutes
            </h3>
            <p className="text-muted-foreground text-sm">
              Take a photo, set a price, and you&apos;re live. No complicated
              forms or verification delays.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-card border border-border rounded-2xl p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-mono">
              Campus Only
            </h3>
            <p className="text-muted-foreground text-sm">
              Buy and sell within your university community. Meet on campus,
              stay safe.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-card border border-border rounded-2xl p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Recycle className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-mono">
              Sustainable
            </h3>
            <p className="text-muted-foreground text-sm">
              Give your items a second life instead of throwing them away. Good
              for you, great for the planet.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
