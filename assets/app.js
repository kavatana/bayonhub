const API_BASE_URL = window.BAYONHUB_API_BASE_URL || "";
const USE_MOCK_API = !API_BASE_URL;

const STORAGE_KEYS = {
  listings: "bayonhub:listings",
  saved: "bayonhub:saved",
  leads: "bayonhub:leads",
  reports: "bayonhub:reports",
  language: "bayonhub:language",
  viewedListings: "bayonhub:viewedListings",
  installDismissed: "bayonhub:installDismissed"
};

const translations = {
  en: {
    "nav.browse": "Browse",
    "nav.stores": "Stores",
    "nav.advertise": "Advertise",
    "nav.trust": "Trust",
    "nav.postingRules": "Posting Rules",
    "brand.subtitle": "Verified Cambodia Marketplace",
    "hero.eyebrow": "Local commerce for Cambodia",
    "hero.title": "Buy, sell, and grow with verified marketplace tools.",
    "hero.text": "BayonHub connects buyers with trusted sellers, clear listing details, store pages, fast contact, and promotion options for serious local commerce.",
    "hero.searchButton": "Search",
    "hero.statsTitle": "Marketplace statistics",
    "hero.activeListings": "active listings",
    "hero.provincesCovered": "provinces covered",
    "hero.verifiedStores": "verified stores",
    "market.eyebrow": "Marketplace",
    "market.title": "Fresh verified listings",
    "market.sellYours": "Sell yours",
    "filter.search": "Search",
    "filter.category": "Category",
    "filter.location": "Location",
    "filter.minPrice": "Min price",
    "filter.maxPrice": "Max price",
    "filter.sort": "Sort",
    "filter.verifiedOnly": "Verified sellers only",
    "filter.apply": "Apply filters",
    "filter.reset": "Reset filters",
    "sort.featured": "Featured first",
    "sort.newest": "Newest",
    "sort.priceLow": "Price low to high",
    "sort.priceHigh": "Price high to low",
    "sort.views": "Most viewed",
    "stores.eyebrow": "Seller stores",
    "stores.title": "Business profiles built for repeat customers.",
    "advertise.eyebrow": "Advertise",
    "advertise.title": "Promotion packages for dealers, agents, and local shops.",
    "advertise.text": "Boost listings, collect buyer interest, show verified badges, and prepare checkout or ABA payment flows for larger seller teams.",
    "plan.starter": "Starter Seller",
    "plan.starterText": "Standard listings, direct leads, saved item tracking.",
    "plan.boost": "Boost Listing",
    "plan.boostText": "Homepage placement, category priority, lead reporting.",
    "plan.business": "Business Store",
    "plan.businessText": "Storefront, badge review, monthly promotion bundle.",
    "trust.eyebrow": "Trust and safety",
    "trust.title": "Practical controls for a marketplace that needs real users.",
    "trust.verifiedSellers": "Verified sellers",
    "trust.verifiedSellersText": "Profile status, store badges, listing review fields, and clearer seller information.",
    "trust.buyerLeads": "Buyer leads",
    "trust.buyerLeadsText": "Contact actions help sellers respond quickly and keep buyer conversations organized.",
    "trust.reportFlow": "Report flow",
    "trust.reportFlowText": "Every listing can generate a report event for moderation and admin dashboards.",
    "footer.text": "A practical marketplace for Cambodian buyers and businesses.",
    "modal.postTitle": "Post a listing",
    "modal.title": "Title",
    "modal.price": "Price USD",
    "modal.condition": "Condition",
    "modal.category": "Category",
    "modal.location": "Location",
    "modal.district": "District or area",
    "modal.seller": "Seller name",
    "modal.images": "Listing images",
    "modal.description": "Description",
    "modal.publish": "Publish listing",
    "modal.signIn": "Sign in",
    "modal.identifier": "Email or phone",
    "modal.password": "Password",
    "modal.continue": "Continue",
    "condition.likeNew": "Like new",
    "condition.good": "Good",
    "condition.used": "Used",
    "condition.forRent": "For rent",
    "condition.new": "New",
    "category.All": "All",
    "category.Vehicles": "Vehicles",
    "category.Cars": "Cars",
    "category.Motorbikes": "Motorbikes",
    "category.Trucks": "Trucks",
    "category.Parts": "Parts",
    "category.Phones & Tablets": "Phones & Tablets",
    "category.Smartphones": "Smartphones",
    "category.Feature Phones": "Feature Phones",
    "category.Tablets": "Tablets",
    "category.Accessories": "Accessories",
    "category.Electronics": "Electronics",
    "category.TVs": "TVs",
    "category.Audio": "Audio",
    "category.Cameras": "Cameras",
    "category.Gaming": "Gaming",
    "category.Other": "Other",
    "category.House & Land": "House & Land",
    "category.Rent": "Rent",
    "category.Sale": "Sale",
    "category.Commercial": "Commercial",
    "category.Land": "Land",
    "category.Jobs": "Jobs",
    "category.Full-time": "Full-time",
    "category.Part-time": "Part-time",
    "category.Freelance": "Freelance",
    "category.Internship": "Internship",
    "category.Services": "Services",
    "category.Construction": "Construction",
    "category.Beauty": "Beauty",
    "category.Transport": "Transport",
    "category.Repair": "Repair",
    "category.Fashion": "Fashion",
    "category.Clothing": "Clothing",
    "category.Shoes": "Shoes",
    "category.Bags": "Bags",
    "category.Jewellery": "Jewellery",
    "category.Furniture & Home": "Furniture & Home",
    "category.Furniture": "Furniture",
    "category.Appliances": "Appliances",
    "category.Garden": "Garden",
    "category.Books, Sports & Hobbies": "Books, Sports & Hobbies",
    "category.Books": "Books",
    "category.Sports": "Sports",
    "category.Musical Instruments": "Musical Instruments",
    "category.Collectibles": "Collectibles",
    "category.Pets & Animals": "Pets & Animals",
    "category.Dogs": "Dogs",
    "category.Cats": "Cats",
    "category.Birds": "Birds",
    "category.Fish": "Fish",
    "category.Food & Drinks": "Food & Drinks",
    "category.Restaurants": "Restaurants",
    "category.Catering": "Catering",
    "category.Packaged Food": "Packaged Food",
    "province.Phnom Penh": "Phnom Penh",
    "province.Siem Reap": "Siem Reap",
    "province.Sihanoukville": "Sihanoukville",
    "province.Battambang": "Battambang",
    "province.Kampong Cham": "Kampong Cham",
    "province.Kampong Chhnang": "Kampong Chhnang",
    "province.Kampong Speu": "Kampong Speu",
    "province.Kampong Thom": "Kampong Thom",
    "province.Kampot": "Kampot",
    "province.Kandal": "Kandal",
    "province.Kep": "Kep",
    "province.Koh Kong": "Koh Kong",
    "province.Kratié": "Kratié",
    "province.Mondulkiri": "Mondulkiri",
    "province.Oddar Meanchey": "Oddar Meanchey",
    "province.Pailin": "Pailin",
    "province.Preah Sihanouk": "Preah Sihanouk",
    "province.Preah Vihear": "Preah Vihear",
    "province.Prey Veng": "Prey Veng",
    "province.Pursat": "Pursat",
    "province.Ratanakiri": "Ratanakiri",
    "province.Stung Treng": "Stung Treng",
    "province.Svay Rieng": "Svay Rieng",
    "province.Takéo": "Takéo",
    "province.Tboung Khmum": "Tboung Khmum"
  },
  km: {
    "nav.browse": "រកមើល",
    "nav.stores": "ហាង",
    "nav.advertise": "ផ្សព្វផ្សាយ",
    "nav.trust": "សុវត្ថិភាព",
    "nav.postingRules": "ច្បាប់បង្ហោះ",
    "brand.subtitle": "ទីផ្សារកម្ពុជាដែលបានផ្ទៀងផ្ទាត់",
    "hero.eyebrow": "ពាណិជ្ជកម្មក្នុងស្រុកសម្រាប់កម្ពុជា",
    "hero.title": "ទិញ លក់ និងរីកចម្រើនជាមួយឧបករណ៍ទីផ្សារដែលទុកចិត្តបាន។",
    "hero.text": "BayonHub ភ្ជាប់អ្នកទិញជាមួយអ្នកលក់ដែលទុកចិត្តបាន ព័ត៌មានលម្អិតច្បាស់ ទំព័រហាង ការទំនាក់ទំនងលឿន និងជម្រើសផ្សព្វផ្សាយ។",
    "hero.searchButton": "ស្វែងរក",
    "hero.statsTitle": "ស្ថិតិទីផ្សារ",
    "hero.activeListings": "ប្រកាសកំពុងដំណើរការ",
    "hero.provincesCovered": "ខេត្ត/រាជធានី",
    "hero.verifiedStores": "ហាងបានផ្ទៀងផ្ទាត់",
    "market.eyebrow": "ទីផ្សារ",
    "market.title": "ប្រកាសថ្មីដែលបានផ្ទៀងផ្ទាត់",
    "market.sellYours": "លក់របស់អ្នក",
    "filter.search": "ស្វែងរក",
    "filter.category": "ប្រភេទ",
    "filter.location": "ទីតាំង",
    "filter.minPrice": "តម្លៃអប្បបរមា",
    "filter.maxPrice": "តម្លៃអតិបរមា",
    "filter.sort": "តម្រៀប",
    "filter.verifiedOnly": "អ្នកលក់បានផ្ទៀងផ្ទាត់ប៉ុណ្ណោះ",
    "filter.apply": "អនុវត្តតម្រង",
    "filter.reset": "កំណត់តម្រងឡើងវិញ",
    "sort.featured": "លេចធ្លោមុន",
    "sort.newest": "ថ្មីបំផុត",
    "sort.priceLow": "តម្លៃទាបទៅខ្ពស់",
    "sort.priceHigh": "តម្លៃខ្ពស់ទៅទាប",
    "sort.views": "មើលច្រើនបំផុត",
    "stores.eyebrow": "ហាងអ្នកលក់",
    "stores.title": "ប្រវត្តិរូបអាជីវកម្មសម្រាប់អតិថិជនត្រឡប់មកវិញ។",
    "advertise.eyebrow": "ផ្សព្វផ្សាយ",
    "advertise.title": "កញ្ចប់ផ្សព្វផ្សាយសម្រាប់ឈ្មួញ ភ្នាក់ងារ និងហាងក្នុងស្រុក។",
    "advertise.text": "បង្កើនប្រកាស ប្រមូលចំណាប់អារម្មណ៍អ្នកទិញ បង្ហាញសញ្ញាផ្ទៀងផ្ទាត់ និងរៀបចំការទូទាត់ ABA សម្រាប់ក្រុមអ្នកលក់ធំ។",
    "plan.starter": "អ្នកលក់ចាប់ផ្តើម",
    "plan.starterText": "ប្រកាសស្តង់ដារ អ្នកទិញទាក់ទងផ្ទាល់ និងរក្សាទុកទំនិញ។",
    "plan.boost": "បង្កើនប្រកាស",
    "plan.boostText": "បង្ហាញនៅទំព័រដើម អាទិភាពតាមប្រភេទ និងរបាយការណ៍អ្នកទិញ។",
    "plan.business": "ហាងអាជីវកម្ម",
    "plan.businessText": "ទំព័រហាង សញ្ញាផ្ទៀងផ្ទាត់ និងកញ្ចប់ផ្សព្វផ្សាយប្រចាំខែ។",
    "trust.eyebrow": "ទំនុកចិត្ត និងសុវត្ថិភាព",
    "trust.title": "ការគ្រប់គ្រងជាក់ស្តែងសម្រាប់ទីផ្សារដែលត្រូវការអ្នកប្រើពិត។",
    "trust.verifiedSellers": "អ្នកលក់បានផ្ទៀងផ្ទាត់",
    "trust.verifiedSellersText": "ស្ថានភាពគណនី សញ្ញាហាង វាលពិនិត្យប្រកាស និងព័ត៌មានអ្នកលក់ច្បាស់។",
    "trust.buyerLeads": "ការទាក់ទងអ្នកទិញ",
    "trust.buyerLeadsText": "សកម្មភាពទំនាក់ទំនងជួយអ្នកលក់ឆ្លើយតបលឿន និងរៀបចំការសន្ទនា។",
    "trust.reportFlow": "លំហូររាយការណ៍",
    "trust.reportFlowText": "ប្រកាសនីមួយៗអាចបង្កើតរបាយការណ៍សម្រាប់ការត្រួតពិនិត្យ។",
    "footer.text": "ទីផ្សារជាក់ស្តែងសម្រាប់អ្នកទិញ និងអាជីវកម្មកម្ពុជា។",
    "modal.postTitle": "បង្ហោះប្រកាស",
    "modal.title": "ចំណងជើង",
    "modal.price": "តម្លៃ USD",
    "modal.condition": "ស្ថានភាព",
    "modal.category": "ប្រភេទ",
    "modal.location": "ទីតាំង",
    "modal.district": "ខណ្ឌ ឬតំបន់",
    "modal.seller": "ឈ្មោះអ្នកលក់",
    "modal.images": "រូបភាពប្រកាស",
    "modal.description": "ពិពណ៌នា",
    "modal.publish": "ផ្សាយប្រកាស",
    "modal.signIn": "ចូលគណនី",
    "modal.identifier": "អ៊ីមែល ឬទូរស័ព្ទ",
    "modal.password": "ពាក្យសម្ងាត់",
    "modal.continue": "បន្ត",
    "condition.likeNew": "ដូចថ្មី",
    "condition.good": "ល្អ",
    "condition.used": "ប្រើរួច",
    "condition.forRent": "សម្រាប់ជួល",
    "condition.new": "ថ្មី",
    "category.All": "ទាំងអស់",
    "category.Vehicles": "យានយន្ត",
    "category.Cars": "រថយន្ត",
    "category.Motorbikes": "ម៉ូតូ",
    "category.Trucks": "ឡានដឹកទំនិញ",
    "category.Parts": "គ្រឿងបន្លាស់",
    "category.Phones & Tablets": "ទូរស័ព្ទ និងថេប្លេត",
    "category.Smartphones": "ស្មាតហ្វូន",
    "category.Feature Phones": "ទូរស័ព្ទធម្មតា",
    "category.Tablets": "ថេប្លេត",
    "category.Accessories": "គ្រឿងបន្ថែម",
    "category.Electronics": "អេឡិចត្រូនិក",
    "category.TVs": "ទូរទស្សន៍",
    "category.Audio": "សំឡេង",
    "category.Cameras": "កាមេរ៉ា",
    "category.Gaming": "ហ្គេម",
    "category.Other": "ផ្សេងៗ",
    "category.House & Land": "ផ្ទះ និងដី",
    "category.Rent": "ជួល",
    "category.Sale": "លក់",
    "category.Commercial": "ពាណិជ្ជកម្ម",
    "category.Land": "ដី",
    "category.Jobs": "ការងារ",
    "category.Full-time": "ពេញម៉ោង",
    "category.Part-time": "ក្រៅម៉ោង",
    "category.Freelance": "ហ្វ្រីឡែន",
    "category.Internship": "កម្មសិក្សា",
    "category.Services": "សេវាកម្ម",
    "category.Construction": "សំណង់",
    "category.Beauty": "សម្រស់",
    "category.Transport": "ដឹកជញ្ជូន",
    "category.Repair": "ជួសជុល",
    "category.Fashion": "ម៉ូដ",
    "category.Clothing": "សម្លៀកបំពាក់",
    "category.Shoes": "ស្បែកជើង",
    "category.Bags": "កាបូប",
    "category.Jewellery": "គ្រឿងអលង្ការ",
    "category.Furniture & Home": "គ្រឿងសង្ហារិម និងផ្ទះ",
    "category.Furniture": "គ្រឿងសង្ហារិម",
    "category.Appliances": "ឧបករណ៍ប្រើប្រាស់",
    "category.Garden": "សួន",
    "category.Books, Sports & Hobbies": "សៀវភៅ កីឡា និងចំណូលចិត្ត",
    "category.Books": "សៀវភៅ",
    "category.Sports": "កីឡា",
    "category.Musical Instruments": "ឧបករណ៍តន្ត្រី",
    "category.Collectibles": "របស់ប្រមូល",
    "category.Pets & Animals": "សត្វចិញ្ចឹម",
    "category.Dogs": "ឆ្កែ",
    "category.Cats": "ឆ្មា",
    "category.Birds": "បក្សី",
    "category.Fish": "ត្រី",
    "category.Food & Drinks": "អាហារ និងភេសជ្ជៈ",
    "category.Restaurants": "ភោជនីយដ្ឋាន",
    "category.Catering": "ម្ហូបកម្មវិធី",
    "category.Packaged Food": "អាហារវេចខ្ចប់",
    "province.Phnom Penh": "ភ្នំពេញ",
    "province.Siem Reap": "សៀមរាប",
    "province.Sihanoukville": "ក្រុងព្រះសីហនុ",
    "province.Battambang": "បាត់ដំបង",
    "province.Kampong Cham": "កំពង់ចាម",
    "province.Kampong Chhnang": "កំពង់ឆ្នាំង",
    "province.Kampong Speu": "កំពង់ស្ពឺ",
    "province.Kampong Thom": "កំពង់ធំ",
    "province.Kampot": "កំពត",
    "province.Kandal": "កណ្តាល",
    "province.Kep": "កែប",
    "province.Koh Kong": "កោះកុង",
    "province.Kratié": "ក្រចេះ",
    "province.Mondulkiri": "មណ្ឌលគិរី",
    "province.Oddar Meanchey": "ឧត្តរមានជ័យ",
    "province.Pailin": "ប៉ៃលិន",
    "province.Preah Sihanouk": "ព្រះសីហនុ",
    "province.Preah Vihear": "ព្រះវិហារ",
    "province.Prey Veng": "ព្រៃវែង",
    "province.Pursat": "ពោធិ៍សាត់",
    "province.Ratanakiri": "រតនគិរី",
    "province.Stung Treng": "ស្ទឹងត្រែង",
    "province.Svay Rieng": "ស្វាយរៀង",
    "province.Takéo": "តាកែវ",
    "province.Tboung Khmum": "ត្បូងឃ្មុំ"
  }
};

