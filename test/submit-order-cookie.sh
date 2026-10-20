curl -X POST http://localhost:3000/api2/api/submit-order \
  -b "session_id=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWMzZGUyNDBlNDUxODY5NTIxOWE4NzgiLCJlbWFpbCI6InJvc3MubWFyaW5hcm9AdG9wdGFsLmNvbSIsImlhdCI6MTc5MTgyNTk1NSwiZXhwIjoxNzkxOTEyMzU1fQ.rWrrdXKkfAf8rCrpnRHClQeLSlWWdPB6zhfMyn40nXI" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "69420", "order_id": "69420"}'
