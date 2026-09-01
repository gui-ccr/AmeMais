const WHATSAPP_NUMBER = "5533999990000";
export const WHATSAPP_DISPLAY = "(33) 9 9999-0000";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
