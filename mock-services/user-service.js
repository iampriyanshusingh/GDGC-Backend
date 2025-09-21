import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});


app.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  res.json({
    message: 'User service is running',
    requestedBy: userId || 'unknown',
    users: [
      { id: 1, name: 'Priyanshu Singh', email: 'priyanshu@example.com' },
      { id: 2, name: 'Parikshit Singh', email: 'parikshit@example.com' }
    ]
  });
});

app.get('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { id } = req.params;
  
  res.json({
    id: parseInt(id),
    name: `User ${id}`,
    email: `user${id}@example.com`,
    requestedBy: userId || 'unknown'
  });
});

app.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userData = req.body;
  
  res.status(201).json({
    id: Math.floor(Math.random() * 1000),
    ...userData,
    created: new Date().toISOString(),
    createdBy: userId || 'unknown'
  });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});