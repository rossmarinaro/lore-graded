curl -X POST http://localhost:3000/api2/api/checkout \
  -b "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWMzZGUyNDBlNDUxODY5NTIxOWE4NzgiLCJlbWFpbCI6InJvc3MubWFyaW5hcm9AdG9wdGFsLmNvbSIsImlhdCI6MTc5MTU3Mjk3NSwiZXhwIjoxNzkxNjU5Mzc1fQ.kltJU750Fn9r-DRZbcN_M_wJg-tfIDTkM7Yp_w2XO-Y" \
  -H "Content-Type: application/json" \
  -d '{"_id": "ObjectId('6ac3de240e4518695219a878')"}'