const categories = [
  { name: "Vehicles", subcategories: ["Cars", "Motorbikes", "Trucks", "Parts"] },
  { name: "Phones & Tablets", subcategories: ["Smartphones", "Feature Phones", "Tablets", "Accessories"] },
  { name: "Electronics", subcategories: ["TVs", "Audio", "Cameras", "Gaming", "Other"] },
  { name: "House & Land", subcategories: ["Rent", "Sale", "Commercial", "Land"] },
  { name: "Jobs", subcategories: ["Full-time", "Part-time", "Freelance", "Internship"] },
  { name: "Services", subcategories: ["Construction", "Beauty", "Transport", "Repair", "Other"] },
  { name: "Fashion", subcategories: ["Clothing", "Shoes", "Bags", "Jewellery"] },
  { name: "Furniture & Home", subcategories: ["Furniture", "Appliances", "Garden"] },
  { name: "Books, Sports & Hobbies", subcategories: ["Books", "Sports", "Musical Instruments", "Collectibles"] },
  { name: "Pets & Animals", subcategories: ["Dogs", "Cats", "Birds", "Fish", "Other"] },
  { name: "Food & Drinks", subcategories: ["Restaurants", "Catering", "Packaged Food"] }
];

const locations = [
  { name: "Phnom Penh", districts: ["BKK1", "BKK2", "Toul Kork", "Sen Sok", "Chamkarmon", "Daun Penh", "7 Makara", "Tuol Sleng"] },
  { name: "Siem Reap" },
  { name: "Sihanoukville" },
  { name: "Battambang" },
  { name: "Kampong Cham" },
  { name: "Kampong Chhnang" },
  { name: "Kampong Speu" },
  { name: "Kampong Thom" },
  { name: "Kampot" },
  { name: "Kandal" },
  { name: "Kep" },
  { name: "Koh Kong" },
  { name: "Kratié" },
  { name: "Mondulkiri" },
  { name: "Oddar Meanchey" },
  { name: "Pailin" },
  { name: "Preah Sihanouk" },
  { name: "Preah Vihear" },
  { name: "Prey Veng" },
  { name: "Pursat" },
  { name: "Ratanakiri" },
  { name: "Stung Treng" },
  { name: "Svay Rieng" },
  { name: "Takéo" },
  { name: "Tboung Khmum" }
];

