export const chartPalette = ["#0ea5e9", "#22c55e", "#f97316", "#8b5cf6", "#eab308", "#14b8a6"];
export const partyTypes = ["Birthday", "Anniversary", "Corporate", "Wedding", "Family Gathering", "Festival Dinner"];
export const serviceStyles = ["Buffet", "Plated", "Live Counter", "Family Style"];
export const menuCourses = ["starter", "main", "beverage", "dessert"];

export const initialItemForm = {
  name: "",
  description: "",
  category: "",
  unit: "",
  currentStock: 0,
  minimumThreshold: 10,
  maximumStock: 100,
  unitCost: 0,
  supplier: "",
  location: "",
};

export const initialCategoryForm = {
  name: "",
  description: "",
  sortOrder: 0,
};

export const initialUnitForm = {
  name: "",
  code: "",
  sortOrder: 0,
};

export const navGroups = [
  {
    id: "overview",
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "grid" },
      { id: "items", label: "Items", icon: "package" },
    ],
  },
  {
    id: "catalog",
    title: "Catalog",
    items: [
      { id: "planner", label: "Party Planner", icon: "calendar" },
      { id: "stock-history", label: "Stock History", icon: "bar" },
      { id: "categories", label: "Categories", icon: "layers" },
      { id: "units", label: "Units", icon: "box" },
      { id: "scanner", label: "Scanner Drafts", icon: "camera" },
    ],
  },
  {
    id: "future",
    title: "Future Features",
    items: [
      { id: "purchase-orders", label: "Purchase Orders", icon: "archive" },
      { id: "suppliers", label: "Suppliers", icon: "database" },
    ],
  },
];

export const initialSupplierForm = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  notes: "",
  isActive: true,
};

export const initialPurchaseOrderForm = {
  supplier: "",
  status: "draft",
  notes: "",
  expectedDeliveryDate: "",
  items: [{ inventoryItem: "", orderedQuantity: "", unitPrice: "", notes: "" }],
  totalPaid: "",
  paymentMethod: "other",
  paymentNote: "",
};

export const normalizeValue = (value = "") => value.toString().trim().toLowerCase().replace(/\s+/g, " ");
export const titleize = (value = "") => value.replace(/\b\w/g, (char) => char.toUpperCase());
export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const singularizeWord = (value = "") => {
  const normalized = normalizeValue(value);
  if (normalized.endsWith("ies") && normalized.length > 3) return `${normalized.slice(0, -3)}y`;
  if (normalized.endsWith("oes") && normalized.length > 3) return normalized.slice(0, -2);
  if (normalized.endsWith("es") && normalized.length > 3) return normalized.slice(0, -2);
  if (normalized.endsWith("s") && normalized.length > 2) return normalized.slice(0, -1);
  return normalized;
};

export const tokenizeInventoryName = (value = "") =>
  singularizeWord(value)
    .split(/\s+/)
    .filter(Boolean);

export const getInventoryNameSimilarity = (left = "", right = "") => {
  const leftNormalized = singularizeWord(left);
  const rightNormalized = singularizeWord(right);
  if (!leftNormalized || !rightNormalized) return 0;
  if (leftNormalized === rightNormalized) return 1;
  if (leftNormalized.includes(rightNormalized) || rightNormalized.includes(leftNormalized)) return 0.92;

  const leftTokens = tokenizeInventoryName(leftNormalized);
  const rightTokens = tokenizeInventoryName(rightNormalized);
  const overlap = leftTokens.filter((token) => rightTokens.includes(token)).length;
  const tokenScore = overlap / Math.max(leftTokens.length, rightTokens.length, 1);

  const charOverlap = [...new Set(leftNormalized)].filter((char) => rightNormalized.includes(char)).length;
  const charScore = charOverlap / Math.max(new Set(leftNormalized).size, new Set(rightNormalized).size, 1);

  return Number(((tokenScore * 0.7) + (charScore * 0.3)).toFixed(2));
};

export const createDraft = (overrides = {}) => ({
  draftId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  description: "",
  category: overrides.category || "",
  unit: overrides.unit || "",
  currentStock: 0,
  minimumThreshold: 10,
  maximumStock: 100,
  unitCost: 0,
  supplier: "",
  location: "",
  source: "manual",
  rawText: "",
  ...overrides,
});

export const inferCategory = (line, categories = []) => {
  const value = normalizeValue(line);
  const categoryKeywords = [
    { category: "vegetables", terms: ["onion", "tomato", "potato", "cabbage", "capsicum", "ginger", "garlic", "spinach"] },
    { category: "grains", terms: ["rice", "flour", "atta", "wheat", "pasta", "noodle"] },
    { category: "proteins", terms: ["chicken", "mutton", "egg", "fish", "paneer", "beef"] },
    { category: "dairy", terms: ["milk", "cheese", "curd", "butter", "cream"] },
    { category: "spices", terms: ["masala", "pepper", "turmeric", "chili", "cumin", "coriander"] },
    { category: "oils", terms: ["oil", "ghee"] },
    { category: "condiments", terms: ["sauce", "ketchup", "vinegar", "mayo"] },
    { category: "beverages", terms: ["juice", "tea", "coffee", "cola", "water"] },
  ];

  const matched = categoryKeywords.find((entry) => entry.terms.some((term) => value.includes(term)));
  if (matched && categories.some((category) => normalizeValue(category.name) === matched.category)) {
    return matched.category;
  }

  return categories.find((category) => normalizeValue(category.name) === "other")?.name || categories[0]?.name || "";
};

