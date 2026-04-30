const conditionOptions = [
  { value: "New", label: { en: "New", km: "ថ្មី" } },
  { value: "Used", label: { en: "Used", km: "ប្រើរួច" } },
  { value: "Refurbished", label: { en: "Refurbished", km: "កែលម្អឡើងវិញ" } },
]

const field = (id, type, en, km, extra = {}) => ({
  id,
  type,
  label: { en, km },
  ...extra,
})

const option = (value, en, km) => ({
  value,
  label: { en, km },
})

const carBrands = [
  "Toyota",
  "Honda",
  "Lexus",
  "Hyundai",
  "Kia",
  "Mazda",
  "Nissan",
  "Ford",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Mitsubishi",
  "Suzuki",
  "Isuzu",
  "Chevrolet",
  "Jeep",
  "Land Rover",
  "Porsche",
  "Tesla",
  "BYD",
  "MG",
  "Peugeot",
  "Subaru",
  "Daihatsu",
  "Haval",
  "Changan",
  "Geely",
  "GAC",
  "Great Wall",
]

const cars = [
  field("make", "select", "Make", "ម៉ាក", { required: true, options: carBrands }),
  field("model", "text", "Model", "ម៉ូដែល", { required: true }),
  field("year", "number", "Year", "ឆ្នាំ", { required: true, min: 1990, max: 2026 }),
  field("bodyType", "select", "Body Type", "ប្រភេទតួរថយន្ត", {
    options: [
      option("sedan", "Sedan", "សេដង់"),
      option("suv", "SUV", "SUV"),
      option("pickup", "Pickup", "ភីកអាប់"),
      option("van", "Van", "វ៉ាន់"),
      option("hatchback", "Hatchback", "ហាតប៊ែក"),
      option("minivan", "Minivan", "មីនីវ៉ាន់"),
      option("coupe", "Coupe", "គូប"),
      option("convertible", "Convertible", "បើកដំបូល"),
    ],
  }),
  field("fuel", "select", "Fuel", "ប្រេង", { required: true, options: ["Petrol", "Diesel", "Electric", "Hybrid"] }),
  field("transmission", "select", "Transmission", "ប្រអប់លេខ", { required: true, options: ["Auto", "Manual"] }),
  field("mileage", "number", "Mileage", "ចម្ងាយ", { min: 0, max: 1000000 }),
  field("condition", "select", "Condition", "ស្ថានភាព", { required: true, options: conditionOptions }),
  field("color", "text", "Color", "ពណ៌"),
  field("doors", "select", "Doors", "ទ្វារ", {
    options: [
      option("2", "2", "២"),
      option("3", "3", "៣"),
      option("4", "4", "៤"),
      option("5+", "5+", "៥+"),
    ],
  }),
  field("description", "textarea", "Description", "ពិពណ៌នា", { required: true }),
]

const phones = [
  field("brand", "select", "Brand", "ម៉ាក", {
    required: true,
    options: ["Apple", "Samsung", "Huawei", "Oppo", "Vivo", "Xiaomi", "Realme", "OnePlus", "Google", "Honor"],
  }),
  field("model", "text", "Model", "ម៉ូដែល", { required: true }),
  field("storage", "select", "Storage", "ទំហំផ្ទុក", { options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] }),
  field("ram", "select", "RAM", "RAM", { options: ["3GB", "4GB", "6GB", "8GB", "12GB", "16GB"] }),
  field("color", "text", "Color", "ពណ៌"),
  field("condition", "select", "Condition", "ស្ថានភាព", { required: true, options: conditionOptions }),
  field("description", "textarea", "Description", "ពិពណ៌នា", { required: true }),
]

const property = [
  field("type", "select", "Type", "ប្រភេទ", { required: true, options: ["Apartment", "Villa", "Land", "Shophouse", "Office", "Condo"] }),
  field("bedrooms", "select", "Bedrooms", "បន្ទប់គេង", { options: ["1", "2", "3", "4", "5+"] }),
  field("bathrooms", "select", "Bathrooms", "បន្ទប់ទឹក", { options: ["1", "2", "3", "4+"] }),
  field("size_sqm", "number", "Size sqm", "ទំហំ ម៉ែត្រការ៉េ", { min: 1, max: 100000 }),
  field("floor", "number", "Floor", "ជាន់", { min: 0, max: 80 }),
  field("furnishing", "select", "Furnishing", "គ្រឿងសម្ភារៈ", {
    options: [
      option("furnished", "Furnished", "មានគ្រឿងសង្ហារិម"),
      option("semi-furnished", "Semi-Furnished", "មានគ្រឿងសង្ហារិមខ្លះ"),
      option("unfurnished", "Unfurnished", "គ្មានគ្រឿងសង្ហារិម"),
    ],
  }),
  field("furnished", "boolean", "Furnished", "មានគ្រឿងសង្ហារិម"),
  field("description", "textarea", "Description", "ពិពណ៌នា", { required: true }),
]

const jobs = [
  field("title", "text", "Title", "ចំណងជើង", { required: true }),
  field("company", "text", "Company", "ក្រុមហ៊ុន", { required: true }),
  field("type", "select", "Type", "ប្រភេទ", { options: ["Full-time", "Part-time", "Freelance", "Internship"] }),
  field("salaryMin", "number", "Salary Min", "ប្រាក់ខែអប្បបរមា", { min: 0, max: 100000 }),
  field("salaryMax", "number", "Salary Max", "ប្រាក់ខែអតិបរមា", { min: 0, max: 100000 }),
  field("experience", "select", "Experience", "បទពិសោធន៍", { options: ["Entry", "Mid", "Senior"] }),
  field("description", "textarea", "Description", "ពិពណ៌នា", { required: true }),
]

const defaultFields = [
  field("title", "text", "Title", "ចំណងជើង", { required: true }),
  field("condition", "select", "Condition", "ស្ថានភាព", { options: conditionOptions }),
  field("description", "textarea", "Description", "ពិពណ៌នា", { required: true }),
]

export const CATEGORY_FORMS = {
  cars,
  smartphones: phones,
  rent: property,
  sale: property,
  commercial: property,
  land: property,
  "full-time": jobs,
  "part-time": jobs,
  freelance: jobs,
  internship: jobs,
  default: defaultFields,
}

export function getCategoryForm(subcategoryId) {
  return CATEGORY_FORMS[subcategoryId] || CATEGORY_FORMS.default
}
