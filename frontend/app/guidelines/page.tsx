"use client";

import { motion } from "motion/react";
import {
  Users,
  Heart,
  MessageSquare,
  ShieldCheck,
  Handshake,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const guidelines = [
  {
    icon: Heart,
    title: "Be Respectful",
    description:
      "Treat every user with respect and courtesy. Remember that you're interacting with fellow students from your campus community.",
    do: [
      "Use polite and professional language",
      "Respond to messages promptly",
      "Be understanding of different schedules",
      "Give constructive feedback in reviews",
    ],
    dont: [
      "Use offensive or discriminatory language",
      "Harass or threaten other users",
      "Leave fake or malicious reviews",
      "Engage in personal attacks",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Be Honest",
    description:
      "Honesty builds trust in our community. Accurate listings and transparent communication lead to better experiences for everyone.",
    do: [
      "Describe items accurately and completely",
      "Upload clear, recent photos",
      "Disclose any defects or damage",
      "Price items fairly",
    ],
    dont: [
      "Misrepresent item condition",
      "Use misleading photos",
      "Hide known problems",
      "Engage in bait-and-switch tactics",
    ],
  },
  {
    icon: Handshake,
    title: "Honor Commitments",
    description:
      "When you agree to a transaction, follow through. Your reliability affects the entire community.",
    do: [
      "Show up to scheduled meetups",
      "Communicate if plans change",
      "Complete agreed-upon transactions",
      "Be on time for meetings",
    ],
    dont: [
      "Ghost buyers or sellers",
      "Back out without notice",
      "Change prices after agreement",
      "Keep items on hold indefinitely",
    ],
  },
  {
    icon: MessageSquare,
    title: "Communicate Clearly",
    description:
      "Good communication prevents misunderstandings and makes transactions smoother for everyone.",
    do: [
      "Ask questions before committing",
      "Confirm details in writing",
      "Respond within 24 hours",
      "Be clear about availability",
    ],
    dont: [
      "Ignore messages",
      "Be vague about important details",
      "Make assumptions",
      "Send spam or irrelevant messages",
    ],
  },
];

const prohibitedItems = [
  "Weapons and ammunition",
  "Illegal drugs or substances",
  "Stolen property",
  "Counterfeit goods",
  "Hazardous materials",
  "Alcohol and tobacco",
  "Adult content",
  "Prescription medications",
  "Live animals",
  "Items violating campus policies",
];

const reportReasons = [
  "Fraudulent or misleading listings",
  "Harassment or threatening behavior",
  "Prohibited items",
  "No-shows or non-responsive users",
  "Spam or scam attempts",
  "Inappropriate content",
];

export default function GuidelinesPage() {
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Users className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold mb-6"
          >
            Community <span className="text-primary">Guidelines</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            These guidelines help keep Offloadr a safe, friendly, and
            trustworthy marketplace for all students.
          </motion.p>
        </div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-6 sm:p-8">
              <p className="text-muted-foreground leading-relaxed">
                Offloadr is built on trust between students. Our community
                guidelines exist to ensure everyone has a positive experience.
                By using Offloadr, you agree to follow these guidelines.
                Violations may result in warnings, temporary suspension, or
                permanent removal from the platform.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Guidelines */}
        <div className="space-y-8 mb-12">
          {guidelines.map((guideline, index) => {
            const Icon = guideline.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">
                          {guideline.title}
                        </h2>
                        <p className="text-muted-foreground">
                          {guideline.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-semibold text-green-500">
                            Do
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {guideline.do.map((item, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-green-500 mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-red-500">
                            Don&apos;t
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {guideline.dont.map((item, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-red-500 mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Prohibited Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold">Prohibited Items</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                The following items are not allowed on Offloadr:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {prohibitedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reporting */}
        <motion.div
          id="reporting"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-8 scroll-mt-24"
        >
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">
                Reporting <span className="text-primary">Violations</span>
              </h2>
              <p className="text-muted-foreground mb-4">
                If you encounter behavior that violates these guidelines, please
                report it. You can report:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {reportReasons.map((reason, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-primary">•</span>
                    {reason}
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">
                Reports are reviewed by our team and kept confidential. We take
                all reports seriously and will take appropriate action.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="border-primary/50">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Questions or Concerns?</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                If you have questions about these guidelines or need to report a
                serious issue, contact us:
              </p>
              <a
                href="mailto:hello@offloadr.com?subject=Community%20Guidelines%20Inquiry"
                className="text-primary hover:underline"
              >
                hello@offloadr.com
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
