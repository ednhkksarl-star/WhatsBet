export interface RdcProvinceRef {
  id: string;
  name: string;
}

/** Provinces RDC (ISO 3166-2:CD) — ordre stable pour menus WhatsApp */
export const RDC_PROVINCES: RdcProvinceRef[] = [
  { id: "CD-BC", name: "Kongo-Central" },
  { id: "CD-BU", name: "Bas-Uélé" },
  { id: "CD-EQ", name: "Équateur" },
  { id: "CD-HK", name: "Haut-Katanga" },
  { id: "CD-HL", name: "Haut-Lomami" },
  { id: "CD-HU", name: "Haut-Uélé" },
  { id: "CD-IT", name: "Ituri" },
  { id: "CD-KG", name: "Kwango" },
  { id: "CD-KN", name: "Kinshasa" },
  { id: "CD-KO", name: "Kasaï-Oriental" },
  { id: "CD-KS", name: "Kasaï" },
  { id: "CD-KU", name: "Kwilu" },
  { id: "CD-LB", name: "Lualaba" },
  { id: "CD-LL", name: "Kasaï-Central" },
  { id: "CD-LM", name: "Lomami" },
  { id: "CD-MA", name: "Mai-Ndombe" },
  { id: "CD-MN", name: "Maniema" },
  { id: "CD-MO", name: "Mongala" },
  { id: "CD-NK", name: "Nord-Kivu" },
  { id: "CD-NU", name: "Nord-Ubangi" },
  { id: "CD-SK", name: "Sud-Kivu" },
  { id: "CD-SN", name: "Sankuru" },
  { id: "CD-SU", name: "Sud-Ubangi" },
  { id: "CD-TG", name: "Tanganyika" },
  { id: "CD-TO", name: "Tshopo" },
  { id: "CD-TP", name: "Tshuapa" },
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getProvinceById(id: string): RdcProvinceRef | undefined {
  return RDC_PROVINCES.find((p) => p.id === id);
}

export function parseProvinceChoice(input: string): RdcProvinceRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const num = parseInt(trimmed, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= RDC_PROVINCES.length) {
    return RDC_PROVINCES[num - 1];
  }

  const norm = normalizeText(trimmed);
  const byId = RDC_PROVINCES.find((p) => normalizeText(p.id) === norm);
  if (byId) return byId;

  const byExactName = RDC_PROVINCES.find((p) => normalizeText(p.name) === norm);
  if (byExactName) return byExactName;

  if (norm.length >= 3) {
    const byPartial = RDC_PROVINCES.find(
      (p) => normalizeText(p.name).includes(norm) || norm.includes(normalizeText(p.name))
    );
    if (byPartial) return byPartial;
  }

  return null;
}

export function formatProvinceMenu(): string {
  return RDC_PROVINCES.map((p, i) => `*${i + 1}.* ${p.name}`).join("\n");
}

export function validateCityName(input: string): string | null {
  const city = input.trim().replace(/\s+/g, " ");
  if (city.length < 2 || city.length > 100) return null;
  if (/^\d+$/.test(city)) return null;
  return city;
}
