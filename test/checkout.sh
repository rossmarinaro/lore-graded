curl -X POST http://localhost:3000/api/checkout \
  -b "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWMzZGUyNDBlNDUxODY5NTIxOWE4NzgiLCJlbWFpbCI6InJvc3MubWFyaW5hcm9AdG9wdGFsLmNvbSIsImlhdCI6MTc5MTMwNzk1NiwiZXhwIjoxNzkxMzk0MzU2fQ.5Vn4L8UHuQfdvKcTkFl_KJqp3u0NlA465Dp6qOtnpS0" \
  -H "Content-Type: application/json" \
  -d '{"_id": "ObjectId('6ac3de240e4518695219a878')"}'
