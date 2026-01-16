#!/bin/bash

# 1. Pagination
curl -X PATCH "http://localhost:7700/indexes/papers/settings/pagination" \
     -H "Authorization: Bearer 1234" \
     -H "Content-Type: application/json" \
     -d '{"maxTotalHits": 1000000}'

# 2. Sortable Attributes
curl -X PUT "http://localhost:7700/indexes/papers/settings/sortable-attributes" \
     -H "Authorization: Bearer 1234" \
     -H "Content-Type: application/json" \
     -d '["year"]'

# 3. Ranking Rules
curl -X PUT "http://localhost:7700/indexes/papers/settings/ranking-rules" \
     -H "Authorization: Bearer 1234" \
     -H "Content-Type: application/json" \
     -d '["sort", "words", "typo", "proximity", "attribute", "exactness"]'