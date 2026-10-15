/**
 * Migration Script: Cloud MongoDB to Local MongoDB (Docker Compose)
 *
 * Transfers all collections, documents (preserving BSON types like ObjectId & Date),
 * and custom indexes from the previous cloud MongoDB to the new local MongoDB.
 *
 * Usage:
 *   # Default (uses CLOUD_MONGO_URI / default Atlas URI and local mongodb://127.0.0.1:27017/iic-nitdgp)
 *   node server/scripts/migrateCloudToLocalMongo.js
 *
 *   # Via npm:
 *   npm --prefix server run migrate:cloud-to-local
 *
 *   # With custom source/target or dry-run:
 *   node server/scripts/migrateCloudToLocalMongo.js --dry-run
 *   node server/scripts/migrateCloudToLocalMongo.js --source="mongodb+srv://..." --target="mongodb://127.0.0.1:27017/iic-nitdgp"
 *   node server/scripts/migrateCloudToLocalMongo.js --no-drop
 */

const path = require('path');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

// Load environment variables from server/.env or repo root .env / .env.docker
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.docker') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Parse command line arguments (e.g., --source=..., --target=..., --dry-run, --no-drop)
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const DEFAULT_SOURCE_URI =
  process.env.CLOUD_MONGO_URI ||
  process.env.SOURCE_MONGO_URI;

const DEFAULT_TARGET_URI =
  process.env.TARGET_MONGO_URI ||
  (process.env.MONGO_URI && !process.env.MONGO_URI.includes('mongodb+srv://') && !process.env.MONGO_URI.includes('mongodb:27017')
    ? process.env.MONGO_URI
    : 'mongodb://127.0.0.1:27017/iic-nitdgp');

const SOURCE_URI = args.source || DEFAULT_SOURCE_URI;
let TARGET_URI = args.target || DEFAULT_TARGET_URI;

const fs = require('fs');
const isInsideDocker = fs.existsSync('/.dockerenv');

// If target URI uses docker internal hostname 'mongodb' while running on host, replace with 127.0.0.1
if (!isInsideDocker && (TARGET_URI.includes('@mongodb:') || TARGET_URI.startsWith('mongodb://mongodb:'))) {
  console.log("ℹ Note: Running on host machine. Remapping 'mongodb' docker service host to '127.0.0.1'.");
  TARGET_URI = TARGET_URI.replace('mongodb://mongodb:', 'mongodb://127.0.0.1:');
}

const BATCH_SIZE = parseInt(args['batch-size'] || args.batchSize || '500', 10);
const SHOULD_DROP = args['no-drop'] ? false : (args.drop !== 'false');
const IS_DRY_RUN = Boolean(args['dry-run'] || args.dryRun);

