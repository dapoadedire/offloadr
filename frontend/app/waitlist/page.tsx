import { WaitlistForm } from "@/components/waitlist-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WaitlistPage() {
  return (
    <div className="font-mono min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Join the Waitlist
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Be among the first to experience Offloadr
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Early Access</CardTitle>
            <CardDescription>
              Sign up now and we&apos;ll notify you when we launch. No spam, we
              promise!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WaitlistForm />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          By joining, you agree to receive updates about Offloadr.
        </p>
      </div>
    </div>
  );
}
