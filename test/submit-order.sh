curl -X POST http://localhost:3000/api2/api/submit-order \
  -b "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWMzZGUyNDBlNDUxODY5NTIxOWE4NzgiLCJlbWFpbCI6InJvc3MubWFyaW5hcm9AdG9wdGFsLmNvbSIsImlhdCI6MTc5MTU3Mjk3NSwiZXhwIjoxNzkxNjU5Mzc1fQ.kltJU750Fn9r-DRZbcN_M_wJg-tfIDTkM7Yp_w2XO-Y" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "69420"}'
