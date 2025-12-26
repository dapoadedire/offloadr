"use client";

import { motion } from "motion/react";
import {
  Shield,
  MapPin,
  Users,
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const safetyTips = [
  {
    icon: MapPin,
    title: "Meet in Public Places",
    description:
      "Always meet in well-lit, public areas on campus. Libraries, student centers, and cafeterias are great options.",
    do: ["Meet in busy areas", "Choose familiar locations", "Stay on campus"],
    dont: [
      "Meet at private residences",
      "Go to isolated areas",
      "Meet off-campus with strangers",
    ],
  },
  {
    icon: Clock,
    title: "Meet During Daytime",
    description:
      "Schedule meetups during daylight hours when there are more people around.",
    do: [
      "Schedule during business hours",
      "Choose well-lit spots",
      "Allow extra time",
    ],
    dont: [
      "Meet late at night",
      "Rush the transaction",
      "Ignore your schedule",
    ],
  },
  {
    icon: Users,
    title: "Bring a Friend",
    description:
      "When possible, bring a friend or let someone know where you'll be and when.",
    do: [
      "Tell a friend your plans",
      "Share your location",
      "Have someone wait nearby",
    ],
    dont: [
      "Go alone to unfamiliar places",
      "Keep plans secret",
      "Ignore safety instincts",
    ],
  },
  {
    icon: Eye,
    title: "Inspect Before Paying",
    description:
      "Always examine items carefully before completing the transaction.",
    do: ["Test electronics", "Check for damage", "Verify authenticity"],
    dont: ["Pay without inspecting", "Accept broken items", "Skip testing"],
  },
  {
    icon: Phone,
    title: "Use Campus Resources",
    description: "Know your campus security number and nearby safe zones.",
    do: [
      "Save campus security number",
      "Know emergency exits",
      "Use campus escort services",
    ],
    dont: [
      "Ignore available resources",
      "Hesitate to call for help",
      "Wander alone at night",
    ],
  },
  {
    icon: MessageSquare,
    title: "Keep Communication on Platform",
    description:
      "Use Offloadr messaging to keep a record of your conversations.",
    do: [
      "Message through the app",
      "Save important details",
      "Document agreements",
    ],
    dont: [
      "Share personal info early",
      "Use untraceable methods",
      "Delete conversations",
    ],
  },
];

const emergencyContacts = [
  { name: "Campus Security", note: "Check your university website" },
  { name: "Local Police", note: "911 (USA) or local emergency number" },
  { name: "Report to Offloadr", note: "adedireadedapo20@gmail.com" },
];

export default function SafetyPage() {
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
            Safety <span className="text-primary">Guidelines</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Your safety is our priority. Follow these guidelines to ensure safe
            and successful transactions on campus.
          </motion.p>
        </div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Trust Your Instincts</h3>
                  <p className="text-muted-foreground">
                    If something feels off about a transaction or a
                    buyer/seller, trust your gut. It&apos;s always better to
                    cancel a deal than to put yourself in an uncomfortable
                    situation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Safety Tips */}
        <div className="space-y-8 mb-16">
          {safetyTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          {tip.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {tip.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-green-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-semibold text-green-500">
                            Do
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {tip.do.map((item, i) => (
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
                          {tip.dont.map((item, i) => (
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

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">
                Emergency <span className="text-primary">Contacts</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                If you ever feel unsafe or need assistance, don&apos;t hesitate
                to reach out:
              </p>
              <div className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {contact.note}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
