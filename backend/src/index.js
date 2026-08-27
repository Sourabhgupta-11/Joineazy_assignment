require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { generalLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const groupRoutes = require('./routes/group.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const submissionRoutes = require('./routes/submission.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '100kb' }));

app.use('/api', generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({status: 'ok', timestamp: new Date().toISOString()});
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({message: 'Route not found'});
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({message: 'Internal server error'});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`GroupSync backend running on port ${PORT}`);
});