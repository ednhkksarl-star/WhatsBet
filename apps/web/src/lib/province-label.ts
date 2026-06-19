import { RDC_PROVINCES } from "@/data/rdc-provinces";

export function provinceLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return RDC_PROVINCES.find((p) => p.id === id)?.name ?? id;
}

export const PROVINCE_OPTIONS = RDC_PROVINCES.map((p) => ({ id: p.id, name: p.name }));
