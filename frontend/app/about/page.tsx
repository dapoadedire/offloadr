"use client";

import { motion } from "motion/react";
import { Users, Heart, Shield, Leaf, Target, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const values = [
  {
    icon: Users,
    title: "Community First",
    description:
      "We believe in the power of campus communities. Offloadr connects students who can help each other while building meaningful connections.",
  },
  {
    icon: Shield,
    title: "Safety & Trust",
    description:
      "Every user is a verified student. We create a secure environment where you can trade with confidence, knowing you're dealing with fellow students.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description:
      "By giving items a second life, we reduce waste and promote sustainable consumption. Every transaction on Offloadr is a win for the planet.",
  },
  {
    icon: Heart,
    title: "Affordability",
    description:
      "Student life shouldn't break the bank. Offloadr helps students find great deals on essentials and earn extra cash from items they no longer need.",
  },
];

const stats = [
  { value: "100%", label: "Free to Use" },
  { value: "Campus", label: "Verified Students" },
  { value: "Secure", label: "Local Meetups" },
  { value: "Zero", label: "Transaction Fees" },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold mb-6"
          >
            About <span className="text-primary">Offloadr</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            The easiest way for students to buy and sell used items on campus.
            Simple, safe, and sustainable.
          </motion.p>
        </div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <Card>
            <CardContent className="p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Offloadr was born from a simple observation: every semester,
                students struggle to sell their belongings before leaving
                campus. Whether you&apos;re graduating, transferring, or just
                decluttering, finding buyers can be frustrating and
                time-consuming.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                We built Offloadr to make campus commerce effortless. Our
                platform connects students within the same campus community,
                making it easy to list items, find buyers, and complete safe
                in-person transactions.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Our <span className="text-primary">Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{value.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {value.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How It Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardContent className="p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  How It Started
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Offloadr started as a solution to a problem we experienced
                firsthand. As students, we saw dorm rooms full of perfectly good
                items being thrown away at the end of each semester. Textbooks,
                electronics, furniture—all headed for the dumpster.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                We knew there had to be a better way. So we built Offloadr: a
                platform designed specifically for the unique needs of campus
                communities. No complicated shipping, no stranger danger, no
                fees—just students helping students.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
