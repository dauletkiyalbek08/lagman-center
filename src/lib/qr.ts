"use client";

import QRCode from "qrcode";

/**
 * Ссылка, зашитая в QR-код на столе. Берём текущий домен, чтобы одни и те же
 * коды работали и на боевом сайте, и локально при проверке.
 */
export function tableQrUrl(code: string): string {
  const origin =
    typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/t/${code}`;
}

/** PNG-картинка QR-кода стола (data-URL) — для показа, скачивания и печати. */
export function tableQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(tableQrUrl(code), {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0f0f10", light: "#ffffff" },
  });
}
