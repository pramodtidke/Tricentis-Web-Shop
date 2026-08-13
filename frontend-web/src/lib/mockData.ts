export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Classic Leather Backpack",
    price: 89.99,
    description:
      "A durable, handcrafted leather backpack with a padded laptop compartment and adjustable straps. Perfect for daily commutes or weekend trips.",
    category: "Bags",
    image: "https://placehold.co/600x600.png?text=Leather+Backpack",
  },
  {
    id: "2",
    name: "Wireless Noise-Cancelling Headphones",
    price: 199.99,
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear call quality.",
    category: "Electronics",
    image: "https://placehold.co/600x600.png?text=Headphones",
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    price: 24.99,
    description:
      "Soft, breathable, and sustainably sourced 100% organic cotton t-shirt. Available in a relaxed unisex fit.",
    category: "Apparel",
    image: "https://placehold.co/600x600.png?text=T-Shirt",
  },
  {
    id: "4",
    name: "Stainless Steel Water Bottle",
    price: 34.5,
    description:
      "Double-walled, vacuum-insulated bottle that keeps drinks cold for 24 hours or hot for 12. Leak-proof lid included.",
    category: "Accessories",
    image: "https://placehold.co/600x600.png?text=Water+Bottle",
  },
  {
    id: "5",
    name: "Smart Fitness Watch",
    price: 149.0,
    description:
      "Track your heart rate, sleep, and workouts with this water-resistant smart watch featuring a 7-day battery life.",
    category: "Electronics",
    image: "https://placehold.co/600x600.png?text=Fitness+Watch",
  },
  {
    id: "6",
    name: "Ceramic Pour-Over Coffee Set",
    price: 42.0,
    description:
      "A minimalist ceramic pour-over dripper and matching mug set, designed for slow-brewed, full-flavored coffee.",
    category: "Home",
    image: "https://placehold.co/600x600.png?text=Coffee+Set",
  },
  {
    id: "7",
    name: "Running Shoes - Trail Edition",
    price: 119.99,
    description:
      "Lightweight trail running shoes with reinforced grip soles and breathable mesh uppers for all-terrain performance.",
    category: "Footwear",
    image: "https://placehold.co/600x600.png?text=Trail+Shoes",
  },
  {
    id: "8",
    name: "Minimalist Desk Lamp",
    price: 54.99,
    description:
      "An adjustable LED desk lamp with three brightness settings and a sleek aluminum body that fits any workspace.",
    category: "Home",
    image: "https://placehold.co/600x600.png?text=Desk+Lamp",
  },
];