const seedListings = [
  {
    id: 1001,
    title: "iPhone 15 Pro Max 256GB Natural Titanium",
    price: 899,
    category: "Phones & Tablets / Smartphones",
    location: "Phnom Penh",
    district: "BKK1",
    condition: "Like new",
    sellerId: "store-sokha-mobile",
    sellerName: "Sokha Mobile",
    verified: true,
    phoneVerified: true,
    sellerRating: 4.8,
    views: 1820,
    postedAt: "2026-04-27T08:30:00+07:00",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80",
    description: "Original device with clean body, battery health 94%, box included, and face-to-face inspection available near BKK1."
  },
  {
    id: 1002,
    title: "Honda Dream 2024 Black, Tax Card Ready",
    price: 2150,
    category: "Vehicles / Motorbikes",
    location: "Phnom Penh",
    district: "Toul Kork",
    condition: "Used",
    sellerId: "store-vathanak-motors",
    sellerName: "Vathanak Motors",
    verified: true,
    phoneVerified: true,
    sellerRating: 4.6,
    views: 2440,
    postedAt: "2026-04-26T16:10:00+07:00",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
    description: "One owner, smooth engine, documents ready, and test ride available with ID at the showroom."
  },
  {
    id: 1003,
    title: "Modern Condo Studio Near Aeon 1",
    price: 450,
    category: "House & Land / Rent",
    location: "Phnom Penh",
    district: "Tonle Bassac",
    condition: "For rent",
    sellerId: "store-urban-home-kh",
    sellerName: "Urban Home KH",
    verified: true,
    phoneVerified: true,
    sellerRating: 4.7,
    views: 1284,
    postedAt: "2026-04-27T11:45:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    description: "Fully furnished studio with gym, pool, security, parking, and a six-month minimum contract."
  },
  {
    id: 1004,
    title: "MacBook Pro M2 14-inch 16GB 512GB",
    price: 1390,
    category: "Electronics / Other",
    location: "Siem Reap",
    district: "Svay Dangkum",
    condition: "Like new",
    sellerId: "store-tech-sr",
    sellerName: "Tech Store SR",
    verified: false,
    phoneVerified: false,
    sellerRating: 4.1,
    views: 930,
    postedAt: "2026-04-25T12:20:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    description: "Clean machine with original charger, used for design work, and video call inspection available before meeting."
  },
  {
    id: 1005,
    title: "Toyota Prius 2012 Full Option",
    price: 12800,
    category: "Vehicles / Cars",
    location: "Phnom Penh",
    district: "Sen Sok",
    condition: "Used",
    sellerId: "store-auto-trust-cambodia",
    sellerName: "Auto Trust Cambodia",
    verified: true,
    phoneVerified: true,
    sellerRating: 4.9,
    views: 3980,
    postedAt: "2026-04-23T09:00:00+07:00",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    description: "Clean interior and exterior, hybrid battery checked, import documents ready, and inspection welcome."
  },
  {
    id: 1006,
    title: "Sony A6400 Camera with Kit Lens",
    price: 720,
    category: "Electronics / Cameras",
    location: "Battambang",
    district: "City Center",
    condition: "Good",
    sellerId: "store-lens-house",
    sellerName: "Lens House",
    verified: true,
    phoneVerified: true,
    sellerRating: 4.5,
    views: 1100,
    postedAt: "2026-04-27T07:15:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    description: "Low shutter count, strong autofocus, includes battery, strap, and kit lens."
  },
  {
    id: 1007,
    title: "Office Desk Set for Startup Team",
    price: 260,
    category: "Furniture & Home / Furniture",
    location: "Kandal",
    district: "Ta Khmao",
    condition: "Good",
    sellerId: "store-workspace-kh",
    sellerName: "Workspace KH",
    verified: false,
    phoneVerified: false,
    sellerRating: 3.9,
    views: 540,
    postedAt: "2026-04-24T15:00:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
    description: "Four desks and chairs, suitable for a small office, buyer collects from Ta Khmao."
  },
  {
    id: 1008,
    title: "Retail Sales Assistant, Full Time",
    price: 320,
    category: "Jobs / Full-time",
    location: "Sihanoukville",
    district: "Ochheuteal",
    condition: "New",
    sellerId: "store-coastal-recruitment",
    sellerName: "Coastal Recruitment",
    verified: true,
    phoneVerified: true,
    sellerRating: 4.4,
    views: 780,
    postedAt: "2026-04-22T10:30:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    description: "Monthly salary plus commission, basic English preferred, training provided."
  }
];