export const inferUnit = (line, units = []) => {
  const value = normalizeValue(line);
  const matchedUnit = units.find((unit) => value.includes(normalizeValue(unit.code)) || value.includes(normalizeValue(unit.name)));
  return matchedUnit?.code || units[0]?.code || "";
};

export const parseDraftsFromScan = (text, categories, units) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  return lines
    .map((line, index) => {
      const quantityMatch = line.match(/(\d+(?:\.\d+)?)\s*(kg|kilogram|liters|liter|l|pieces|piece|packets|packet|dozen)\b/i);
      const unit = quantityMatch ? inferUnit(quantityMatch[0], units) : units[0]?.code || "";
      const quantity = quantityMatch ? Number(quantityMatch[1]) : 0;
      const cleanedName = line
        .replace(/(\d+(?:\.\d+)?)\s*(kg|kilogram|liters|liter|l|pieces|piece|packets|packet|dozen)\b/i, "")
        .replace(/[^a-zA-Z0-9\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanedName) return null;

      return createDraft({
        draftId: `scan-${Date.now()}-${index}`,
        name: titleize(cleanedName),
        category: inferCategory(cleanedName, categories),
        unit,
        currentStock: quantity,
        minimumThreshold: Math.max(1, Math.round(quantity > 0 ? quantity * 0.25 : 10)),
        maximumStock: Math.max(10, Math.round(quantity > 0 ? quantity * 2 : 100)),
        source: "scan",
        rawText: line,
      });
    })
    .filter(Boolean);
};

export const inferCourse = (item = {}) => {
  if (menuCourses.includes(item.course)) return item.course;
  const combined = normalizeValue(`${item.name || ""} ${item.category?.name || ""} ${item.subCategory?.name || ""} ${item.heading || ""} ${item.subHeading || ""}`);
  if (/(drink|beverage|coffee|tea|juice|cola|soda|shake)/.test(combined)) return "beverage";
  if (/(dessert|sweet|cake|ice cream|icecream|brownie|gulab|halwa|kheer)/.test(combined)) return "dessert";
  if (/(snack|starter|appetizer|fries|popcorn|bucket|crispy|wings|tikka)/.test(combined)) return "starter";
  return "main";
};

export const normalizePartyType = (value = "") => value.toString().trim();

export const partyDemandMultipliers = {
  Birthday: 1.05,
  Anniversary: 0.95,
  Corporate: 1.1,
  Wedding: 1.2,
  "Family Gathering": 1,
  "Festival Dinner": 1.15,
  default: 1,
};

export const serviceStyleMultipliers = {
  Buffet: 1.12,
  Plated: 1,
  "Live Counter": 1.08,
  "Family Style": 1.04,
};

export const defaultCoursePortionFactor = {
  starter: 0.7,
  main: 1,
  beverage: 1,
  dessert: 0.65,
};

export const plannerProfiles = {
  starter: {
    veg: { vegetables: 0.12, dairy: 0.04, spices: 0.01, oils: 0.02, condiments: 0.01 },
    non_veg: { proteins: 0.15, spices: 0.015, oils: 0.02, condiments: 0.01 },
  },
  main: {
    veg: { vegetables: 0.18, grains: 0.12, dairy: 0.03, spices: 0.02, oils: 0.02 },
    non_veg: { proteins: 0.2, grains: 0.12, spices: 0.02, oils: 0.02, condiments: 0.01 },
  },
  beverage: {
    all: { beverages: 0.25, condiments: 0.01 },
  },
  dessert: {
    all: { dairy: 0.08, condiments: 0.02 },
  },
};

export const categoryRestockIdeas = {
  vegetables: ["Onion", "Tomato", "Potato", "Capsicum"],
  grains: ["Rice", "Flour", "Pasta", "Noodles"],
  proteins: ["Chicken", "Paneer", "Eggs", "Fish"],
  dairy: ["Milk", "Cheese", "Butter", "Cream"],
  spices: ["Chili Powder", "Turmeric", "Garam Masala", "Black Pepper"],
  oils: ["Cooking Oil", "Ghee"],
  condiments: ["Ketchup", "Mayonnaise", "Sauce", "Vinegar"],
  beverages: ["Soft Drinks", "Juice", "Tea Premix", "Coffee"],
  other: ["Disposable Plates", "Napkins", "Serving Supplies"],
};
