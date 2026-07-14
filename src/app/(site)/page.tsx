import { BookingSection } from "@/components/landing/booking-section";
import { DeliveryBanner } from "@/components/landing/delivery-banner";
import { Establishments } from "@/components/landing/establishments";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { PopularDishes } from "@/components/landing/popular-dishes";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Establishments />
      <PopularDishes />
      <DeliveryBanner />
      <BookingSection />
    </>
  );
}