let state = {
  listings: [],
  saved: [],
  selectedCategory: "All",
  activeListingId: null,
  language: "km"
};

let deferredInstallPrompt = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const elements = {
  nav: $("#mainNav"),
  navButton: $("[data-toggle-nav]"),
  categoryTrack: $("[data-category-track]"),
  routeView: $("[data-route-view]"),
  listingGrid: $("[data-listing-grid]"),
  storeGrid: $("[data-store-grid]"),
  resultCount: $("[data-result-count]"),
  resultTitle: $("[data-result-title]"),
  filterForm: $("#filterForm"),
  searchInput: $("#searchInput"),
  heroSearch: $("#heroSearch"),
  categoryFilter: $("#categoryFilter"),
  locationFilter: $("#locationFilter"),
  minPrice: $("#minPrice"),
  maxPrice: $("#maxPrice"),
  sortFilter: $("#sortFilter"),
  verifiedOnly: $("#verifiedOnly"),
  postForm: $("#postForm"),
  postImages: $("#postImages"),
  imagePreview: $("[data-image-preview]"),
  loginForm: $("#loginForm"),
  reportForm: $("#reportForm"),
  reportListingId: $("#reportListingId"),
  postCategory: $("#postCategory"),
  postLocation: $("#postLocation"),
  listingModal: $("#listingModal"),
  listingDetail: $("[data-listing-detail]"),
  toast: $("[data-toast]"),
  languageToggle: $("[data-language-toggle]")
};

