"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Mail, CheckCircle2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resentCount, setResentCount] = useState(0)

  async function handleResendEmail() {
    if (resentCount >= 3) {
      toast.error("Maximum resend attempts reached. Please try again later.")
      return
    }

    setIsResending(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setResentCount(resentCount + 1)
    toast.success("Verification email sent! Check your inbox.")
    setIsResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="rounded-full bg-primary/10 p-4">
                <Mail className="h-12 w-12 text-primary" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification link to your email address. Click the link to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">What&apos;s next?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Check your inbox (and spam folder)</li>
                    <li>• Click the verification link</li>
                    <li>• Start buying and selling!</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email?
              </p>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isResending || resentCount >= 3}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </Button>
              {resentCount > 0 && resentCount < 3 && (
                <p className="text-xs text-muted-foreground">
                  {3 - resentCount} {3 - resentCount === 1 ? "attempt" : "attempts"} remaining
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
