import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

// Load environment variables
dotenv.config({
  quiet: true
});

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(express.json());

// API Routes with /api prefix
app.use('/api', routes);

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export for testing
export default server;