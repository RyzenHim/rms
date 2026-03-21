const defaultInventoryCategories = [
  { name: "vegetables", description: "Fresh vegetables and produce", sortOrder: 10 },
  { name: "grains", description: "Rice, flour, and dry grains", sortOrder: 20 },
  { name: "proteins", description: "Meat, seafood, and protein staples", sortOrder: 30 },
  { name: "dairy", description: "Milk, cheese, butter, and dairy items", sortOrder: 40 },
  { name: "spices", description: "Dry spices and seasoning blends", sortOrder: 50 },
  { name: "oils", description: "Cooking oils and fats", sortOrder: 60 },
  { name: "condiments", description: "Sauces, pastes, and condiments", sortOrder: 70 },
  { name: "beverages", description: "Drinks and beverage stock", sortOrder: 80 },
  { name: "other", description: "Miscellaneous stock items", sortOrder: 90 },
];

const defaultInventoryUnits = [
  { name: "Kilogram", code: "kg", sortOrder: 10 },
  { name: "Liters", code: "liters", sortOrder: 20 },
  { name: "Pieces", code: "pieces", sortOrder: 30 },
  { name: "Packets", code: "packets", sortOrder: 40 },
  { name: "Dozen", code: "dozen", sortOrder: 50 },
];

module.exports = {
  defaultInventoryCategories,
  defaultInventoryUnits,
};
