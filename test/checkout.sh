curl -X POST http://localhost:3000/api/checkout \
  -b "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWMzZGUyNDBlNDUxODY5NTIxOWE4NzgiLCJlbWFpbCI6InJvc3MubWFyaW5hcm9AdG9wdGFsLmNvbSIsImlhdCI6MTc5MTM5ODA2NSwiZXhwIjoxNzkxNDg0NDY1fQ._piUINFzPCttyxjLrY0Og1OQivYDVmWwZOsECmFsMeQ" \
  -H "Content-Type: application/json" \
  -d '{"_id": "ObjectId('6ac3de240e4518695219a878')"}'
