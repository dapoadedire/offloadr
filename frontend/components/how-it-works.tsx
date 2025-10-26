"use client";

import React from "react";
import { motion } from "motion/react";
import { Camera, Users, Handshake } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "List Your Item",
    description:
      "Take a quick photo, add a price and description. Your listing goes live in seconds.",
  },
  {
    icon: Users,
    title: "Connect with Buyers",
    description:
      "Students on your campus see your listing and contact you to arrange a meetup.",
  },
  {
    icon: Handshake,
    title: "Meet & Sell",
    description:
      "Arrange a safe meetup on campus. Exchange items and get paid in person.",
  },
];

export const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 font-mono"
    >
      <div className="text-center mb-12 sm:mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-mono"
        >
          How It Works in <span className="text-primary">3 Simple Steps</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Selling on campus has never been easier
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative"
            >
              {/* Step number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold z-10 font-mono">
                {index + 1}
              </div>

              {/* Content card */}
              <div className="bg-card border border-border rounded-2xl p-8 h-full hover:border-primary/50 transition-all duration-300">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-mono">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-primary/30"
                  >
                    <path
                      d="M5 12h14m-7-7l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
