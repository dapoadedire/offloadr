"use client";

import { motion } from "motion/react";
import {
  FileText,
  Users,
  ShoppingBag,
  AlertCircle,
  Scale,
  Ban,
  RefreshCw,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  {
    icon: Users,
    title: "1. Acceptance of Terms",
    content: `By accessing or using Offloadr, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.

These terms apply to all users of the platform, including buyers, sellers, and visitors. We reserve the right to update these terms at any time, and your continued use of the platform constitutes acceptance of any changes.`,
  },
  {
    icon: ShoppingBag,
    title: "2. Use of Service",
    content: `Offloadr provides a platform for students to buy and sell used items within their campus community. To use our services, you must:

• Be a verified student at a participating educational institution
• Be at least 18 years old or have parental consent
• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Accept responsibility for all activities under your account

You agree not to use the platform for any unlawful purpose or in any way that could damage, disable, or impair the service.`,
  },
  {
    icon: FileText,
    title: "3. Listings & Transactions",
    content: `When creating listings, you agree to:

• Provide accurate descriptions and images of items
• Set fair and transparent prices
• Respond promptly to inquiries from potential buyers
• Honor agreed-upon terms of sale
• Not list prohibited items (weapons, illegal substances, counterfeit goods, stolen property)

Offloadr does not handle payments directly. All transactions are between buyers and sellers, and we are not responsible for the completion or quality of transactions.`,
  },
  {
    icon: Ban,
    title: "4. Prohibited Activities",
    content: `The following activities are strictly prohibited:

• Posting false, misleading, or fraudulent listings
• Harassment, threats, or abusive behavior toward other users
• Attempting to circumvent platform safety features
• Creating multiple accounts for deceptive purposes
• Posting spam or unsolicited commercial content
• Selling prohibited items (weapons, drugs, stolen goods, counterfeit items)
• Violating any applicable laws or regulations
• Impersonating another person or entity

Violation of these rules may result in immediate account suspension or termination.`,
  },
  {
    icon: AlertCircle,
    title: "5. Disclaimers & Limitations",
    content: `Offloadr is provided "as is" without warranties of any kind. We do not guarantee:

• The accuracy of listing information
• The quality or safety of items sold
• The completion of any transaction
• Continuous or uninterrupted access to the platform

We are not responsible for any disputes between users, though we may choose to help mediate. Our liability is limited to the maximum extent permitted by law.`,
  },
  {
    icon: Scale,
    title: "6. Intellectual Property",
    content: `All content on Offloadr, including logos, designs, and software, is owned by Offloadr or its licensors and is protected by intellectual property laws.

You retain ownership of content you post (such as photos and descriptions), but grant Offloadr a non-exclusive license to use, display, and distribute this content on our platform.

You may not copy, modify, or distribute Offloadr's proprietary content without express permission.`,
  },
  {
    icon: RefreshCw,
    title: "7. Account Termination",
    content: `We reserve the right to suspend or terminate your account at any time for:

• Violation of these Terms of Service
• Fraudulent or illegal activity
• Behavior that harms other users or the platform
• Extended periods of inactivity

Upon termination, your right to use the platform will immediately cease. You may request account deletion at any time by contacting us.`,
  },
];

export default function TermsPage() {
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
            <FileText className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold mb-6"
          >
            Terms of <span className="text-primary">Service</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Please read these terms carefully before using Offloadr.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-muted-foreground mt-4"
          >
            Last updated: December 2025
          </motion.p>
        </div>

        {/* Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">{section.title}</h2>
                    </div>
                    <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

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
                <h2 className="text-xl font-bold">
                  Questions About These Terms?
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please
                contact us:
              </p>
              <a
                href="mailto:hello@offloadr.com?subject=Terms%20of%20Service%20Inquiry"
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
