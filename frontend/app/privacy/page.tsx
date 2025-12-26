"use client";

import { motion } from "motion/react";
import {
  Shield,
  Eye,
  Lock,
  Database,
  Bell,
  UserCheck,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create an account, we collect your name, email address (school email for verification), and profile information you choose to provide.",
      },
      {
        subtitle: "Listing Information",
        text: "When you create listings, we collect item details, photos, pricing, and location information (campus/school).",
      },
      {
        subtitle: "Usage Data",
        text: "We automatically collect information about how you interact with Offloadr, including pages viewed, features used, and time spent on the platform.",
      },
      {
        subtitle: "Device Information",
        text: "We collect device type, operating system, browser type, and IP address to improve our services and security.",
      },
    ],
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Providing Services",
        text: "We use your information to operate Offloadr, including displaying listings, facilitating communication between users, and verifying student status.",
      },
      {
        subtitle: "Improving Our Platform",
        text: "We analyze usage patterns to improve features, fix bugs, and develop new functionality.",
      },
      {
        subtitle: "Safety & Security",
        text: "We use information to detect and prevent fraud, abuse, and policy violations.",
      },
      {
        subtitle: "Communication",
        text: "We may send you service-related announcements, updates about your listings, and responses to your inquiries.",
      },
    ],
  },
  {
    icon: UserCheck,
    title: "Information Sharing",
    content: [
      {
        subtitle: "With Other Users",
        text: "Your public profile, listings, and reviews are visible to other users. We never share your personal contact information without your consent.",
      },
      {
        subtitle: "Service Providers",
        text: "We may share information with trusted third parties who help us operate our platform (e.g., hosting, analytics) under strict confidentiality agreements.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information if required by law or to protect the rights, property, or safety of Offloadr, our users, or others.",
      },
    ],
  },
  {
    icon: Lock,
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "We use industry-standard encryption (SSL/TLS) to protect data transmitted between your device and our servers.",
      },
      {
        subtitle: "Access Controls",
        text: "We limit access to personal information to employees who need it to perform their jobs.",
      },
      {
        subtitle: "Regular Audits",
        text: "We regularly review our security practices and update them to address new threats.",
      },
    ],
  },
  {
    icon: Bell,
    title: "Your Rights & Choices",
    content: [
      {
        subtitle: "Access & Update",
        text: "You can access and update your account information at any time through your profile settings.",
      },
      {
        subtitle: "Delete Account",
        text: "You can request deletion of your account and associated data by contacting us.",
      },
      {
        subtitle: "Marketing Opt-Out",
        text: "You can opt out of marketing communications while still receiving essential service updates.",
      },
      {
        subtitle: "Data Portability",
        text: "You can request a copy of your data in a portable format.",
      },
    ],
  },
];

export default function PrivacyPage() {
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
            <Shield className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold mb-6"
          >
            Privacy <span className="text-primary">Policy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Your privacy matters to us. This policy explains how we collect,
            use, and protect your information.
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

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <Card>
            <CardContent className="p-6 sm:p-8">
              <p className="text-muted-foreground leading-relaxed">
                Offloadr (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
                committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our platform. Please read this policy
                carefully. By using Offloadr, you consent to the practices
                described in this policy.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8 mb-12">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold">
                        {section.title}
                      </h2>
                    </div>
                    <div className="space-y-6">
                      {section.content.map((item, i) => (
                        <div key={i}>
                          <h3 className="font-semibold mb-2">
                            {item.subtitle}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                      ))}
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
                <h2 className="text-xl font-bold">Questions?</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our
                practices, please contact us:
              </p>
              <a
                href="mailto:adedireadedapo20@gmail.com?subject=Privacy%20Policy%20Inquiry"
                className="text-primary hover:underline"
              >
                adedireadedapo20@gmail.com
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
