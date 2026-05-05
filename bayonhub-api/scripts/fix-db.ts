import { PrismaClient } from '@prisma/client'
import fs from 'fs'

async function main() {
  const prisma = new PrismaClient()
  const sql = fs.readFileSync('fix_schema.sql', 'utf8')
  
  // Split by semicolon, but ignore semicolons inside quotes if possible.
  // A simple split by ;\n or ; \n should work for Prisma-generated SQL.
  const statements = sql.split(/;\s*$/m).filter(s => s.trim().length > 0)
  
  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50)}...`)
      await prisma.$executeRawUnsafe(statement)
    } catch (error) {
      console.error('Error executing statement:', error)
      // Some statements might fail if they were partially applied.
      // We continue to the next one.
    }
  }
  
  await prisma.$disconnect()
  console.log('Done!')
}

main()
