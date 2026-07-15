import { BookingSection } from "@/components/landing/booking-section";
import { DeliveryBanner } from "@/components/landing/delivery-banner";
import { Establishments } from "@/components/landing/establishments";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { PopularDishes } from "@/components/landing/popular-dishes";
import { PromoBanner } from "@/components/landing/promo-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PromoBanner />
      <Features />
      <Establishments />
      <PopularDishes />
      <DeliveryBanner />
      <BookingSection />
    </>
  );
}
