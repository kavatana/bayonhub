const province = (id, slug, en, km) => ({ id, slug, label: { en, km } })

export const PROVINCES = [
  province("phnom-penh", "phnom-penh", "Phnom Penh", "ភ្នំពេញ"),
  province("siem-reap", "siem-reap", "Siem Reap", "សៀមរាប"),
  province("sihanoukville", "sihanoukville", "Sihanoukville", "ក្រុងព្រះសីហនុ"),
  province("battambang", "battambang", "Battambang", "បាត់ដំបង"),
  province("kampong-cham", "kampong-cham", "Kampong Cham", "កំពង់ចាម"),
  province("kampong-chhnang", "kampong-chhnang", "Kampong Chhnang", "កំពង់ឆ្នាំង"),
  province("kampong-speu", "kampong-speu", "Kampong Speu", "កំពង់ស្ពឺ"),
  province("kampong-thom", "kampong-thom", "Kampong Thom", "កំពង់ធំ"),
  province("kampot", "kampot", "Kampot", "កំពត"),
  province("kandal", "kandal", "Kandal", "កណ្តាល"),
  province("kep", "kep", "Kep", "កែប"),
  province("koh-kong", "koh-kong", "Koh Kong", "កោះកុង"),
  province("kratie", "kratie", "Kratié", "ក្រចេះ"),
  province("mondulkiri", "mondulkiri", "Mondulkiri", "មណ្ឌលគិរី"),
  province("oddar-meanchey", "oddar-meanchey", "Oddar Meanchey", "ឧត្តរមានជ័យ"),
  province("pailin", "pailin", "Pailin", "ប៉ៃលិន"),
  province("preah-sihanouk", "preah-sihanouk", "Preah Sihanouk", "ព្រះសីហនុ"),
  province("preah-vihear", "preah-vihear", "Preah Vihear", "ព្រះវិហារ"),
  province("prey-veng", "prey-veng", "Prey Veng", "ព្រៃវែង"),
  province("pursat", "pursat", "Pursat", "ពោធិ៍សាត់"),
  province("ratanakiri", "ratanakiri", "Ratanakiri", "រតនគិរី"),
  province("stung-treng", "stung-treng", "Stung Treng", "ស្ទឹងត្រែង"),
  province("svay-rieng", "svay-rieng", "Svay Rieng", "ស្វាយរៀង"),
  province("takeo", "takeo", "Takéo", "តាកែវ"),
  province("tboung-khmum", "tboung-khmum", "Tboung Khmum", "ត្បូងឃ្មុំ"),
]

export const PHNOM_PENH_DISTRICTS = [
  province("bkk1", "bkk1", "BKK1", "បឹងកេងកង ១"),
  province("bkk2", "bkk2", "BKK2", "បឹងកេងកង ២"),
  province("toul-kork", "toul-kork", "Toul Kork", "ទួលគោក"),
  province("sen-sok", "sen-sok", "Sen Sok", "សែនសុខ"),
  province("chamkarmon", "chamkarmon", "Chamkarmon", "ចំការមន"),
  province("daun-penh", "daun-penh", "Daun Penh", "ដូនពេញ"),
  province("7-makara", "7-makara", "7 Makara", "៧ មករា"),
  province("meanchey", "meanchey", "Meanchey", "មានជ័យ"),
  province("russey-keo", "russey-keo", "Russey Keo", "ឫស្សីកែវ"),
  province("por-sen-chey", "por-sen-chey", "Por Sen Chey", "ពោធិ៍សែនជ័យ"),
]

const district = province

export const DISTRICTS_BY_PROVINCE = {
  "phnom-penh": PHNOM_PENH_DISTRICTS,
  "siem-reap": [
    district("svay-dangkum", "svay-dangkum", "Svay Dangkum", "ស្វាយដង្គំ"),
    district("sala-kamreuk", "sala-kamreuk", "Sala Kamreuk", "សាលាកំរើក"),
    district("chreav", "chreav", "Chreav", "ជ្រាវ"),
  ],
  "battambang": [
    district("city-center", "city-center", "City Center", "កណ្ដាលក្រុង"),
    district("svay-por", "svay-por", "Svay Por", "ស្វាយប៉ោ"),
    district("ratanak", "ratanak", "Ratanak", "រតនៈ"),
  ],
  "kandal": [
    district("ta-khmao", "ta-khmao", "Ta Khmao", "តាខ្មៅ"),
    district("sa-ang", "sa-ang", "Sa Ang", "ស្អាង"),
    district("khsach-kandal", "khsach-kandal", "Khsach Kandal", "ខ្សាច់កណ្តាល"),
  ],
  "preah-sihanouk": [
    district("ochheuteal", "ochheuteal", "Ochheuteal", "អូរឈើទាល"),
    district("buon", "buon", "Commune 4", "សង្កាត់ ៤"),
    district("prey-nob", "prey-nob", "Prey Nob", "ព្រៃនប់"),
  ],
}

export function getDistrictsForProvince(provinceSlug) {
  return DISTRICTS_BY_PROVINCE[provinceSlug] || [
    district(`${provinceSlug || "province"}-central`, `${provinceSlug || "province"}-central`, "Central", "កណ្ដាល"),
    district(`${provinceSlug || "province"}-north`, `${provinceSlug || "province"}-north`, "North", "ខាងជើង"),
    district(`${provinceSlug || "province"}-south`, `${provinceSlug || "province"}-south`, "South", "ខាងត្បូង"),
  ]
}