const apiClient = {
  async listListings() {
    if (!USE_MOCK_API) {
      return request("/api/listings");
    }

    const stored = readStorage(STORAGE_KEYS.listings, null);
    if (stored) return stored;
    writeStorage(STORAGE_KEYS.listings, seedListings);
    return seedListings;
  },

  async createListing(payload) {
    if (!USE_MOCK_API) {
      return request("/api/listings", { method: "POST", body: payload });
    }

    const listings = readStorage(STORAGE_KEYS.listings, seedListings);
    const listing = {
      ...payload,
      id: Date.now(),
      sellerId: "local-demo-seller",
      verified: false,
      phoneVerified: false,
      sellerRating: 4,
      views: 0,
      postedAt: new Date().toISOString(),
      premium: false,
      images: payload.images || [],
      imageUrl: payload.imageUrl || "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80"
    };
    writeStorage(STORAGE_KEYS.listings, [listing, ...listings]);
    return listing;
  },

  async updateListingViews(id) {
    if (!USE_MOCK_API) {
      return request(`/api/listings/${id}/view`, { method: "POST" });
    }

    const listings = readStorage(STORAGE_KEYS.listings, seedListings).map((listing) => {
      return listing.id === id ? { ...listing, views: listing.views + 1 } : listing;
    });
    writeStorage(STORAGE_KEYS.listings, listings);
    return listings.find((listing) => listing.id === id);
  },

  async saveListing(id, saved) {
    if (!USE_MOCK_API) {
      return request(`/api/listings/${id}/save`, { method: saved ? "POST" : "DELETE" });
    }

    const current = readStorage(STORAGE_KEYS.saved, []);
    const next = saved ? [...new Set([...current, id])] : current.filter((itemId) => itemId !== id);
    writeStorage(STORAGE_KEYS.saved, next);
    return next;
  },

  async createLead(payload) {
    if (!USE_MOCK_API) {
      return request("/api/leads", { method: "POST", body: payload });
    }

    const leads = readStorage(STORAGE_KEYS.leads, []);
    writeStorage(STORAGE_KEYS.leads, [{ id: Date.now(), createdAt: new Date().toISOString(), ...payload }, ...leads]);
    return { ok: true };
  },

  async reportListing(payload) {
    if (!USE_MOCK_API) {
      return request("/api/reports", { method: "POST", body: payload });
    }

    const reports = readStorage(STORAGE_KEYS.reports, []);
    writeStorage(STORAGE_KEYS.reports, [{ id: Date.now(), createdAt: new Date().toISOString(), ...payload }, ...reports]);
    return { ok: true };
  }
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key}`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getListingImage(listing) {
  if (Array.isArray(listing.images) && listing.images.length) {
    return listing.images[0];
  }
  return listing.imageUrl || "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80";
}

function compressImage(file, maxWidthPx = 1200, qualityJpeg = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("Could not read image file")));
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", () => reject(new Error("Could not load image")));
      image.addEventListener("load", () => {
        const scale = Math.min(1, maxWidthPx / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", qualityJpeg));
      });
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  });
}

function getSelectedImageFiles() {
  if (!elements.postImages) return [];
  return Array.from(elements.postImages.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 5);
}

function renderImagePreview() {
  if (!elements.imagePreview) return;
  const files = getSelectedImageFiles();
  if (!files.length) {
    elements.imagePreview.innerHTML = `<div class="image-preview-placeholder">No images</div>`;
    return;
  }

  elements.imagePreview.innerHTML = files
    .map((file) => `<img src="${escapeHtml(URL.createObjectURL(file))}" alt="${escapeHtml(file.name)} preview" />`)
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function t(key, lang = state.language) {
  return translations[lang]?.[key] || translations.en[key] || key;
}

function translateCategoryName(name) {
  return t(`category.${name}`);
}

function translateCategoryValue(value) {
  if (!value.includes(" / ")) return translateCategoryName(value);
  const [parent, child] = value.split(" / ");
  return `${translateCategoryName(parent)} / ${translateCategoryName(child)}`;
}

function translateProvinceName(name) {
  return t(`province.${name}`);
}

function translateLocationValue(value) {
  if (!value.includes(" / ")) return translateProvinceName(value);
  const [province, district] = value.split(" / ");
  return `${translateProvinceName(province)} / ${district}`;
}

function setLanguage(lang) {
  const nextLang = translations[lang] ? lang : "km";
  state.language = nextLang;
  document.documentElement.lang = nextLang;
  writeStorage(STORAGE_KEYS.language, nextLang);

  $$("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key, nextLang);
  });

  if (elements.languageToggle) {
    elements.languageToggle.textContent = nextLang === "km" ? "EN" : "KM";
  }

  fillCategorySelect(elements.categoryFilter);
  fillLocationSelect(elements.locationFilter);
  fillCategorySelect(elements.postCategory, false);
  fillLocationSelect(elements.postLocation, false);
  renderCategories();
  renderListings();
  renderStores();
  if (window.location.hash.startsWith("#/")) {
    renderRoute();
  }
}

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function renderStars(rating = 0) {
  const rounded = Math.round(Number(rating || 0));
  const stars = Array.from({ length: 5 }, (_, index) => (index < rounded ? "★" : "☆")).join("");
  return `<span class="star-rating" aria-label="${Number(rating || 0).toFixed(1)} out of 5 stars">${stars}</span>`;
}

function getTopCategoryValues(includeAll = true) {
  const values = categories.map((category) => category.name);
  return includeAll ? ["All", ...values] : values;
}

function getCategoryValues(includeAll = true) {
  const values = categories.flatMap((category) => [
    category.name,
    ...category.subcategories.map((subcategory) => `${category.name} / ${subcategory}`)
  ]);
  return includeAll ? ["All", ...values] : values;
}

function getLocationValues(includeAll = true) {
  const values = locations.flatMap((location) => [
    location.name,
    ...(location.districts || []).map((district) => `${location.name} / ${district}`)
  ]);
  return includeAll ? ["All", ...values] : values;
}

function fillSelect(select, values, includeAll = true) {
  const options = includeAll ? values : values.filter((value) => value !== "All");
  select.innerHTML = options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

function fillCategorySelect(select, includeAll = true) {
  if (!select) return;
  const previousValue = select.value;
  const allOption = includeAll ? `<option value="All">${escapeHtml(t("category.All"))}</option>` : "";
  select.innerHTML = `${allOption}${categories
    .map((category) => `
      <option value="${escapeHtml(category.name)}">${escapeHtml(translateCategoryName(category.name))}</option>
      <optgroup label="${escapeHtml(translateCategoryName(category.name))}">
        ${category.subcategories
          .map((subcategory) => {
            const value = `${category.name} / ${subcategory}`;
            return `<option value="${escapeHtml(value)}">${escapeHtml(translateCategoryName(subcategory))}</option>`;
          })
          .join("")}
      </optgroup>
    `)
    .join("")}`;
  if (previousValue && getCategoryValues().includes(previousValue)) {
    select.value = previousValue;
  }
}

function fillLocationSelect(select, includeAll = true) {
  if (!select) return;
  const previousValue = select.value;
  const allOption = includeAll ? `<option value="All">${escapeHtml(t("category.All"))}</option>` : "";
  select.innerHTML = `${allOption}${locations
    .map((location) => {
      const districts = location.districts || [];
      const districtOptions = districts.length
        ? `<optgroup label="${escapeHtml(translateProvinceName(location.name))}">${districts
            .map((district) => {
              const value = `${location.name} / ${district}`;
              return `<option value="${escapeHtml(value)}">${escapeHtml(district)}</option>`;
            })
            .join("")}</optgroup>`
        : "";
      return `<option value="${escapeHtml(location.name)}">${escapeHtml(translateProvinceName(location.name))}</option>${districtOptions}`;
    })
    .join("")}`;
  if (previousValue && getLocationValues().includes(previousValue)) {
    select.value = previousValue;
  }
}

function initializeControls() {
  fillCategorySelect(elements.categoryFilter);
  fillLocationSelect(elements.locationFilter);
  fillCategorySelect(elements.postCategory, false);
  fillLocationSelect(elements.postLocation, false);
}

function renderCategories() {
  elements.categoryTrack.innerHTML = getTopCategoryValues()
    .map((category) => {
      const active = category === state.selectedCategory ? " active" : "";
      return `<button class="category-pill${active}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(translateCategoryValue(category))}</button>`;
    })
    .join("");
}

function matchesCategoryFilter(listingCategory, selectedCategory) {
  if (selectedCategory === "All") return true;
  return listingCategory === selectedCategory || listingCategory.startsWith(`${selectedCategory} /`);
}

function matchesLocationFilter(listing, selectedLocation) {
  if (selectedLocation === "All") return true;
  if (selectedLocation.includes(" / ")) {
    const [province, district] = selectedLocation.split(" / ");
    return listing.location === province && listing.district === district;
  }
  return listing.location === selectedLocation;
}

function getFilteredListings() {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  const category = elements.categoryFilter.value;
  const location = elements.locationFilter.value;
  const minPrice = Number(elements.minPrice.value || 0);
  const maxPrice = Number(elements.maxPrice.value || Number.MAX_SAFE_INTEGER);
  const verifiedOnly = elements.verifiedOnly.checked;

  const filtered = state.listings.filter((listing) => {
    const text = `${listing.title} ${listing.description} ${listing.sellerName} ${listing.district}`.toLowerCase();
    const matchesSearch = !searchTerm || text.includes(searchTerm);
    const matchesCategory = matchesCategoryFilter(listing.category, category);
    const matchesLocation = matchesLocationFilter(listing, location);
    const matchesPrice = listing.price >= minPrice && listing.price <= maxPrice;
    const matchesVerified = !verifiedOnly || listing.verified;
    return matchesSearch && matchesCategory && matchesLocation && matchesPrice && matchesVerified;
  });

  return sortListings(filtered);
}

function sortListings(listings) {
  const sorted = [...listings];
  const sort = elements.sortFilter.value;

  if (sort === "newest") {
    sorted.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }

  if (sort === "priceLow") {
    sorted.sort((a, b) => a.price - b.price);
  }

  if (sort === "priceHigh") {
    sorted.sort((a, b) => b.price - a.price);
  }

  if (sort === "views") {
    sorted.sort((a, b) => b.views - a.views);
  }

  if (sort === "featured") {
    sorted.sort((a, b) => Number(b.premium) - Number(a.premium) || Number(b.verified) - Number(a.verified) || b.views - a.views);
  }

  return sorted;
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findCategoryBySlug(slug) {
  return getCategoryValues(false).find((category) => slugify(category) === slug);
}

function findProvinceBySlug(slug) {
  return locations.map((location) => location.name).find((province) => slugify(province) === slug);
}

function getCanonicalUrl() {
  return window.location.href;
}

function ensureMetaTag(selector, attributeName, attributeValue) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    const [name, value] = attributeValue;
    tag.setAttribute(name, value);
    document.head.appendChild(tag);
  }
  return tag;
}

