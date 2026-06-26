export const restaurantByLocation = {
  Thaltej: "Spice Garden",
  "Sindhu Bhavan": "Italian House",
  "S.G. Highway": "Burger Factory",
  "Prahlad Nagar": "Royal Punjabi",
  Bodakdev: "Sushi Bloom",
  Vastrapur: "Coastal Oven",
};

export const restaurantProfiles = [
  {
    name: "Spice Garden",
    location: "Thaltej",
    rating: 4.8,
    cuisine: "Indian",
    vibe: "Fine Dining",
    avgPrice: 420,
  },
  {
    name: "Italian House",
    location: "Sindhu Bhavan",
    rating: 4.7,
    cuisine: "Italian",
    vibe: "Romantic",
    avgPrice: 480,
  },
  {
    name: "Burger Factory",
    location: "S.G. Highway",
    rating: 4.5,
    cuisine: "Fast Food",
    vibe: "Casual",
    avgPrice: 260,
  },
  {
    name: "Royal Punjabi",
    location: "Prahlad Nagar",
    rating: 4.9,
    cuisine: "Punjabi",
    vibe: "Family Friendly",
    avgPrice: 380,
  },
  {
    name: "Sushi Bloom",
    location: "Bodakdev",
    rating: 4.6,
    cuisine: "Japanese",
    vibe: "Minimal",
    avgPrice: 520,
  },
  {
    name: "Coastal Oven",
    location: "Vastrapur",
    rating: 4.8,
    cuisine: "Seafood",
    vibe: "Luxury",
    avgPrice: 640,
  },
];

export const suggestedTableByCategory = {
  Starter: "Couple",
  "Main Course": "Family",
  Italian: "Private",
  Dessert: "VIP",
};

export const restaurants = [
  "All",
  "Spice Garden",
  "Italian House",
  "Burger Factory",
  "Royal Punjabi",
  "Sushi Bloom",
  "Coastal Oven",
];

export const tableTypes = ["All", "Indoor", "Couple", "Family", "Rooftop", "Private", "VIP", "Outdoor"];

export const categories = ["All", "Starter", "Main Course", "Italian", "Dessert"];

export const locations = ["All", "Thaltej", "Sindhu Bhavan", "S.G. Highway", "Prahlad Nagar", "Bodakdev", "Vastrapur"];

