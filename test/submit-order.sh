curl -X POST http://localhost:3000/api2/api/submit-order \
  -b "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWMzZGUyNDBlNDUxODY5NTIxOWE4NzgiLCJlbWFpbCI6InJvc3MubWFyaW5hcm9AdG9wdGFsLmNvbSIsImlhdCI6MTc5MTU3OTY1MCwiZXhwIjoxNzkxNjY2MDUwfQ.qmf1-nkXjwHBDbiFdArROHNmJ7CTwneQ9WOnLnbT6ok" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "69420"}'
