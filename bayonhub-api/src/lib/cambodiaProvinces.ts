export const CAMBODIA_PROVINCE_NAMES = [
  "Phnom Penh",
  "Siem Reap",
  "Sihanoukville",
  "Battambang",
  "Kampong Cham",
  "Kampong Chhnang",
  "Kampong Speu",
  "Kampong Thom",
  "Kampot",
  "Kandal",
  "Kep",
  "Koh Kong",
  "Kratié",
  "Mondulkiri",
  "Oddar Meanchey",
  "Pailin",
  "Preah Sihanouk",
  "Preah Vihear",
  "Prey Veng",
  "Pursat",
  "Ratanakiri",
  "Stung Treng",
  "Svay Rieng",
  "Takéo",
  "Tboung Khmum",
] as const

export const CAMBODIA_PROVINCE_SLUGS = new Map(
  CAMBODIA_PROVINCE_NAMES.map((name) => [
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name,
  ]),
)

export function isValidCambodiaProvince(value: string): boolean {
  return CAMBODIA_PROVINCE_NAMES.includes(value as typeof CAMBODIA_PROVINCE_NAMES[number])
}

export function normalizeProvinceFilter(value?: string): string | undefined {
  if (!value) return value
  if (!value.includes("-")) return value
  return CAMBODIA_PROVINCE_SLUGS.get(value) ?? value
}
