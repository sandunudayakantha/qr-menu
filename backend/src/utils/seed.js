require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore
}
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Menu = require('../models/Menu');
const MenuItem = require('../models/MenuItem');
const FeaturedSection = require('../models/FeaturedSection');
const QRCodeModel = require('../models/QRCode');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/qr_menu_db', { family: 4 });
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Branch.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Menu.deleteMany({}),
      MenuItem.deleteMany({}),
      FeaturedSection.deleteMany({}),
      QRCodeModel.deleteMany({})
    ]);

    console.log('[Seed] Cleared existing database records.');

    // 1. Create Super Admin User
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@qrmenu.com',
      password: 'Admin@123456',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });
    console.log(`[Seed] Created Super Admin: admin@qrmenu.com / Admin@123456`);

    // 2. Create Sample Restaurant Owner User
    const owner = await User.create({
      name: 'John Doe (Palace Bistro)',
      email: 'owner@bistro.com',
      password: 'Owner@123456',
      role: 'RESTAURANT_OWNER',
      status: 'ACTIVE'
    });
    console.log(`[Seed] Created Restaurant Owner: owner@bistro.com / Owner@123456`);

    // 3. Create Restaurant
    const restaurant = await Restaurant.create({
      name: 'Palace Gourmet Bistro',
      owner: owner._id,
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      maxBranches: 3,
      status: 'ACTIVE'
    });

    owner.restaurantId = restaurant._id;
    await owner.save();
    console.log(`[Seed] Created Restaurant: ${restaurant.name}`);

    // 4. Create Main Branch & Colombo Branch
    const mainBranch = await Branch.create({
      restaurant: restaurant._id,
      name: 'Main Branch - Colombo',
      address: '77 Galle Road, Colombo 03',
      phone: '+94 11 234 5678',
      logo: restaurant.logo,
      coverImage: restaurant.coverImage,
      isMain: true,
      status: 'ACTIVE'
    });

    const kandyBranch = await Branch.create({
      restaurant: restaurant._id,
      name: 'Kandy Hilltop Branch',
      address: '12 Temple Street, Kandy',
      phone: '+94 81 234 5678',
      isMain: false,
      status: 'ACTIVE'
    });

    console.log(`[Seed] Created 2 Branches: ${mainBranch.name}, ${kandyBranch.name}`);

    // 5. Create Categories
    const categories = await Category.insertMany([
      { restaurant: restaurant._id, branch: mainBranch._id, name: 'Beverages & Coffee', sortOrder: 1 },
      { restaurant: restaurant._id, branch: mainBranch._id, name: 'Gourmet Burgers', sortOrder: 2 },
      { restaurant: restaurant._id, branch: mainBranch._id, name: 'Italian Pizzas', sortOrder: 3 },
      { restaurant: restaurant._id, branch: mainBranch._id, name: 'Decadent Desserts', sortOrder: 4 }
    ]);
    console.log(`[Seed] Created ${categories.length} Categories.`);

    // 6. Create Products
    const products = await Product.insertMany([
      {
        restaurant: restaurant._id,
        branch: mainBranch._id,
        category: categories[0]._id,
        name: 'Artisanal Iced Cappuccino',
        description: 'Freshly pulled double espresso over cold milk with velvet foam.',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=80',
        prepTime: '5-10 mins',
        available: true
      },
      {
        restaurant: restaurant._id,
        branch: mainBranch._id,
        category: categories[0]._id,
        name: 'Sparkling Berry Lemonade',
        description: 'Fresh lemon juice, muddled berries, and sparkling mineral water.',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80',
        prepTime: '5 mins',
        available: true
      },
      {
        restaurant: restaurant._id,
        branch: mainBranch._id,
        category: categories[1]._id,
        name: 'Truffle Wagyu Beef Burger',
        description: 'Black Angus Wagyu patty, black truffle aioli, aged cheddar, arugula on brioche.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
        prepTime: '15-20 mins',
        available: true
      },
      {
        restaurant: restaurant._id,
        branch: mainBranch._id,
        category: categories[2]._id,
        name: 'Woodfired Truffle & Mushroom Pizza',
        description: 'Mozzarella di bufala, wild mushrooms, white truffle oil, fresh basil.',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
        prepTime: '15 mins',
        available: true
      },
      {
        restaurant: restaurant._id,
        branch: mainBranch._id,
        category: categories[3]._id,
        name: 'Belgian Molten Lava Cake',
        description: 'Warm chocolate cake with molten center, served with French vanilla bean gelato.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80',
        prepTime: '10-12 mins',
        available: true
      }
    ]);
    console.log(`[Seed] Created ${products.length} Products.`);

    // 7. Create Menus
    const normalMenu = await Menu.create({
      restaurant: restaurant._id,
      branch: mainBranch._id,
      name: 'Standard Dining Menu',
      description: 'Our regular daily dining menu.',
      status: 'ACTIVE'
    });

    const vipMenu = await Menu.create({
      restaurant: restaurant._id,
      branch: mainBranch._id,
      name: 'VIP Lounge Menu',
      description: 'Exclusive lounge dining experience with custom pricing.',
      status: 'ACTIVE'
    });

    console.log(`[Seed] Created 2 Menus: ${normalMenu.name}, ${vipMenu.name}`);

    // 8. Create Menu Items with distinct prices
    await MenuItem.insertMany([
      { menu: normalMenu._id, product: products[0]._id, price: 650, sortOrder: 1 },
      { menu: normalMenu._id, product: products[1]._id, price: 550, sortOrder: 2 },
      { menu: normalMenu._id, product: products[2]._id, price: 2450, sortOrder: 3 },
      { menu: normalMenu._id, product: products[3]._id, price: 2100, sortOrder: 4 },
      { menu: normalMenu._id, product: products[4]._id, price: 950, sortOrder: 5 },

      // VIP menu items with premium price overrides!
      { menu: vipMenu._id, product: products[0]._id, price: 800, sortOrder: 1 },
      { menu: vipMenu._id, product: products[2]._id, price: 2950, sortOrder: 2 },
      { menu: vipMenu._id, product: products[3]._id, price: 2600, sortOrder: 3 }
    ]);
    console.log(`[Seed] Populated MenuItems for Standard & VIP menus.`);

    // 9. Create Featured Section
    await FeaturedSection.create({
      restaurant: restaurant._id,
      branch: mainBranch._id,
      title: "Chef's Signature Recommendation",
      description: 'Specially handpicked dishes prepared fresh by Head Chef Alex.',
      products: [products[2]._id, products[3]._id, products[4]._id],
      isActive: true
    });
    console.log(`[Seed] Created Featured Section.`);

    // 10. Create Permanent QR Code Token
    const qrCode = await QRCodeModel.create({
      restaurant: restaurant._id,
      branch: mainBranch._id,
      menu: normalMenu._id,
      token: 'DEMO1234',
      tableName: 'Table #05 (Window View)',
      isActive: true
    });

    console.log(`================================================`);
    console.log(`✅ Seed Completed Successfully!`);
    console.log(`🔐 Super Admin Login : admin@qrmenu.com / Admin@123456`);
    console.log(`🔐 Owner Login       : owner@bistro.com / Owner@123456`);
    console.log(`📱 Demo QR Menu Link : http://localhost:5173/q/${qrCode.token}`);
    console.log(`================================================`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
