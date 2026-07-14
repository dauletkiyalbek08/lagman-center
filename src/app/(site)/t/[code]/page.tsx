import { TableGate } from "@/components/table/table-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Меню за столом",
  description: "Меню Lagman Center. Закажите прямо со стола — без официанта.",
  robots: { index: false, follow: false },
};

/**
 * Адрес из QR-кода на столе: /t/<code>.
 * Код запоминается в браузере гостя, после чего он попадает в меню и
 * заказывает без регистрации — заказ уходит на кухню с номером стола.
 */
export default async function TablePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <TableGate code={code} />;
}
