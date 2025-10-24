import { Hero } from "@/components/ui/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Testimonials } from "@/components/testimonials";
import { FAQ } from "@/components/faq";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Testimonials />
      <FAQ />
    </>
  );
}
