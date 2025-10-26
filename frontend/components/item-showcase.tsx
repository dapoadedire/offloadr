"use client";

import React from "react";
import { motion } from "motion/react";
import Image from "next/image";

const items = [
  {
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    label: "Laptop",
    price: "₦80,000",
  },
  {
    image:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop",
    label: "Books",
    price: "₦5,000",
  },
  {
    image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
    label: "Sneakers",
    price: "₦12,000",
  },
  {
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    label: "Backpack",
    price: "₦8,000",
  },
  {
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    label: "Headphones",
    price: "₦15,000",
  },
  {
    image:
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop",
    label: "Chair",
    price: "₦45,000",
  },
  {
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    label: "Watch",
    price: "₦20,000",
  },
  {
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=400&fit=crop",
    label: "Bike",
    price: "₦35,000",
  },
];

export const ItemShowcase = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto my-12">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-3xl" />

      {/* Items bento grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.5 + index * 0.05,
              ease: "easeOut",
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={index < 4}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzMzMzMyIvPjwvc3ZnPg=="
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Label and price */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-semibold text-sm mb-1 font-mono">
                  {item.label}
                </p>
                <p className="text-primary font-bold text-lg font-mono">
                  {item.price}
                </p>
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute -top-4 right-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-xl border-3 border-background"
      >
        ✨ Popular Items
      </motion.div>
    </div>
  );
};
