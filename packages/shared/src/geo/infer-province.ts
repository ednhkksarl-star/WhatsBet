/** Infère une province RDC (ISO 3166-2:CD) depuis un numéro +243… */
export function inferProvinceFromPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("243") && digits.length >= 9) return null;
  const local = digits.startsWith("243") ? digits.slice(3) : digits;

  // Kinshasa — préfixes courants 81, 82, 84, 85, 89, 90, 91, 99
  if (/^(81|82|84|85|89|90|91|99)/.test(local)) return "CD-KN";

  // Nord-Kivu — Goma 99x parfois chevauche ; 97, 83 zones Est
  if (/^(97|83)/.test(local)) return "CD-NK";

  // Sud-Kivu — Bukavu 99, 97
  if (/^(992|993|994)/.test(local)) return "CD-SK";

  // Lubumbashi / Haut-Katanga
  if (/^(97[6-9]|98[0-5])/.test(local)) return "CD-HK";

  // Matadi / Kongo-Central
  if (/^(8[67]0|870)/.test(local)) return "CD-BC";

  return null;
}
