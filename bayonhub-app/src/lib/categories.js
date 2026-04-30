const option = (value, en, km) => ({
  value,
  label: { en, km },
})

const carFacets = [
  { id: "make", type: "string", label: { en: "Make", km: "ម៉ាក" } },
  { id: "model", type: "string", label: { en: "Model", km: "ម៉ូដែល" } },
  { id: "year", type: "number-range", label: { en: "Year", km: "ឆ្នាំ" } },
  {
    id: "bodyType",
    type: "select",
    label: { en: "Body Type", km: "ប្រភេទតួរថយន្ត" },
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
  },
  {
    id: "fuel",
    type: "select",
    label: { en: "Fuel", km: "ប្រេង" },
    options: ["petrol", "diesel", "electric", "hybrid"],
  },
  {
    id: "transmission",
    type: "select",
    label: { en: "Transmission", km: "ប្រអប់លេខ" },
    options: ["auto", "manual"],
  },
  { id: "mileage", type: "number-range", label: { en: "Mileage", km: "ចម្ងាយ" } },
  { id: "color", type: "string", label: { en: "Color", km: "ពណ៌" } },
  {
    id: "doors",
    type: "select",
    label: { en: "Doors", km: "ទ្វារ" },
    options: [
      option("2", "2", "២"),
      option("3", "3", "៣"),
      option("4", "4", "៤"),
      option("5+", "5+", "៥+"),
    ],
  },
  {
    id: "condition",
    type: "select",
    label: { en: "Condition", km: "ស្ថានភាព" },
    options: ["new", "used"],
  },
]

const phoneFacets = [
  { id: "brand", type: "string", label: { en: "Brand", km: "ម៉ាក" } },
  {
    id: "storage",
    type: "select",
    label: { en: "Storage", km: "ទំហំផ្ទុក" },
    options: ["32GB", "64GB", "128GB", "256GB", "512GB"],
  },
  { id: "color", type: "string", label: { en: "Color", km: "ពណ៌" } },
  {
    id: "condition",
    type: "select",
    label: { en: "Condition", km: "ស្ថានភាព" },
    options: ["new", "used"],
  },
]

const propertyFacets = [
  {
    id: "type",
    type: "select",
    label: { en: "Type", km: "ប្រភេទ" },
    options: ["apartment", "villa", "land", "shophouse", "office", "condo"],
  },
  {
    id: "bedrooms",
    type: "select",
    label: { en: "Bedrooms", km: "បន្ទប់គេង" },
    options: ["1", "2", "3", "4", "5+"],
  },
  { id: "bathrooms", type: "number-range", label: { en: "Bathrooms", km: "បន្ទប់ទឹក" } },
  { id: "size_sqm", type: "number-range", label: { en: "Size sqm", km: "ទំហំ ម៉ែត្រការ៉េ" } },
  { id: "floor", type: "number", label: { en: "Floor", km: "ជាន់" } },
  {
    id: "furnishing",
    type: "select",
    label: { en: "Furnishing", km: "គ្រឿងសម្ភារៈ" },
    options: [
      option("furnished", "Furnished", "មានគ្រឿងសង្ហារិម"),
      option("semi-furnished", "Semi-Furnished", "មានគ្រឿងសង្ហារិមខ្លះ"),
      option("unfurnished", "Unfurnished", "គ្មានគ្រឿងសង្ហារិម"),
    ],
  },
  { id: "furnished", type: "boolean", label: { en: "Furnished", km: "មានគ្រឿងសង្ហារិម" } },
]

export const CAR_BRANDS = [
  { id: "toyota", label: "Toyota", color: "#EB0A1E" },
  { id: "honda", label: "Honda", color: "#CC0000" },
  { id: "hyundai", label: "Hyundai", color: "#002C5F" },
  { id: "kia", label: "Kia", color: "#BB162B" },
  { id: "mazda", label: "Mazda", color: "#1A1A1A" },
  { id: "ford", label: "Ford", color: "#003478" },
  { id: "bmw", label: "BMW", color: "#0066B1" },
  { id: "mercedes", label: "Mercedes", color: "#1A1A1A" },
  { id: "lexus", label: "Lexus", color: "#1A1A1A" },
  { id: "mitsubishi", label: "Mitsubishi", color: "#CC0000" },
  { id: "nissan", label: "Nissan", color: "#C3002F" },
  { id: "isuzu", label: "Isuzu", color: "#CC0000" },
  { id: "suzuki", label: "Suzuki", color: "#1A1A1A" },
  { id: "mg", label: "MG", color: "#C8102E" },
  { id: "byd", label: "BYD", color: "#1D4E9B" },
  { id: "other", label: "Other", color: "#6B7280" },
]

