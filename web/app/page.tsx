import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { LiveMarkets } from "@/components/LiveMarkets";
import { Features } from "@/components/Features";
import { CodeExample } from "@/components/CodeExample";
import { ForAgents } from "@/components/ForAgents";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <LiveMarkets />
        <Features />
        <CodeExample />
        <ForAgents />
      </main>
      <Footer />
    </>
  );
}