function updateMeta({ title, description }) {
  document.title = title;
  const descriptionTag = document.head.querySelector('meta[name="description"]');
  if (descriptionTag) descriptionTag.setAttribute("content", description);
  ensureMetaTag('meta[property="og:title"]', "property", ["property", "og:title"]).setAttribute("content", title);
  ensureMetaTag('meta[property="og:description"]', "property", ["property", "og:description"]).setAttribute("content", description);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", getCanonicalUrl());
}

function setRouteMode(active) {
  if (!elements.routeView) return;
  elements.routeView.hidden = !active;
  $$(".marketplace, .stores-section, .business-section, .trust-section").forEach((section) => {
    section.hidden = active;
  });
}

function createListingCollectionRoute(title, listings, description) {
  return `
    <div class="route-shell">
      <div class="results-head">
        <div>
          <p class="muted">${escapeHtml(description)}</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <a class="button button-secondary" href="#marketplace">${escapeHtml(t("nav.browse"))}</a>
      </div>
      <div class="listing-grid">
        ${listings.length ? listings.map(createListingCard).join("") : `
          <div class="empty-state">
            <div>
              <h3>No listings found</h3>
              <p>Try another category or province.</p>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

async function renderListingRoute(id) {
  const numericId = Number(id);
  const updated = await apiClient.updateListingViews(numericId);
  if (updated) {
    state.listings = state.listings.map((listing) => (listing.id === numericId ? updated : listing));
  }
  const listing = state.listings.find((item) => item.id === numericId);
  if (!listing) {
    elements.routeView.innerHTML = createListingCollectionRoute("Listing not found", [], "This listing may have been removed.");
    updateMeta({
      title: "Listing not found | BayonHub",
      description: "This BayonHub listing could not be found."
    });
    return;
  }

  trackListingViewForInstall(numericId);
  elements.routeView.innerHTML = `
    <div class="route-shell">
      <a class="button button-secondary" href="#marketplace">${escapeHtml(t("nav.browse"))}</a>
      ${createListingDetail(listing)}
      <div class="route-actions">
        <a class="button button-secondary" href="#/seller/${encodeURIComponent(listing.sellerId)}">${escapeHtml(listing.sellerName)}</a>
        <a class="button button-secondary" href="#/category/${slugify(listing.category)}">${escapeHtml(translateCategoryValue(listing.category))}</a>
        <a class="button button-secondary" href="#/province/${slugify(listing.location)}">${escapeHtml(translateProvinceName(listing.location))}</a>
      </div>
    </div>
  `;
  updateMeta({
    title: `${listing.title} | BayonHub`,
    description: `${formatPrice(listing.price)} in ${translateProvinceName(listing.location)}. ${listing.description}`.slice(0, 155)
  });
}

function renderCategoryRoute(slug) {
  const category = findCategoryBySlug(slug);
  const listings = category ? sortListings(state.listings.filter((listing) => matchesCategoryFilter(listing.category, category))) : [];
  const title = category ? translateCategoryValue(category) : "Category not found";
  elements.routeView.innerHTML = createListingCollectionRoute(title, listings, "BayonHub category listings");
  updateMeta({
    title: `${title} listings | BayonHub`,
    description: `Browse ${title} listings on BayonHub Cambodia.`
  });
}

function renderProvinceRoute(slug) {
  const province = findProvinceBySlug(slug);
  const listings = province ? sortListings(state.listings.filter((listing) => listing.location === province)) : [];
  const title = province ? translateProvinceName(province) : "Province not found";
  elements.routeView.innerHTML = createListingCollectionRoute(title, listings, "BayonHub province listings");
  updateMeta({
    title: `${title} listings | BayonHub`,
    description: `Browse BayonHub listings in ${title}.`
  });
}

function renderSellerRoute(sellerId) {
  const listings = sortListings(state.listings.filter((listing) => listing.sellerId === sellerId));
  const sellerName = listings[0]?.sellerName || "Seller not found";
  const averageRating = listings.length ? listings.reduce((sum, listing) => sum + Number(listing.sellerRating || 0), 0) / listings.length : 0;
  const phoneVerified = listings.some((listing) => listing.phoneVerified);
  elements.routeView.innerHTML = `
    <div class="route-shell">
      <div class="results-head">
        <div>
          <p class="muted">${escapeHtml(listings.length)} listings</p>
          <h2>${escapeHtml(sellerName)}</h2>
          <p>${renderStars(averageRating)} ${phoneVerified ? `<span class="phone-verified">✔ Verified Phone</span>` : `<span class="muted">Phone pending</span>`}</p>
        </div>
        <a class="button button-secondary" href="#marketplace">${escapeHtml(t("nav.browse"))}</a>
      </div>
      <div class="listing-grid">
        ${listings.map(createListingCard).join("") || `<div class="empty-state"><div><h3>No listings found</h3><p>This seller has no active listings.</p></div></div>`}
      </div>
    </div>
  `;
  updateMeta({
    title: `${sellerName} | BayonHub Seller`,
    description: `View listings from ${sellerName} on BayonHub Cambodia.`
  });
}

async function renderRoute() {
  const hash = window.location.hash || "";
  if (!hash.startsWith("#/")) {
    setRouteMode(false);
    updateMeta({
      title: "BayonHub | Cambodia Marketplace",
      description: "BayonHub is a Cambodia-focused marketplace for verified local listings, seller stores, and promoted business ads."
    });
    renderListings();
    renderStores();
    return;
  }

  setRouteMode(true);
  const [route, ...parts] = hash.slice(2).split("/");
  if (route === "listing") {
    await renderListingRoute(parts[0]);
  } else if (route === "category") {
    renderCategoryRoute(parts[0]);
  } else if (route === "province") {
    renderProvinceRoute(parts[0]);
  } else if (route === "seller") {
    renderSellerRoute(decodeURIComponent(parts[0] || ""));
  } else {
    elements.routeView.innerHTML = createListingCollectionRoute("Page not found", [], "The requested BayonHub page does not exist.");
    updateMeta({
      title: "Page not found | BayonHub",
      description: "The requested BayonHub page does not exist."
    });
  }
  elements.routeView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderListings() {
  const listings = getFilteredListings();
  const countLabel = listings.length === 1 ? "1 result" : `${listings.length} results`;
  elements.resultCount.textContent = countLabel;
  elements.resultTitle.textContent = elements.categoryFilter.value === "All" ? t("category.All") : translateCategoryValue(elements.categoryFilter.value);
  $("[data-stat='listings']").textContent = state.listings.length.toLocaleString();
  $("[data-stat='stores']").textContent = getStores().length.toLocaleString();

  if (!listings.length) {
    elements.listingGrid.innerHTML = `
      <div class="empty-state">
        <div>
          <h3>No listings found</h3>
          <p>Try another keyword, category, location, or price range.</p>
        </div>
      </div>
    `;
    return;
  }

  elements.listingGrid.innerHTML = listings.map(createListingCard).join("");
}

function createListingCard(listing) {
  const saved = state.saved.includes(listing.id);
  const badge = listing.premium ? "Featured" : listing.verified ? "Verified" : listing.category;
  const sellerStatus = listing.verified ? `<span class="verified">Verified</span>` : "<span>Standard</span>";
  const thumbnail = getListingImage(listing);

  return `
    <article class="listing-card" data-listing-id="${listing.id}">
      <div class="listing-image">
        <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(listing.title)}" loading="lazy" />
        <span class="badge">${escapeHtml(badge)}</span>
        <button class="save-button${saved ? " active" : ""}" type="button" data-save-listing="${listing.id}" aria-label="${saved ? "Remove saved listing" : "Save listing"}">${saved ? "Saved" : "+"}</button>
      </div>
      <div class="listing-body">
        <div class="listing-meta">
          <span>${escapeHtml(translateCategoryValue(listing.category))}</span>
          <span>${escapeHtml(formatDate(listing.postedAt))}</span>
        </div>
        <h3>${escapeHtml(listing.title)}</h3>
        <p class="price">${formatPrice(listing.price)}</p>
        <div class="listing-foot">
          <span>${escapeHtml(translateProvinceName(listing.location))}, ${escapeHtml(listing.district)}</span>
          <span>${Number(listing.views).toLocaleString()} views</span>
        </div>
        <div class="listing-foot">
          <span>${escapeHtml(listing.sellerName)}</span>
          ${sellerStatus}
        </div>
        <div class="listing-foot">
          <span>${renderStars(listing.sellerRating)}</span>
          ${listing.phoneVerified ? `<span class="phone-verified">✔ Verified Phone</span>` : `<span class="muted">Phone pending</span>`}
        </div>
        <div class="card-actions">
          <button class="button button-primary" type="button" data-view-listing="${listing.id}">Details</button>
          <button class="button button-secondary" type="button" data-lead-action="card" data-listing-id="${listing.id}">Contact</button>
        </div>
      </div>
    </article>
  `;
}

function getStores() {
  const stores = new Map();
  state.listings.forEach((listing) => {
    if (!stores.has(listing.sellerId)) {
      stores.set(listing.sellerId, {
        id: listing.sellerId,
        name: listing.sellerName,
        verified: listing.verified,
        phoneVerified: listing.phoneVerified,
        ratingSum: 0,
        ratingCount: 0,
        listings: 0,
        views: 0,
        categories: new Set()
      });
    }

    const store = stores.get(listing.sellerId);
    store.listings += 1;
    store.views += listing.views;
    store.categories.add(listing.category);
    store.verified = store.verified || listing.verified;
    store.phoneVerified = store.phoneVerified || listing.phoneVerified;
    if (listing.sellerRating) {
      store.ratingSum += Number(listing.sellerRating);
      store.ratingCount += 1;
    }
  });

  return Array.from(stores.values()).map((store) => ({
    ...store,
    sellerRating: store.ratingCount ? store.ratingSum / store.ratingCount : 0
  })).slice(0, 6);
}

function renderStores() {
  elements.storeGrid.innerHTML = getStores()
    .map((store) => `
      <article class="store-card">
        <header>
          <div>
            <h3>${escapeHtml(store.name)}</h3>
            <p class="muted">${escapeHtml(Array.from(store.categories).map(translateCategoryValue).join(", "))}</p>
          </div>
          ${store.verified ? `<span class="verified">Verified</span>` : `<span class="muted">Reviewing</span>`}
        </header>
        <div class="store-metrics">
          <span><strong>${store.listings}</strong> listings</span>
          <span><strong>${store.views.toLocaleString()}</strong> views</span>
          <span><strong>${store.verified ? "Live" : "New"}</strong> status</span>
        </div>
        <p>${renderStars(store.sellerRating)} ${store.phoneVerified ? `<span class="phone-verified">✔ Verified Phone</span>` : `<span class="muted">Phone pending</span>`}</p>
        <button class="button button-secondary full-width" type="button" data-view-seller="${escapeHtml(store.id)}">Open store</button>
      </article>
    `)
    .join("");
}

async function openListing(id) {
  const updated = await apiClient.updateListingViews(id);
  if (updated) {
    state.listings = state.listings.map((listing) => (listing.id === id ? updated : listing));
  }

  const listing = state.listings.find((item) => item.id === id);
  if (!listing) return;

  state.activeListingId = id;
  elements.listingDetail.innerHTML = createListingDetail(listing);
  openModal("listingModal");
  renderListings();
  renderStores();
}

function createListingDetail(listing) {
  const imageSrc = getListingImage(listing);
  return `
    <div class="detail-layout">
      <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(listing.title)}" />
      <div class="detail-panel">
        <p class="eyebrow">${escapeHtml(translateCategoryValue(listing.category))}</p>
        <h2 id="listingModalTitle">${escapeHtml(listing.title)}</h2>
        <p class="price">${formatPrice(listing.price)}</p>
        <p>${escapeHtml(listing.description)}</p>
        <div class="seller-box">
          <h3>${escapeHtml(listing.sellerName)}</h3>
          <p class="muted">${listing.verified ? "Verified seller" : "Standard seller"} in ${escapeHtml(translateProvinceName(listing.location))}, ${escapeHtml(listing.district)}</p>
          <p>${renderStars(listing.sellerRating)} ${listing.phoneVerified ? `<span class="phone-verified">✔ Verified Phone</span>` : `<span class="muted">Phone pending</span>`}</p>
          <p class="muted">Condition: ${escapeHtml(listing.condition)} · ${Number(listing.views).toLocaleString()} views</p>
        </div>
        <div class="lead-box">
          <h3>Contact seller</h3>
          <p class="muted">Choose the fastest way to reach this seller.</p>
          <div class="lead-actions">
            <button class="button button-primary" type="button" data-lead-action="call" data-listing-id="${listing.id}">Call</button>
            <button class="button button-secondary" type="button" data-lead-action="chat" data-listing-id="${listing.id}">Chat</button>
            <button class="button button-secondary" type="button" data-report-listing="${listing.id}">Report</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openModal(id) {
  const modal = $(`#${id}`);
  if (!modal) return;
  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
  document.body.classList.add("modal-open");
}

function closeModal(id) {
  const modal = $(`#${id}`);
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
  }
  if (!$$("dialog[open]").length) {
    document.body.classList.remove("modal-open");
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2800);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn("Service worker registration failed", error);
  });
}

