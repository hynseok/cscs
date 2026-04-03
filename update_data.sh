#!/bin/bash

set -e

echo "Starting data population process..."

# 1. Download DBLP XML
echo "Downloading dblp.xml.gz..."
wget --show-progress -O parser/dblp.xml.gz https://dblp.org/xml/dblp.xml.gz

echo "Downloading dblp.dtd..."
wget --show-progress -O parser/dblp.dtd https://dblp.org/xml/dblp.dtd

# 2. Extract the XML
echo "Extracting dblp.xml.gz..."
gunzip -f parser/dblp.xml.gz

# 3. Run the parser
echo "Running the parser to import data into PostgreSQL..."
cd parser
cargo run --release
cd ..

# 4. Sync data to Meilisearch
echo "Syncing data to Meilisearch..."
cd sync
cargo run --release
cd ..

# 5. Cleanup
echo "Cleaning up downloaded files..."
rm -f parser/dblp.xml.gz parser/dblp.xml parser/dblp.dtd

# 6. Flush Redis Cache
echo "Flushing Redis cache..."
docker exec cscs-cache redis-cli FLUSHALL || echo "Warning: Could not flush Redis cache."

echo "Data update completed successfully!"