export const foods = [
  { id: 1, name: "Paneer Tikka", category: "Starter", location: "Thaltej", price: 249, available: true, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80" },
  { id: 2, name: "Veg Spring Roll", category: "Starter", location: "Sindhu Bhavan", price: 219, available: true, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80" },
  { id: 3, name: "Hara Bhara Kebab", category: "Starter", location: "S.G. Highway", price: 239, available: true, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80" },
  { id: 4, name: "Mushroom Chilli", category: "Starter", location: "Prahlad Nagar", price: 269, available: false, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80" },
  { id: 5, name: "Garlic Bread", category: "Starter", location: "Bodakdev", price: 189, available: true, image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1000&q=80" },
  { id: 6, name: "Tandoori Platter", category: "Starter", location: "Vastrapur", price: 399, available: false, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80" },
  { id: 7, name: "Veg Biryani", category: "Main Course", location: "Thaltej", price: 299, available: true, image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1000&q=80" },
  { id: 8, name: "Paneer Butter Masala", category: "Main Course", location: "Sindhu Bhavan", price: 329, available: true, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1000&q=80" },
  { id: 9, name: "Dal Tadka", category: "Main Course", location: "S.G. Highway", price: 249, available: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=80" },
  { id: 10, name: "Veg Kolhapuri", category: "Main Course", location: "Prahlad Nagar", price: 319, available: false, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=1000&q=80" },
  { id: 11, name: "Kadai Paneer", category: "Main Course", location: "Bodakdev", price: 339, available: true, image: "https://images.unsplash.com/photo-1633321702518-7feccafb94d5?auto=format&fit=crop&w=1000&q=80" },
  { id: 12, name: "Hyderabadi Veg Dum Biryani", category: "Main Course", location: "Vastrapur", price: 349, available: true, image: "https://images.unsplash.com/photo-1626777552726-4f5a7a1e4d1d?auto=format&fit=crop&w=1000&q=80" },
  { id: 13, name: "Margherita Pizza", category: "Italian", location: "Thaltej", price: 399, available: true, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=80" },
  { id: 14, name: "Truffle Mushroom Pasta", category: "Italian", location: "Sindhu Bhavan", price: 449, available: false, image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80" },
  { id: 15, name: "Penne Alfredo", category: "Italian", location: "S.G. Highway", price: 429, available: true, image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1000&q=80" },
  { id: 16, name: "Cheese Burst Pizza", category: "Italian", location: "Prahlad Nagar", price: 479, available: true, image: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1000&q=80" },
  { id: 17, name: "Brownie Sundae", category: "Dessert", location: "Bodakdev", price: 199, available: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=80" },
  { id: 18, name: "Gulab Jamun", category: "Dessert", location: "Vastrapur", price: 149, available: true, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=80" },
  { id: 19, name: "Chocolate Lava Cake", category: "Dessert", location: "Thaltej", price: 229, available: false, image: "https://images.unsplash.com/photo-1547119162-14c9edffb3c2?auto=format&fit=crop&w=1000&q=80" },
  { id: 20, name: "Rasmalai", category: "Dessert", location: "Sindhu Bhavan", price: 179, available: true, image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1000&q=80" },
  { id: 21, name: "Veg Manchurian", category: "Starter", location: "S.G. Highway", price: 259, available: true, image: "https://images.unsplash.com/photo-1585032226658-5a1d1863cfc8?auto=format&fit=crop&w=1000&q=80" },
  { id: 22, name: "Corn Cheese Balls", category: "Starter", location: "Prahlad Nagar", price: 229, available: true, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80" },
  { id: 23, name: "Malai Kofta", category: "Main Course", location: "Bodakdev", price: 359, available: true, image: "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=1000&q=80" },
  { id: 24, name: "Chole Bhature", category: "Main Course", location: "Vastrapur", price: 279, available: true, image: "https://images.unsplash.com/photo-1626132647523-66d8c1d0f9f4?auto=format&fit=crop&w=1000&q=80" },
  { id: 25, name: "Veg Lasagna", category: "Italian", location: "Thaltej", price: 459, available: false, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=80" },
  { id: 26, name: "Schezwan Noodles", category: "Main Course", location: "Sindhu Bhavan", price: 289, available: true, image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80" },
  { id: 27, name: "Stuffed Mushrooms", category: "Starter", location: "S.G. Highway", price: 279, available: false, image: "https://images.unsplash.com/photo-1606755962773-0a3b0c3d4d8f?auto=format&fit=crop&w=1000&q=80" },
  { id: 28, name: "Tiramisu Cup", category: "Dessert", location: "Prahlad Nagar", price: 249, available: true, image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1000&q=80" },
  { id: 29, name: "Veg Handi", category: "Main Course", location: "Bodakdev", price: 339, available: true, image: "https://images.unsplash.com/photo-1617502677740-4f0c2d6ad7d1?auto=format&fit=crop&w=1000&q=80" },
  { id: 30, name: "Pesto Pasta", category: "Italian", location: "Vastrapur", price: 439, available: true, image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1000&q=80" },
  { id: 31, name: "Masala Peanuts", category: "Starter", location: "Thaltej", price: 179, available: true, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80" },
  { id: 32, name: "Spinach Corn Soup", category: "Starter", location: "Thaltej", price: 209, available: true, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80" },
  { id: 33, name: "Paneer Lababdar", category: "Main Course", location: "Thaltej", price: 369, available: true, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1000&q=80" },
  { id: 34, name: "Caprese Bruschetta", category: "Starter", location: "Sindhu Bhavan", price: 239, available: true, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80" },
  { id: 35, name: "Creamy Pesto Penne", category: "Italian", location: "Sindhu Bhavan", price: 469, available: true, image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80" },
  { id: 36, name: "Tandoori Sizzler", category: "Main Course", location: "Sindhu Bhavan", price: 389, available: true, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80" },
  { id: 37, name: "Loaded Fries", category: "Starter", location: "S.G. Highway", price: 219, available: true, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80" },
  { id: 38, name: "Cheese Nachos", category: "Starter", location: "S.G. Highway", price: 229, available: true, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80" },
  { id: 39, name: "Veg Wrap Combo", category: "Main Course", location: "S.G. Highway", price: 289, available: true, image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80" },
  { id: 40, name: "Punjabi Samosa Chaat", category: "Starter", location: "Prahlad Nagar", price: 199, available: true, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80" },
  { id: 41, name: "Sarson Ka Saag", category: "Main Course", location: "Prahlad Nagar", price: 349, available: true, image: "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=1000&q=80" },
  { id: 42, name: "Lassi Delight", category: "Dessert", location: "Prahlad Nagar", price: 159, available: true, image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1000&q=80" },
  { id: 43, name: "Miso Soup", category: "Starter", location: "Bodakdev", price: 189, available: true, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80" },
  { id: 44, name: "Sushi Platter", category: "Main Course", location: "Bodakdev", price: 499, available: true, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=80" },
  { id: 45, name: "Japanese Cheesecake", category: "Dessert", location: "Bodakdev", price: 219, available: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=80" },
  { id: 46, name: "Seafood Chowder", category: "Starter", location: "Vastrapur", price: 289, available: true, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80" },
  { id: 47, name: "Grilled Fish Steak", category: "Main Course", location: "Vastrapur", price: 549, available: true, image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=80" },
  { id: 48, name: "Caramel Pudding", category: "Dessert", location: "Vastrapur", price: 189, available: true, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=80" },
];

export const enrichedFoods = foods.map((food) => ({
  ...food,
  restaurant: restaurantByLocation[food.location] ?? "RestorantBooking Kitchen",
  tableType: suggestedTableByCategory[food.category] ?? "Indoor",
}));

export const tables = [
  { id: "I1", type: "Indoor", city: "Thaltej", seats: 2, price: 400, status: "available" },
  { id: "I2", type: "Indoor", city: "Sindhu Bhavan", seats: 4, price: 500, status: "available" },
  { id: "C1", type: "Couple", city: "Prahlad Nagar", seats: 2, price: 149, status: "available" },
  { id: "C2", type: "Couple", city: "Bodakdev", seats: 2, price: 199, status: "available" },
  { id: "F1", type: "Family", city: "Vastrapur", seats: 4, price: 299, status: "available" },
  { id: "F2", type: "Family", city: "Thaltej", seats: 6, price: 349, status: "available" },
  { id: "R1", type: "Rooftop", city: "S.G. Highway", seats: 4, price: 399, status: "available" },
  { id: "R2", type: "Rooftop", city: "Sindhu Bhavan", seats: 6, price: 449, status: "available" },
  { id: "P1", type: "Private", city: "Prahlad Nagar", seats: 6, price: 499, status: "available" },
  { id: "P2", type: "Private", city: "Bodakdev", seats: 8, price: 599, status: "available" },
  { id: "V1", type: "VIP", city: "Vastrapur", seats: 4, price: 999, status: "available" },
  { id: "V2", type: "VIP", city: "Thaltej", seats: 6, price: 1199, status: "available" },
  { id: "O1", type: "Outdoor", city: "S.G. Highway", seats: 2, price: 199, status: "available" },
  { id: "O2", type: "Outdoor", city: "Sindhu Bhavan", seats: 4, price: 249, status: "available" },
  { id: "H1", type: "Family", city: "Prahlad Nagar", seats: 8, price: 399, status: "available" },
  { id: "L1", type: "Indoor", city: "Vastrapur", seats: 4, price: 500, status: "available" },
];

export const branches = ["Thaltej", "Sindhu Bhavan", "S.G. Highway", "Prahlad Nagar", "Bodakdev", "Vastrapur"];