function getViewedListings() {
  return readStorage(STORAGE_KEYS.viewedListings, []);
}

function trackListingViewForInstall(listingId) {
  const viewedListings = [...new Set([...getViewedListings(), listingId])];
  writeStorage(STORAGE_KEYS.viewedListings, viewedListings);
  maybeShowInstallBanner();
}

function createInstallBanner() {
  let banner = $("[data-install-banner]");
  if (banner) return banner;
  banner = document.createElement("div");
  banner.className = "install-banner";
  banner.dataset.installBanner = "true";
  banner.innerHTML = `
    <span>Add BayonHub to your Home Screen</span>
    <div class="install-banner-actions">
      <button class="button button-primary" type="button" data-install-accept>Install</button>
      <button class="button button-secondary" type="button" data-install-dismiss>Later</button>
    </div>
  `;
  document.body.appendChild(banner);
  banner.querySelector("[data-install-accept]").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    banner.classList.remove("show");
  });
  banner.querySelector("[data-install-dismiss]").addEventListener("click", () => {
    writeStorage(STORAGE_KEYS.installDismissed, true);
    banner.classList.remove("show");
  });
  return banner;
}

function maybeShowInstallBanner() {
  if (!deferredInstallPrompt) return;
  if (readStorage(STORAGE_KEYS.installDismissed, false)) return;
  if (getViewedListings().length < 3) return;
  createInstallBanner().classList.add("show");
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    maybeShowInstallBanner();
  });
}

