curl -X POST http://localhost:3000/api2/api/submit-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWMzZGUyNDBlNDUxODY5NTIxOWE4NzgiLCJlbWFpbCI6InJvc3MubWFyaW5hcm9AdG9wdGFsLmNvbSIsImlhdCI6MTc5MTgzNjIzMywiZXhwIjoxNzkxODM2NTMzfQ.g1HfAbRafn6tfMOUSVRKOhRf4Au4m-StTS2sKpdGSfc" \
  -d '{"order_id": "69420"}'