export const CAR_BODY_TYPES = [
  { id: "sedan", label: { en: "Sedan", km: "សេដង់" } },
  { id: "suv", label: { en: "SUV", km: "SUV" } },
  { id: "pickup", label: { en: "Pickup", km: "ពិកអាប់" } },
  { id: "hatchback", label: { en: "Hatchback", km: "ហេតបែក" } },
  { id: "van", label: { en: "Van / MPV", km: "វ៉ាន់" } },
  { id: "convertible", label: { en: "Convertible", km: "អាចបើកដំបូល" } },
  { id: "coupe", label: { en: "Coupe", km: "គូប" } },
  { id: "wagon", label: { en: "Station Wagon", km: "វ៉ាហ្គន" } },
]

const jobFacets = [
  {
    id: "type",
    type: "select",
    label: { en: "Job type", km: "ប្រភេទការងារ" },
    options: ["fulltime", "parttime", "freelance", "internship"],
  },
  { id: "salary_range", type: "number-range", label: { en: "Salary", km: "ប្រាក់ខែ" } },
  {
    id: "experience_level",
    type: "select",
    label: { en: "Experience", km: "បទពិសោធន៍" },
    options: ["entry", "mid", "senior"],
  },
]

const sub = (id, slug, en, km, facets = []) => ({
  id,
  slug,
  label: { en, km },
  facets,
})

