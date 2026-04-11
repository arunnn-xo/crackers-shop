export const MOCK_PRODUCTS = Array.from({ length: 142 }).map((_, i) => ({
  id: `PRD-${1000 + i}`,
  category: ['Sparklers', 'Rockets', 'Fountains', 'Chakras', 'Bombs', 'Garlands'][i % 6],
  name: `Premium ${['Golden', 'Silver', 'Neon', 'Thunder', 'Magic'][i % 5]} ${['Sparkler', 'Rocket', 'Fountain', 'Chakra', 'Bomb', 'Garland'][i % 6]} ${i + 1}`,
  image: `https://picsum.photos/seed/${i}/40/40`,
  price: Math.floor(Math.random() * 5000) + 100,
  salePrice: Math.floor(Math.random() * 4000) + 50,
  unit: ['1 Box', '5 Pcs', '10 Pcs', '1 Pkt'][i % 4],
  stock: Math.random() > 0.15 ? 'In Stock' : 'Out of Stock'
}));

export const MOCK_ORDERS = Array.from({ length: 50 }).map((_, i) => ({
  id: `ORD-${20000 + i}`,
  date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
  customer: ['Rahul Kumar', 'Priya Singh', 'Amit Patel', 'Sneha Reddy', 'Vikram Sharma'][i % 5],
  phone: `+91 98765 ${4000 + i}`,
  subTotal: Math.floor(Math.random() * 15000) + 1000,
  shipping: 250,
  total: 0,
  type: i % 3 === 0 ? 'BILLING' : 'ONLINE',
  status: ['Pending', 'Paid', 'Dispatch', 'Complete', 'Call Not Pick'][i % 5]
})).map(o => ({ ...o, total: o.subTotal + o.shipping }));

export const MOCK_CUSTOMERS = Array.from({ length: 30 }).map((_, i) => ({
  id: `CST-${300 + i}`,
  name: ['Soniya', 'Arjun', 'Meera', 'Karthik', 'Divya'][i % 5] + ` ${i}`,
  email: `customer${i}@example.com`,
  phone: `+91 90000 123${i.toString().padStart(2, '0')}`,
  address: `${100 + i} Sparkle Street, Phase ${i%3 + 1}`,
  city: ['Coimbatore', 'Sivakasi', 'Chennai', 'Bangalore', 'Madurai'][i % 5],
  avatar: `https://i.pravatar.cc/150?u=${i}`
}));

export const REVENUE_DATA = [
  { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 2000 }, { name: 'Apr', revenue: 2780 },
  { name: 'May', revenue: 1890 }, { name: 'Jun', revenue: 2390 },
  { name: 'Jul', revenue: 3490 }, { name: 'Aug', revenue: 5490 },
  { name: 'Sep', revenue: 8490 }, { name: 'Oct', revenue: 15490 },
  { name: 'Nov', revenue: 45490 }, { name: 'Dec', revenue: 12490 },
];

export const ORDER_STATUS_DATA = [
  { name: 'Pending', value: 400 }, { name: 'Paid', value: 300 },
  { name: 'Dispatch', value: 300 }, { name: 'Complete', value: 200 },
  { name: 'Call Not Pick', value: 100 }
];
