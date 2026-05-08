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

export const cars = [
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

export const phones = [
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

export const property = [
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

export const jobs = [
  field("title", "text", "Title", "ចំណងជើង", { required: true }),
  field("company", "text", "Company", "ក្រុមហ៊ុន", { required: true }),
  field("type", "select", "Type", "ប្រភេទ", { options: ["Full-time", "Part-time", "Freelance", "Internship"] }),
  field("salaryMin", "number", "Salary Min", "ប្រាក់ខែអប្បបរមា", { min: 0, max: 100000 }),
  field("salaryMax", "number", "Salary Max", "ប្រាក់ខែអតិបរមា", { min: 0, max: 100000 }),
  field("experience", "select", "Experience", "បទពិសោធន៍", { options: ["Entry", "Mid", "Senior"] }),
  field("description", "textarea", "Description", "ពិពណ៌នា", { required: true }),
]

export const defaultFields = [
  field("title", "text", "Title", "ចំណងជើង", { required: true }),
  field("condition", "select", "Condition", "ស្ថានភាព", { options: conditionOptions }),
  field("description", "textarea", "Description", "ពិពណ៌នា", { required: true }),
]

export const CATEGORY_FORMS = {
  cars: {
    id: "cars",
    label: { en: "Cars", km: "រថយន្ត" },
    icon: "Car",
    required: ["make", "model", "year", "price", "condition", "fuel", "transmission", "location"],
    optional: ["mileage", "bodyType", "color"],
    fields: {
      make: { type: "select", label: { en: "Make", km: "ម៉ាក" }, options: carBrands },
      model: { type: "text", label: { en: "Model", km: "ម៉ូដែល" } },
      year: { type: "number", label: { en: "Year", km: "ឆ្នាំ" } },
      mileage: { type: "number", label: { en: "Mileage", km: "ចម្ងាយ" } },
      price: { type: "number", label: { en: "Price", km: "តម្លៃ" } },
      fuel: { type: "select", label: { en: "Fuel", km: "ប្រេង" }, options: ["Petrol", "Diesel", "Electric", "Hybrid"] },
      transmission: { type: "select", label: { en: "Transmission", km: "ប្រអប់លេខ" }, options: ["Auto", "Manual"] },
      condition: { type: "select", label: { en: "Condition", km: "ស្ថានភាព" }, options: conditionOptions },
      location: { type: "text", label: { en: "Location", km: "ទីតាំង" } },
      bodyType: { type: "select", label: { en: "Body Type", km: "ប្រភេទតួរថយន្ត" }, options: [
        { value: "sedan", label: { en: "Sedan", km: "សេដង់" } },
        { value: "suv", label: { en: "SUV", km: "SUV" } },
        { value: "pickup", label: { en: "Pickup", km: "ភីកអាប់" } },
        { value: "van", label: { en: "Van", km: "វ៉ាន់" } },
        { value: "hatchback", label: { en: "Hatchback", km: "ហាតប៊ែក" } },
        { value: "minivan", label: { en: "Minivan", km: "មីនីវ៉ាន់" } },
        { value: "coupe", label: { en: "Coupe", km: "គូប" } },
        { value: "convertible", label: { en: "Convertible", km: "បើកដំបូល" } }
      ] },
      color: { type: "text", label: { en: "Color", km: "ពណ៌" } }
    }
  },
  property_rent: {
    id: "property_rent",
    label: { en: "Property Rent", km: "ជួលអចលនទ្រព្យ" },
    icon: "Home",
    required: ["type", "pricePerMonth", "location"],
    optional: ["bedrooms", "bathrooms", "furnishing", "availableDate"],
    fields: {
      type: { type: "select", label: { en: "Type", km: "ប្រភេទ" }, options: ["Apartment", "Villa", "Land", "Shophouse", "Office", "Condo"] },
      bedrooms: { type: "select", label: { en: "Bedrooms", km: "បន្ទប់គេង" }, options: ["1", "2", "3", "4", "5+"] },
      bathrooms: { type: "select", label: { en: "Bathrooms", km: "បន្ទប់ទឹក" }, options: ["1", "2", "3", "4+"] },
      pricePerMonth: { type: "number", label: { en: "Price Per Month", km: "តម្លៃក្នុងមួយខែ" } },
      furnishing: { type: "select", label: { en: "Furnishing", km: "គ្រឿងសម្ភារៈ" }, options: [
        { value: "furnished", label: { en: "Furnished", km: "មានគ្រឿងសង្ហារិម" } },
        { value: "semi-furnished", label: { en: "Semi-Furnished", km: "មានគ្រឿងសង្ហារិមខ្លះ" } },
        { value: "unfurnished", label: { en: "Unfurnished", km: "គ្មានគ្រឿងសង្ហារិម" } }
      ] },
      location: { type: "text", label: { en: "Location", km: "ទីតាំង" } },
      availableDate: { type: "date", label: { en: "Available Date", km: "ថ្ងៃអាចចូលនៅ" } }
    }
  },
  property_sale: {
    id: "property_sale",
    label: { en: "Property Sale", km: "លក់អចលនទ្រព្យ" },
    icon: "Home",
    required: ["type", "price", "location"],
    optional: ["bedrooms", "bathrooms", "landSize", "builtArea"],
    fields: {
      type: { type: "select", label: { en: "Type", km: "ប្រភេទ" }, options: ["Apartment", "Villa", "Land", "Shophouse", "Office", "Condo"] },
      price: { type: "number", label: { en: "Price", km: "តម្លៃ" } },
      location: { type: "text", label: { en: "Location", km: "ទីតាំង" } },
      bedrooms: { type: "select", label: { en: "Bedrooms", km: "បន្ទប់គេង" }, options: ["1", "2", "3", "4", "5+"] },
      bathrooms: { type: "select", label: { en: "Bathrooms", km: "បន្ទប់ទឹក" }, options: ["1", "2", "3", "4+"] },
      landSize: { type: "number", label: { en: "Land Size (sqm)", km: "ទំហំដី" } },
      builtArea: { type: "number", label: { en: "Built Area (sqm)", km: "ទំហំផ្ទះ" } }
    }
  },
  phones: {
    id: "phones",
    label: { en: "Phones", km: "ទូរស័ព្ទ" },
    icon: "Smartphone",
    required: ["brand", "model", "condition", "price", "location"],
    optional: ["storage", "ram"],
    fields: {
      brand: { type: "select", label: { en: "Brand", km: "ម៉ាក" }, options: ["Apple", "Samsung", "Huawei", "Oppo", "Vivo", "Xiaomi", "Realme", "OnePlus", "Google", "Honor"] },
      model: { type: "text", label: { en: "Model", km: "ម៉ូដែល" } },
      storage: { type: "select", label: { en: "Storage", km: "ទំហំផ្ទុក" }, options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
      ram: { type: "select", label: { en: "RAM", km: "RAM" }, options: ["3GB", "4GB", "6GB", "8GB", "12GB", "16GB"] },
      condition: { type: "select", label: { en: "Condition", km: "ស្ថានភាព" }, options: conditionOptions },
      price: { type: "number", label: { en: "Price", km: "តម្លៃ" } },
      location: { type: "text", label: { en: "Location", km: "ទីតាំង" } }
    }
  },
  jobs: {
    id: "jobs",
    label: { en: "Jobs", km: "ការងារ" },
    icon: "BriefcaseBusiness",
    required: ["jobType", "jobCategory", "location"],
    optional: ["salaryMin", "salaryMax", "experience"],
    fields: {
      jobType: { type: "select", label: { en: "Job Type", km: "ប្រភេទការងារ" }, options: ["Full-time", "Part-time", "Freelance", "Internship"] },
      jobCategory: { type: "text", label: { en: "Category", km: "ប្រភេទការងារ" } },
      salaryMin: { type: "number", label: { en: "Salary Min", km: "ប្រាក់ខែអប្បបរមា" } },
      salaryMax: { type: "number", label: { en: "Salary Max", km: "ប្រាក់ខែអតិបរមា" } },
      experience: { type: "select", label: { en: "Experience", km: "បទពិសោធន៍" }, options: ["Entry", "Mid", "Senior"] },
      location: { type: "text", label: { en: "Location", km: "ទីតាំង" } }
    }
  }
}

export function getFormSchema(categoryId) {
  return CATEGORY_FORMS[categoryId] || null
}

export function getRequiredFields(categoryId) {
  return CATEGORY_FORMS[categoryId]?.required || []
}

export function getOptionalFields(categoryId) {
  return CATEGORY_FORMS[categoryId]?.optional || []
}

// eslint-disable-next-line no-unused-vars
export function getCategoryForm(subcategoryId) {
  return defaultFields
}
