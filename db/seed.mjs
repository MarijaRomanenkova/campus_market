/**
 * @module db/seed.mjs
 * @description Database seeding script that populates the database with initial test data.
 * This is the ESM (ECMAScript Module) version of the seed script for environments that require ES modules.
 * This script creates categories, product assignment statuses, users, products, and product assignments for testing purposes.
 * 
 * To run this script: node db/seed.mjs
 */

import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcrypt-ts'

const prisma = new PrismaClient()

/**
 * Main seeding function that populates the database with test data.
 * Executes in sequence:
 * 1. Creates:
 *    - Categories (Electronics, Clothing, Furniture)
 *    - Product assignment statuses
 *    - Users with hashed passwords
 *    - Products (second-hand items for campus marketplace)
 *    - Product assignments
 * 
 * @async
 * @returns {Promise<void>}
 */
async function main() {
  try {
    console.log('Starting seeding process...');

    // Check if we already have data
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('Database already has data. Skipping seeding...');
      return;
    }

    // Create Categories for campus marketplace
    console.log("Creating categories...");
    const categories = await Promise.all([
      prisma.category.create({
        data: { name: 'Electronics', description: 'Second-hand electronics like fridges, washing machines, laptops, phones' }
      }),
      prisma.category.create({
        data: { name: 'Clothing', description: 'Second-hand clothing like coats, jeans, jackets, shoes' }
      }),
      prisma.category.create({
        data: { name: 'Furniture', description: 'Second-hand furniture like tables, chairs, beds, desks' }
      }),
    ])

    // Create Product Assignment Statuses
    console.log("Creating product assignment statuses...");
    const statuses = await Promise.all([
      prisma.productAssignmentStatus.create({
        data: {
          id: '38743520-6135-4506-a968-7ecd0bbc64ff', // Open status UUID
          name: 'OPEN',
          description: 'Product assignment is open for sellers',
          order: 1
        }
      }),
      prisma.productAssignmentStatus.create({
        data: {
          id: '2c043d52-6497-422a-98e0-97d6318ca317', // In Progress status UUID
          name: 'IN_PROGRESS',
          description: 'Work is in progress',
          color: '#FFC107',
          order: 2
        }
      }),
      prisma.productAssignmentStatus.create({
        data: {
          id: 'a8b9c0d1-e2f3-4567-89ab-cdef01234567', // Completed status UUID
          name: 'COMPLETED',
          description: 'Product assignment has been completed',
          color: '#9C27B0',
          order: 3
        }
      }),
      prisma.productAssignmentStatus.create({
        data: {
          id: 'b1c2d3e4-f5a6-47b8-89c0-d1e2f3a4b5c6', // Accepted status UUID
          name: 'ACCEPTED',
          description: 'Product assignment has been completed and accepted by the client',
          color: '#4ade80',
          order: 4
        }
      })
    ])

    // Create password for users (same for all to make testing easier)
    const password = hashSync('password123', 10)

    // Create Users
    console.log("Creating users...");
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Alex Student',
          email: 'alex@campus.edu',
          password,
          role: 'user'
        }
      }),
      prisma.user.create({
        data: {
          name: 'Maria Admin',
          email: 'admin@campus.edu',
          password,
          role: 'admin'
        }
      }),
      prisma.user.create({
        data: {
          name: 'Sam Seller',
          email: 'sam@campus.edu',
          password,
          role: 'user'
        }
      })
    ])

    // Create Products - Second-hand items for campus marketplace
    console.log("Creating products...");
    const products = await Promise.all([
      // Electronics
      prisma.product.create({
        data: {
          name: "Refrigerator",
          description: "Compact mini fridge in good working condition. Perfect for dorm rooms.",
          price: 80.00,
          categoryId: categories[0].id,
          images: [],
          createdById: users[0].id,
        },
      }),
      prisma.product.create({
        data: {
          name: "Laptop",
          description: "MacBook Air 2020, 8GB RAM, 256GB SSD. Good condition with charger included.",
          price: 500.00,
          categoryId: categories[0].id,
          images: [],
          createdById: users[2].id,
        },
      }),
      prisma.product.create({
        data: {
          name: "Washing Machine",
          description: "Portable washing machine in excellent condition. Used for one year.",
          price: 120.00,
          categoryId: categories[0].id,
          images: [],
          createdById: users[2].id,
        },
      }),
      // Clothing
      prisma.product.create({
        data: {
          name: "Coat",
          description: "Winter coat, size medium. Excellent condition, barely worn.",
          price: 40.00,
          categoryId: categories[1].id,
          images: [],
          createdById: users[0].id,
        },
      }),
      prisma.product.create({
        data: {
          name: "Jeans",
          description: "Three pairs of jeans in good condition. Various sizes available.",
          price: 25.00,
          categoryId: categories[1].id,
          images: [],
          createdById: users[2].id,
        },
      }),
      // Furniture
      prisma.product.create({
        data: {
          name: "Table",
          description: "Wooden study table in good condition. Perfect for dorm room.",
          price: 45.00,
          categoryId: categories[2].id,
          images: [],
          createdById: users[0].id,
        },
      }),
      prisma.product.create({
        data: {
          name: "Chair",
          description: "Office chair, adjustable height. Good condition.",
          price: 35.00,
          categoryId: categories[2].id,
          images: [],
          createdById: users[2].id,
        },
      }),
      prisma.product.create({
        data: {
          name: "Bed",
          description: "Twin size bed frame, metal construction. Easy to assemble.",
          price: 55.00,
          categoryId: categories[2].id,
          images: [],
          createdById: users[2].id,
        },
      }),
    ]);

    // Create Product Assignments
    console.log("Creating product assignments...");
    const assignments = await Promise.all([
      prisma.productAssignment.create({
        data: {
          productId: products[0].id, // Refrigerator
          clientId: users[0].id,
          sellerId: users[2].id,
          statusId: statuses[1].id // IN_PROGRESS
        }
      }),
      prisma.productAssignment.create({
        data: {
          productId: products[3].id, // Coat
          clientId: users[0].id,
          sellerId: users[2].id,
          statusId: statuses[2].id, // COMPLETED
          completedAt: new Date()
        }
      })
    ])

    console.log('Database seeded successfully!')
    console.log(`Created ${categories.length} categories, ${users.length} users, ${products.length} products, and ${assignments.length} product assignments.`)
  } catch (e) {
    console.error('Error seeding database:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Execute the seeding process and handle any errors
 */
main() 
