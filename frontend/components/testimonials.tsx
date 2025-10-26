"use client";

import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Chioma A.",
    school: "Obafemi Awolowo University",
    text: "I sold my fridge in under 24 hours! Offloadr made it so easy to connect with other students before I graduated.",
    rating: 5,
  },
  {
    name: "David O.",
    school: "Obafemi Awolowo University",
    text: "Best campus marketplace I've used. Found a great laptop for my studies at half the price. Safe and reliable!",
    rating: 4,
  },
  {
    name: "Blessing M.",
    school: "Obafemi Awolowo University",
    text: "Sold my textbooks, mini fridge, and desk lamp all within a week. The process was super smooth and everyone was trustworthy.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 font-mono">
      <div className="text-center mb-12 sm:mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-mono"
        >
          What <span className="text-primary">Students</span> Are Saying
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Join hundreds of students who&apos;ve successfully bought and sold on
          campus
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300"
          >
            {/* Star rating */}
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-secondary text-secondary"
                />
              ))}
            </div>

            {/* Testimonial text */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              &quot;{testimonial.text}&quot;
            </p>

            {/* Author info */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.school}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
