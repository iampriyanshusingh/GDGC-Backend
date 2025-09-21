import express from 'express';

const app = express();
const PORT = 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});


app.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  res.json({
    message: 'Payment service is running',
    requestedBy: userId || 'unknown',
    payments: [
      { id: 201, userId: userId || 1, orderId: 101, amount: 999.99, status: 'completed' },
      { id: 202, userId: userId || 1, orderId: 102, amount: 300.99, status: 'pending' }
    ]
  });
});

app.get('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  
  res.json({
    id: parseInt(id),
    userId: userId || 1,
    orderId: Math.floor(Math.random() * 100) + 100,
    amount: Math.floor(Math.random() * 1000) + 10,
    status: Math.random() > 0.5 ? 'completed' : 'pending',
    requestedBy: userId || 'unknown'
  });
});

app.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const paymentData = req.body;
  

  setTimeout(() => {
    res.status(201).json({
      id: Math.floor(Math.random() * 1000) + 200,
      userId: userId || 1,
      ...paymentData,
      status: Math.random() > 0.2 ? 'completed' : 'failed',
      processed: new Date().toISOString(),
      processedBy: userId || 'unknown'
    });
  }, 1000);
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});