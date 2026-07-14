import { BookingForm } from "@/components/booking-form";
import { SectionHeading } from "@/components/section-heading";

/** Секция бронирования стола: готовая форма BookingForm + подпись. */
export function BookingSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading pre="БРОНИРОВАНИЕ" accent="СТОЛА" />
      <div className="mx-auto max-w-2xl">
        <BookingForm />
        <p className="mt-4 text-center text-sm text-muted">
          Мы свяжемся с вами для подтверждения брони
        </p>
      </div>
    </section>
  );
}