export const CATEGORIES = [
  {
    id: "vehicles",
    slug: "vehicles",
    icon: "Car",
    label: { en: "Vehicles", km: "យានយន្ត" },
    subcategories: [
      sub("cars", "cars", "Cars", "រថយន្ត", carFacets),
      sub("motorbikes", "motorbikes", "Motorbikes", "ម៉ូតូ"),
      sub("trucks", "trucks", "Trucks", "ឡានដឹកទំនិញ"),
      sub("parts", "parts", "Parts", "គ្រឿងបន្លាស់"),
    ],
  },
  {
    id: "phones-tablets",
    slug: "phones-tablets",
    icon: "Smartphone",
    label: { en: "Phones & Tablets", km: "ទូរស័ព្ទ និងថេប្លេត" },
    subcategories: [
      sub("smartphones", "smartphones", "Smartphones", "ស្មាតហ្វូន", phoneFacets),
      sub("feature-phones", "feature-phones", "Feature Phones", "ទូរស័ព្ទធម្មតា"),
      sub("tablets", "tablets", "Tablets", "ថេប្លេត"),
      sub("accessories", "accessories", "Accessories", "គ្រឿងបន្ថែម"),
    ],
  },
  {
    id: "electronics",
    slug: "electronics",
    icon: "Tv",
    label: { en: "Electronics", km: "អេឡិចត្រូនិក" },
    subcategories: [
      sub("tvs", "tvs", "TVs", "ទូរទស្សន៍"),
      sub("audio", "audio", "Audio", "សំឡេង"),
      sub("cameras", "cameras", "Cameras", "កាមេរ៉ា"),
      sub("gaming", "gaming", "Gaming", "ហ្គេម"),
      sub("other-electronics", "other", "Other", "ផ្សេងៗ"),
    ],
  },
  {
    id: "house-land",
    slug: "house-land",
    icon: "Home",
    label: { en: "House & Land", km: "ផ្ទះ និងដី" },
    subcategories: [
      sub("rent", "rent", "Rent", "ជួល", propertyFacets),
      sub("sale", "sale", "Sale", "លក់", propertyFacets),
      sub("commercial", "commercial", "Commercial", "ពាណិជ្ជកម្ម", propertyFacets),
      sub("land", "land", "Land", "ដី", propertyFacets),
    ],
  },
  {
    id: "jobs",
    slug: "jobs",
    icon: "BriefcaseBusiness",
    label: { en: "Jobs", km: "ការងារ" },
    subcategories: [
      sub("full-time", "full-time", "Full-time", "ពេញម៉ោង", jobFacets),
      sub("part-time", "part-time", "Part-time", "ក្រៅម៉ោង", jobFacets),
      sub("freelance", "freelance", "Freelance", "ហ្វ្រីឡែន", jobFacets),
      sub("internship", "internship", "Internship", "កម្មសិក្សា", jobFacets),
    ],
  },
  {
    id: "services",
    slug: "services",
    icon: "Wrench",
    label: { en: "Services", km: "សេវាកម្ម" },
    subcategories: [
      sub("construction", "construction", "Construction", "សំណង់"),
      sub("beauty", "beauty", "Beauty", "សម្រស់"),
      sub("transport", "transport", "Transport", "ដឹកជញ្ជូន"),
      sub("repair", "repair", "Repair", "ជួសជុល"),
      sub("other-services", "other", "Other", "ផ្សេងៗ"),
    ],
  },
  {
    id: "fashion",
    slug: "fashion",
    icon: "Shirt",
    label: { en: "Fashion", km: "ម៉ូដ" },
    subcategories: [
      sub("clothing", "clothing", "Clothing", "សម្លៀកបំពាក់"),
      sub("shoes", "shoes", "Shoes", "ស្បែកជើង"),
      sub("bags", "bags", "Bags", "កាបូប"),
      sub("beauty", "beauty", "Beauty", "សម្រស់"),
      sub("jewellery", "jewellery", "Jewellery", "គ្រឿងអលង្ការ"),
    ],
  },
  {
    id: "furniture-home",
    slug: "furniture-home",
    icon: "Sofa",
    label: { en: "Furniture & Home", km: "គ្រឿងសង្ហារិម និងផ្ទះ" },
    subcategories: [
      sub("furniture", "furniture", "Furniture", "គ្រឿងសង្ហារិម"),
      sub("appliances", "appliances", "Appliances", "ឧបករណ៍ប្រើប្រាស់"),
      sub("garden", "garden", "Garden", "សួន"),
    ],
  },
  {
    id: "books-sports-hobbies",
    slug: "books-sports-hobbies",
    icon: "BookOpen",
    label: { en: "Books, Sports & Hobbies", km: "សៀវភៅ កីឡា និងចំណូលចិត្ត" },
    subcategories: [
      sub("books", "books", "Books", "សៀវភៅ"),
      sub("sports", "sports", "Sports", "កីឡា"),
      sub("musical-instruments", "musical-instruments", "Musical Instruments", "ឧបករណ៍តន្ត្រី"),
      sub("hobbies", "hobbies", "Hobbies", "ចំណូលចិត្ត"),
      sub("collectibles", "collectibles", "Collectibles", "របស់ប្រមូល"),
    ],
  },
  {
    id: "pets-animals",
    slug: "pets-animals",
    icon: "PawPrint",
    label: { en: "Pets & Animals", km: "សត្វចិញ្ចឹម" },
    subcategories: [
      sub("dogs", "dogs", "Dogs", "ឆ្កែ"),
      sub("cats", "cats", "Cats", "ឆ្មា"),
      sub("birds", "birds", "Birds", "បក្សី"),
      sub("fish", "fish", "Fish", "ត្រី"),
      sub("other-pets", "other", "Other", "ផ្សេងៗ"),
    ],
  },
  {
    id: "food-drinks",
    slug: "food-drinks",
    icon: "Utensils",
    label: { en: "Food & Drinks", km: "អាហារ និងភេសជ្ជៈ" },
    subcategories: [
      sub("restaurants", "restaurants", "Restaurants", "ភោជនីយដ្ឋាន"),
      sub("catering", "catering", "Catering", "ម្ហូបកម្មវិធី"),
      sub("packaged-food", "packaged-food", "Packaged Food", "អាហារវេចខ្ចប់"),
      sub("beverages", "beverages", "Drinks & Beverages", "ភេសជ្ជៈ"),
    ],
  },
  {
    id: "tuk-tuk",
    slug: "tuk-tuk",
    icon: "Truck",
    label: { en: "Tuk Tuk & Remorque", km: "តុកតុក និងរ៉េម៉ក" },
    subcategories: [
      sub("tuk-tuk-sale", "tuk-tuk-sale", "Tuk Tuk for Sale", "តុកតុកលក់"),
      sub("remorque", "remorque", "Remorque", "រ៉េម៉ក"),
      sub("tuk-tuk-rent", "tuk-tuk-rent", "Tuk Tuk for Rent", "តុកតុកជួល"),
    ],
  },
]

export function findCategory(slug) {
  return CATEGORIES.find((category) => category.slug === slug)
}

export function findSubcategory(categorySlug, subcategorySlug) {
  return findCategory(categorySlug)?.subcategories.find(
    (subcategory) => subcategory.slug === subcategorySlug,
  )
}
