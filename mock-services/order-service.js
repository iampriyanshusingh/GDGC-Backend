import express from 'express';

const app = express();
const PORT = 3002;

app.use(express.json());


app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service' });
});

app.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  res.json({
    message: 'Order service is running',
    requestedBy: userId || 'unknown',
    orders: [
      { id: 101, userId: userId || 1, product: 'Laptop', amount: 999.99 },
      { id: 102, userId: userId || 1, product: 'Mouse', amount: 300.99 }
    ]
  })
});

app.get('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  
  res.json({
    id: parseInt(id),
    userId: userId || 1,
    product: `Product for order ${id}`,
    amount: Math.floor(Math.random() * 1000) + 10,
    status: 'pending',
    requestedBy: userId || 'unknown'
  });
});

app.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const orderData = req.body;
  
  res.status(201).json({
    id: Math.floor(Math.random() * 1000) + 100,
    userId: userId || 1,
    ...orderData,
    status: 'created',
    created: new Date().toISOString(),
    createdBy: userId || 'unknown'
  });
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});