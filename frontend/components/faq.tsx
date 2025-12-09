"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is Offloadr free to use?",
    answer:
      "Yes! Offloadr is completely free for students. No listing fees, no transaction fees. Just list your items and start selling.",
  },
  {
    question: "How do I verify I'm a student?",
    answer:
      "During signup, you'll provide your school email address. We'll send a verification link to confirm you're a student at your campus.",
  },
  {
    question: "Is it safe to meet buyers on campus?",
    answer:
      "Yes! We recommend meeting in public campus locations like libraries, cafeterias, or student centers. All users are verified students from your campus.",
  },
  {
    question: "How do payments work?",
    answer:
      "Offloadr doesn't handle payments directly. You arrange payment (cash, mobile money, bank transfer) directly with the buyer when you meet on campus.",
  },
  {
    question: "What can I sell on Offloadr?",
    answer:
      "You can sell textbooks, electronics, furniture, appliances, clothing, and more. Just make sure items comply with campus policies and our community guidelines.",
  },
  {
    question: "What if a buyer doesn't show up?",
    answer:
      "You can report no-shows through the platform. We track user reliability and may suspend accounts with repeated issues.",
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 font-mono"
    >
      <div className="text-center mb-12 sm:mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-mono"
        >
          Frequently Asked <span className="text-primary">Questions</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Everything you need to know about Offloadr
        </motion.p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-semibold pr-4 sm:pr-8 text-sm sm:text-base">
                {faq.question}
              </span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-primary shrink-0" />
              </motion.div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-6 pb-4 text-muted-foreground text-sm sm:text-base">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
