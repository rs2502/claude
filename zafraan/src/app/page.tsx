import { Hero } from "@/components/sections/Hero";
import { Story } from "@/components/sections/Story";
import { Pasta } from "@/components/sections/Pasta";
import { Ingredients } from "@/components/sections/Ingredients";
import { Craft } from "@/components/sections/Craft";
import { Sauces } from "@/components/sections/Sauces";
import { Dining } from "@/components/sections/Dining";
import { Reservation } from "@/components/sections/Reservation";
import { Footer } from "@/components/chrome/Footer";

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <Story />
        <Pasta />
        <Ingredients />
        <Craft />
        <Sauces />
        <Dining />
        <Reservation />
      </main>
      <Footer />
    </>
  );
}
