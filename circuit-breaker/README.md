docker build -f db.Dockerfile -t circuit-breaker .
docker run --name circuit-brkr-container -p 5400:5432 -d circuit-breaker

curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Abhinav","email":"abhinav@test.com"}'

curl -X GET http://localhost:3000/users/1

Order Service (port 3001)
➕ Create Order
curl -X POST http://localhost:3001/orders \
 -H "Content-Type: application/json" \
 -d '{"user_id":1,"amount":500}'

📄 Get Order by ID
curl http://localhost:3001/orders/1


Payment Service (port 3002)
➕ Create Payment
curl -X POST http://localhost:3002/payments \
  -H "Content-Type: application/json" \
  -d '{"order_id":1,"amount":500}'

📄 Get Payment by ID
curl http://localhost:3002/payments/1


Inventory Service (port 3003)
➕ Create Inventory Item
curl -X POST http://localhost:3003/inventory \
  -H "Content-Type: application/json" \
  -d '{"product_name":"Laptop","quantity":10}'

📄 Get Inventory Item by ID
curl http://localhost:3003/inventory/1