import db from './src/db/index.js';
import { sql } from 'drizzle-orm';
import { bidsTable } from './src/db/schema.js';

async function run() {
  try {
    console.log('Adding slug column to bids table...');
    try {
      await db.execute(sql`ALTER TABLE bids ADD COLUMN slug VARCHAR(255) UNIQUE;`);
      console.log('Added slug column successfully.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Slug column already exists.');
      } else if (e.code === 'ER_DUP_ENTRY') {
        // If it fails because of unique constraint with existing NULLs (though MySQL allows multiple NULLs in unique)
        console.log('Failed to add unique column directly. Adding without unique first...');
        await db.execute(sql`ALTER TABLE bids ADD COLUMN slug VARCHAR(255);`);
      } else {
        throw e;
      }
    }

    console.log('Fetching all bids to generate slugs...');
    const bids = await db.select().from(bidsTable);
    
    for (const bid of bids) {
      if (!bid.slug) {
        const generatedSlug = bid.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
        console.log(`Updating bid ${bid.id} with slug ${generatedSlug}`);
        
        await db.execute(sql`UPDATE bids SET slug = ${generatedSlug} WHERE id = ${bid.id}`);
      }
    }
    
    // Add unique constraint if we had to add the column without it
    try {
      await db.execute(sql`ALTER TABLE bids ADD UNIQUE (slug);`);
      console.log('Added unique constraint to slug column.');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        // Already unique
      } else if (e.code === 'ER_DUP_ENTRY') {
          console.log('Error adding unique constraint: duplicate entry found after backfilling. This should not happen.');
      } else {
          // It might already be unique from the first CREATE
          console.log('Unique constraint note:', e.message);
      }
    }

    console.log('Migration and backfill completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

run();