function resetFilters() {
  elements.filterForm.reset();
  state.selectedCategory = "All";
  renderCategories();
  renderListings();
}

function toggleDocumentLanguage() {
  const nextLang = state.language === "km" ? "en" : "km";
  setLanguage(nextLang);
}

async function toggleSaved(id) {
  const shouldSave = !state.saved.includes(id);
  state.saved = await apiClient.saveListing(id, shouldSave);
  renderListings();
  showToast(shouldSave ? "Listing saved" : "Listing removed from saved items");
}

function validatePostForm(form) {
  let valid = true;
  $$("[data-error-for]", form).forEach((node) => {
    node.textContent = "";
  });

  const requiredFields = ["title", "price", "sellerName", "description"];
  requiredFields.forEach((name) => {
    const field = form.elements[name];
    if (!field.value.trim()) {
      valid = false;
      $(`[data-error-for="${name}"]`, form).textContent = "Required";
    }
  });

  if (form.elements.title.value.trim().length > 0 && form.elements.title.value.trim().length < 4) {
    valid = false;
    $('[data-error-for="title"]', form).textContent = "Use at least 4 characters";
  }

  if (Number(form.elements.price.value) < 1) {
    valid = false;
    $('[data-error-for="price"]', form).textContent = "Enter a valid price";
  }

  if (form.elements.description.value.trim().length > 0 && form.elements.description.value.trim().length < 12) {
    valid = false;
    $('[data-error-for="description"]', form).textContent = "Add more detail for buyers";
  }

  return valid;
}

async function handlePostSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validatePostForm(form)) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const [province, selectedDistrict = ""] = data.location.includes(" / ") ? data.location.split(" / ") : [data.location, ""];
  const images = await Promise.all(getSelectedImageFiles().map((file) => compressImage(file)));
  const payload = {
    title: data.title.trim(),
    price: Number(data.price),
    category: data.category,
    location: province,
    district: data.district.trim() || selectedDistrict || "Central",
    condition: data.condition,
    sellerName: data.sellerName.trim(),
    images,
    description: data.description.trim()
  };

  const listing = await apiClient.createListing(payload);
  state.listings = [listing, ...state.listings];
  state.selectedCategory = "All";
  elements.categoryFilter.value = "All";
  form.reset();
  renderImagePreview();
  closeModal("postModal");
  renderCategories();
  renderListings();
  renderStores();
  showToast("Listing published");
}

async function handleLead(action, listingId) {
  const listing = state.listings.find((item) => item.id === listingId);
  if (!listing) return;

  await apiClient.createLead({
    listingId,
    sellerId: listing.sellerId,
    action,
    source: "bayonhub-web"
  });

  showToast(action === "chat" ? "Chat lead created" : "Seller contact lead created");
}

function reportListing(listingId) {
  if (!elements.reportListingId) return;
  elements.reportListingId.value = listingId;
  openModal("reportModal");
}

async function submitListingReport(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const listingId = Number(data.listingId);
  const listing = state.listings.find((item) => item.id === listingId);
  if (!listing) return;

  await apiClient.reportListing({
    listingId,
    sellerId: listing.sellerId,
    reason: data.reason || "Other",
    source: "listing_detail"
  });

  form.reset();
  closeModal("reportModal");
  showToast("Report submitted for review");
}

function bindEvents() {
  elements.navButton.addEventListener("click", () => {
    const isOpen = elements.nav.classList.toggle("open");
    elements.navButton.setAttribute("aria-expanded", String(isOpen));
  });

  elements.nav.addEventListener("click", () => {
    elements.nav.classList.remove("open");
    elements.navButton.setAttribute("aria-expanded", "false");
  });

  ["input", "change"].forEach((eventName) => {
    elements.filterForm.addEventListener(eventName, () => {
      state.selectedCategory = elements.categoryFilter.value;
      renderCategories();
      renderListings();
    });
  });

  elements.filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.selectedCategory = elements.categoryFilter.value;
    renderCategories();
    renderListings();
  });

  if (elements.languageToggle) {
    elements.languageToggle.addEventListener("click", toggleDocumentLanguage);
  }

  elements.categoryTrack.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.selectedCategory = button.dataset.category;
    elements.categoryFilter.value = button.dataset.category;
    renderCategories();
    renderListings();
    if (button.dataset.category === "All") {
      window.location.hash = "marketplace";
    } else {
      window.location.hash = `#/category/${slugify(button.dataset.category)}`;
    }
  });

  $("[data-hero-search]").addEventListener("submit", (event) => {
    event.preventDefault();
    elements.searchInput.value = elements.heroSearch.value;
    renderListings();
    document.querySelector("#marketplace").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("[data-reset-filters]").addEventListener("click", resetFilters);
  elements.postForm.addEventListener("submit", handlePostSubmit);
  if (elements.reportForm) {
    elements.reportForm.addEventListener("submit", submitListingReport);
  }
  if (elements.postImages) {
    elements.postImages.addEventListener("change", renderImagePreview);
  }

  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("popstate", renderRoute);

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    closeModal("loginModal");
    showToast(USE_MOCK_API ? "Demo sign in accepted" : "Sign in request sent");
  });

  document.addEventListener("click", async (event) => {
    const openButton = event.target.closest("[data-open-modal]");
    if (openButton) {
      openModal(openButton.dataset.openModal);
      return;
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeModal(closeButton.dataset.closeModal);
      return;
    }

    const saveButton = event.target.closest("[data-save-listing]");
    if (saveButton) {
      await toggleSaved(Number(saveButton.dataset.saveListing));
      return;
    }

    const viewButton = event.target.closest("[data-view-listing]");
    if (viewButton) {
      window.location.hash = `#/listing/${Number(viewButton.dataset.viewListing)}`;
      return;
    }

    const sellerButton = event.target.closest("[data-view-seller]");
    if (sellerButton) {
      window.location.hash = `#/seller/${encodeURIComponent(sellerButton.dataset.viewSeller)}`;
      return;
    }

    const leadButton = event.target.closest("[data-lead-action]");
    if (leadButton) {
      await handleLead(leadButton.dataset.leadAction, Number(leadButton.dataset.listingId));
      return;
    }

    const reportButton = event.target.closest("[data-report-listing]");
    if (reportButton) {
      await reportListing(Number(reportButton.dataset.reportListing));
    }
  });

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeModal(dialog.id);
      }
    });
    dialog.addEventListener("close", () => {
      if (!$$("dialog[open]").length) {
        document.body.classList.remove("modal-open");
      }
    });
  });
}

async function init() {
  initializeControls();
  state.language = readStorage(STORAGE_KEYS.language, document.documentElement.lang || "km");
  state.saved = readStorage(STORAGE_KEYS.saved, []);
  state.listings = await apiClient.listListings();
  renderImagePreview();
  bindEvents();
  setLanguage(state.language);
  renderRoute();
}

function bootPwa() {
  registerServiceWorker();
  setupInstallPrompt();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPwa);
} else {
  bootPwa();
}

init().catch((error) => {
  console.error(error);
  showToast("Could not load marketplace data");
});