function extractDbName(uri, fallback) {
  try {
    const url = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
    const pathname = url.pathname.replace(/^\//, '');
    return pathname ? decodeURIComponent(pathname.split('?')[0]) : fallback;
  } catch {
    return fallback;
  }
}

const SOURCE_DB_NAME = args['source-db'] || extractDbName(SOURCE_URI, 'test');
const TARGET_DB_NAME = args['target-db'] || extractDbName(TARGET_URI, 'iic-nitdgp');

function sanitizeUri(uri) {
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

async function runMigration() {
  console.log('='.repeat(65));
  console.log('       MONGODB MIGRATION: CLOUD -> LOCAL DOCKER COMPOSE');
  console.log('='.repeat(65));
  console.log(`Source URI:     ${sanitizeUri(SOURCE_URI)}`);
  console.log(`Source DB:      ${SOURCE_DB_NAME}`);
  console.log(`Target URI:     ${sanitizeUri(TARGET_URI)}`);
  console.log(`Target DB:      ${TARGET_DB_NAME}`);
  console.log(`Batch Size:     ${BATCH_SIZE}`);
  console.log(`Drop on Target: ${SHOULD_DROP ? 'YES (clean overwrite of local target)' : 'NO (append mode)'}`);
  console.log(`Dry Run:        ${IS_DRY_RUN ? 'YES (no writes)' : 'NO'}`);
  console.log('Safety Check:   Source (Cloud DB) is 100% READ-ONLY (no deletes, drops, or updates).');
  console.log('-'.repeat(65));

  let sourceClient;
  let targetClient;

  try {
    console.log(' Connecting to source MongoDB (cloud)...');
    sourceClient = new MongoClient(SOURCE_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    await sourceClient.connect();
    console.log(' Connected to source MongoDB.');

    if (!IS_DRY_RUN) {
      console.log(' Connecting to target MongoDB (local)...');
      try {
        targetClient = new MongoClient(TARGET_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        await targetClient.connect();
        console.log(' Connected to target MongoDB.');
      } catch (err) {
        console.error('\n❌ Could not connect to target MongoDB at ' + TARGET_URI);
        console.error('Make sure your local MongoDB container is running with:');
        console.error('  docker compose up -d mongodb\n');
        throw err;
      }
    }

    const sourceDb = sourceClient.db(SOURCE_DB_NAME);
    const targetDb = targetClient ? targetClient.db(TARGET_DB_NAME) : null;

    if (!IS_DRY_RUN && targetDb && (args['only-if-empty'] || args.onlyIfEmpty)) {
      const existingCollections = await targetDb.listCollections().toArray();
      let totalExistingDocs = 0;
      for (const col of existingCollections) {
        if (!col.name.startsWith('system.')) {
          totalExistingDocs += await targetDb.collection(col.name).countDocuments();
        }
      }
      if (totalExistingDocs > 0) {
        console.log(`\nℹ Target database "${TARGET_DB_NAME}" already contains data (${totalExistingDocs} documents across ${existingCollections.length} collections).`);
        console.log('Skipping migration because --only-if-empty was specified.\n');
        return;
      }
    }

    const collections = await sourceDb.listCollections().toArray();
    const collectionNames = collections
      .map(c => c.name)
      .filter(name => !name.startsWith('system.'));

    if (collectionNames.length === 0) {
      console.log(`⚠️ No collections found in database "${SOURCE_DB_NAME}".`);
      return;
    }

    console.log(`\nFound ${collectionNames.length} collections to process.\n`);

    const summary = [];

    for (const colName of collectionNames) {
      const sourceCol = sourceDb.collection(colName);
      const totalDocs = await sourceCol.countDocuments();
      const sourceIndexes = await sourceCol.indexes();

      // Clean index specs: ignore default `_id_`, remove `v` and `ns`
      const customIndexes = sourceIndexes
        .filter(idx => idx.name !== '_id_')
        .map(idx => {
          const { v, ns, ...spec } = idx;
          return spec;
        });

      if (IS_DRY_RUN) {
        console.log(`[DRY-RUN] ${colName}: ${totalDocs} documents, ${customIndexes.length} custom index(es)`);
        summary.push({
          collection: colName,
          sourceDocs: totalDocs,
          targetDocs: 'N/A',
          indexes: customIndexes.length,
          status: 'SKIPPED (dry run)'
        });
        continue;
      }

      const targetCol = targetDb.collection(colName);

      // Check if target collection exists
      const targetCollections = await targetDb.listCollections({ name: colName }).toArray();
      const targetExists = targetCollections.length > 0;

      if (SHOULD_DROP && targetExists) {
        await targetCol.drop();
      }

      // Recreate custom indexes
      if (customIndexes.length > 0) {
        try {
          await targetCol.createIndexes(customIndexes);
        } catch (indexErr) {
          console.warn(`  ⚠️ Warning: Failed to create some indexes on "${colName}": ${indexErr.message}`);
        }
      }

      // Transfer documents in batches
      let migratedCount = 0;
      if (totalDocs > 0) {
        const cursor = sourceCol.find({});
        let batch = [];

        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          batch.push(doc);

          if (batch.length >= BATCH_SIZE) {
            await targetCol.insertMany(batch, { ordered: false });
            migratedCount += batch.length;
            process.stdout.write(`  -> [${colName}] Migrated ${migratedCount}/${totalDocs} docs...\r`);
            batch = [];
          }
        }

        if (batch.length > 0) {
          await targetCol.insertMany(batch, { ordered: false });
          migratedCount += batch.length;
        }
      }

      const finalTargetCount = await targetCol.countDocuments();
      const isMatch = finalTargetCount === totalDocs;

      console.log(`✓ [${colName}] Migrated ${finalTargetCount}/${totalDocs} docs | ${customIndexes.length} index(es)`);

      summary.push({
        collection: colName,
        sourceDocs: totalDocs,
        targetDocs: finalTargetCount,
        indexes: customIndexes.length,
        status: isMatch ? '✓ MATCH' : '⚠ MISMATCH'
      });
    }

    console.log('\n' + '='.repeat(65));
    console.log('                     MIGRATION SUMMARY');
    console.log('='.repeat(65));
    console.table(summary);

    const allMatched = summary.every(s => s.status === '✓ MATCH');
    if (allMatched) {
      console.log('🎉 Migration completed successfully! All collections and documents match.\n');
    } else {
      console.log('⚠️ Migration completed with some differences. Check the summary table above.\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

runMigration();

