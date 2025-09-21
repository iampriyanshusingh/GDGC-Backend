# API Gateway with Node.js

A comprehensive API Gateway built with Node.js and Express.js that provides centralized authentication, per-user rate limiting, and service health checks with graceful failover.

## Features

- **Centralized Authentication**: JWT-based authentication for all API routes
- **Per-user Rate Limiting**: Redis-backed rate limiting with configurable limits per user
- **Service Health Checks**: Automatic monitoring with failover capabilities
- **Request Proxying**: Intelligent routing to healthy microservices
- **Comprehensive Logging**: Request tracking and error monitoring
- **Security**: Helmet.js security headers and CORS protection

## Architecture

```
Client Request → API Gateway → Authentication → Rate Limiting → Service Routing → Microservice
                      ↓
                Health Checks ← Redis ← Logging
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the `.env` file and configure your settings:

- `JWT_SECRET`: Secret key for JWT token signing
- `REDIS_URL`: Redis connection URL for rate limiting
- Service URLs for your microservices

### 3. Start Mock Services

In separate terminals, start the mock microservices:

```bash
# Terminal 1
node mock-services/user-service.js

# Terminal 2  
node mock-services/order-service.js

# Terminal 3
node mock-services/payment-service.js
```

### 4. Start API Gateway

```bash
npm start
```

The API Gateway will be running on `http://localhost:3000`

## API Usage

### 1. Authentication

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password"}'
```

### 2. Making Authenticated Requests

```bash
# Use the token from login response
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Available Endpoints

- `POST /auth/login` - Authenticate and get JWT token
- `GET /health` - Gateway and service health status
- `GET /api/users` - User service proxy
- `GET /api/orders` - Order service proxy  
- `GET /api/payments` - Payment service proxy

## Rate Limiting

- **Window**: 15 minutes (configurable)
- **Limit**: 100 requests per user per window (configurable)
- **Storage**: Redis (with memory fallback)
- **Headers**: `X-RateLimit-*` headers included in responses

## Health Monitoring

- **Frequency**: Every 30 seconds
- **Timeout**: 5 seconds per check
- **Failure Threshold**: 3 consecutive failures
- **Automatic Failover**: Requests routed only to healthy services

## Configuration

Key environment variables:

```env
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Production Deployment

1. **Security**: Change default JWT secret and use strong passwords
2. **Redis**: Set up Redis cluster for high availability
3. **Monitoring**: Implement proper logging and monitoring solutions
4. **Load Balancing**: Use multiple gateway instances behind a load balancer
5. **SSL/TLS**: Enable HTTPS for all communications

## Testing

Test the complete flow:

```bash
# 1. Get authentication token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password"}' | \
  grep -o '"token":"[^"]*' | grep -o '[^"]*$')

# 2. Make authenticated request
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/users

# 3. Check health status
curl http://localhost:3000/health
```

## Architecture Benefits

- **Scalability**: Independent scaling of gateway and services
- **Security**: Centralized authentication and authorization
- **Reliability**: Health checks ensure high availability
- **Performance**: Rate limiting prevents service overload
- **Monitoring**: Comprehensive logging and metrics