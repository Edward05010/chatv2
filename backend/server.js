require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');
const auth = require('./middleware/auth');
const upload = require('./upload');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ========== MILESTONE CONFIG ==========
const MILESTONES = [
  { minutes: 30,    label: '30 minutes' },
  { minutes: 60,    label: '1 hour'     },
  { minutes: 300,   label: '5 hours'    },
  { minutes: 600,   label: '10 hours'   },
  { minutes: 1500,  label: '25 hours'   },
  { minutes: 3000,  label: '50 hours'   },
  { minutes: 4500,  label: '75 hours'   },
  { minutes: 6000,  label: '100 hours'  },
  { minutes: 12000, label: '200 hours'  },
  { minutes: 18000, label: '300 hours'  },
];

const getMonthKey = (date) => {
  const d = date || new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

// FIXED: Now returns newlyUnlocked for better tracking
const syncAchievements = async (userId, silent = false) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthKey   = getMonthKey(now);

  const Todo = require('./models/Todo');
  const StudySession = require('./models/StudySession');
  const Notification = require('./models/Notification');

  // Sum all sessions this month
  const sessions = await StudySession.find({
    user: userId,
    date: { $gte: monthStart, $lt: monthEnd }
  });
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

  const user = await User.findById(userId);
  const alreadyAwarded = user.monthlyAchievements.get(monthKey) || [];

  // Find milestones crossed but not yet awarded
  const newlyUnlocked = MILESTONES.filter(m =>
    totalMinutes >= m.minutes && !alreadyAwarded.includes(m.minutes)
  );

  if (newlyUnlocked.length > 0) {
    user.monthlyAchievements.set(monthKey, [
      ...alreadyAwarded,
      ...newlyUnlocked.map(m => m.minutes)
    ]);
    await user.save();

    // Only create notifications when NOT in silent/backfill mode
    if (!silent) {
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      for (const milestone of newlyUnlocked) {
        const notification = new Notification({
          user: userId,
          text: `Achievement unlocked! You studied ${milestone.label} this month! [ACHIEVEMENT:${milestone.minutes}]`,
          time: timeStr
        });
        await notification.save();
      }
    }
  }

  // Return the final up-to-date earned list AND newly unlocked
  const finalUser = await User.findById(userId);
  const earned = finalUser.monthlyAchievements.get(monthKey) || [];
  return { earned, totalMinutes, monthKey, newlyUnlocked };
};

// ========== AUTH ROUTES ==========

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture || '' }
    });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture || '' }
    });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== USER ROUTES ==========

app.get('/api/users/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.userId }
    }).select('username email profilePicture').limit(10);
    res.json(users);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/users/add-friend/:userId', auth, async (req, res) => {
  try {
    const friendId = req.params.userId;
    const user = await User.findById(req.userId);
    if (user.friends.includes(friendId)) return res.status(400).json({ error: 'Already friends' });
    user.friends.push(friendId);
    await user.save();
    await User.findByIdAndUpdate(friendId, { $addToSet: { friends: req.userId } });
    res.json({ message: 'Friend added successfully' });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/users/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username email profilePicture');
    const friendsWithLastMessage = await Promise.all(
      user.friends.map(async (friend) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.userId, receiver: friend._id },
            { sender: friend._id, receiver: req.userId }
          ]
        }).sort({ createdAt: -1 }).select('content sender createdAt').limit(1);
        return {
          ...friend.toObject(),
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            isSentByMe: lastMessage.sender.toString() === req.userId.toString(),
            timestamp: lastMessage.createdAt
          } : null
        };
      })
    );
    friendsWithLastMessage.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return new Date(timeB) - new Date(timeA);
    });
    res.json(friendsWithLastMessage);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== PROFILE ROUTES ==========

app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/profile/picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const profilePictureUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.userId, { profilePicture: profilePictureUrl });
    res.json({ profilePicture: profilePictureUrl });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/profile', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { email }, { new: true, runValidators: true }).select('-password');
    res.json(user);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== MESSAGE ROUTES ==========

app.get('/api/messages/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username email _id profilePicture')
    .populate('receiver', 'username email _id profilePicture')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username _id' } });
    res.json(messages);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/messages/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image'
                   : req.file.mimetype.startsWith('video/') ? 'video' : 'document';
    res.json({ fileUrl, fileType, fileName: req.file.originalname, fileSize: req.file.size });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== GROUP ROUTES ==========

app.post('/api/groups/create', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const group = new Group({ name, description, admin: req.userId, members: [req.userId, ...members] });
    await group.save();
    await group.populate('members admin', 'username profilePicture');
    res.status(201).json(group);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/groups', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('members admin', 'username profilePicture')
      .sort({ createdAt: -1 });
    const groupsWithLastMessage = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({ group: group._id })
          .sort({ createdAt: -1 }).select('content sender createdAt').populate('sender', 'username').limit(1);
        return {
          ...group.toObject(),
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            senderName: lastMessage.sender.username,
            timestamp: lastMessage.createdAt
          } : null
        };
      })
    );
    res.json(groupsWithLastMessage);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/groups/:groupId/messages', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group.members.includes(req.userId)) return res.status(403).json({ error: 'Not a member of this group' });
    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username _id' } });
    res.json(messages);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/groups/:groupId/picture', auth, upload.single('groupPicture'), async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId.toString()) return res.status(403).json({ error: 'Only admin can update group picture' });
    const groupPictureUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    group.groupPicture = groupPictureUrl;
    await group.save();
    await group.populate('members admin', 'username profilePicture');
    res.json({ success: true, groupPicture: groupPictureUrl, group });
  } catch (error) { res.status(400).json({ error: error.message || 'Error uploading group picture' }); }
});

app.post('/api/groups/:groupId/add-members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const group = await Group.findById(groupId);
    if (group.admin.toString() !== req.userId) return res.status(403).json({ error: 'Only admin can add members' });
    group.members.push(...members);
    await group.save();
    await group.populate('members admin', 'username profilePicture');
    res.json(group);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/groups/:groupId/members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.members.map(m => m.toString()).includes(userId)) return res.status(400).json({ error: 'User already in group' });
    group.members.push(userId);
    await group.save();
    await group.populate('members admin', 'username profilePicture');
    res.json(group);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/groups/:groupId/members/:userId', auth, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId.toString()) return res.status(403).json({ error: 'Only admin can remove members' });
    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();
    await group.populate('members admin', 'username profilePicture');
    res.json(group);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/groups/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId.toString()) return res.status(403).json({ error: 'Only admin can update group' });
    group.name = name;
    await group.save();
    await group.populate('members admin', 'username profilePicture');
    res.json(group);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/groups/:groupId/leave', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    group.members = group.members.filter(m => m.toString() !== req.userId);
    if (group.admin.toString() === req.userId) {
      if (group.members.length > 0) { group.admin = group.members[0]; }
      else { await Group.findByIdAndDelete(groupId); return res.json({ message: 'Group deleted' }); }
    }
    await group.save();
    res.json({ message: 'Left group' });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/groups/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.admin.toString() !== req.userId.toString()) return res.status(403).json({ error: 'Only admin can delete the group' });
    await Message.deleteMany({ group: groupId });
    await Group.findByIdAndDelete(groupId);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== TODO ROUTES ==========

const Todo = require('./models/Todo');
const StudySession = require('./models/StudySession');
const Notification = require('./models/Notification');

app.get('/api/todos', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/todos', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const todo = new Todo({ user: req.userId, text });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/todos/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, text } = req.body;
    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: req.userId }, { completed, text }, { new: true }
    );
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Todo.findOneAndDelete({ _id: id, user: req.userId });
    res.json({ message: 'Todo deleted' });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== STUDY SESSION ROUTES ==========

// FIXED: Now properly returns and uses newlyUnlocked
app.post('/api/study-session', auth, async (req, res) => {
  try {
    const { minutes, date } = req.body;

    // 1. Save the session
    const session = new StudySession({ user: req.userId, minutes, date });
    await session.save();

    // 2. Sync achievements — fires notifications for newly unlocked ones
    const { earned, totalMinutes, newlyUnlocked } = await syncAchievements(req.userId, false);

    res.status(201).json({
      session,
      monthlyTotal: totalMinutes,
      earned: earned,
      newAchievements: newlyUnlocked.map(m => m.label) // Send friendly labels
    });
  } catch (error) { 
    console.error('Study session error:', error);
    res.status(400).json({ error: error.message }); 
  }
});

app.get('/api/study-data', auth, async (req, res) => {
  try {
    const { timeframe } = req.query;
    let startDate = new Date();
    let labels = [];
    if (timeframe === 'day') {
      startDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < 24; i++) labels.push(`${i}h`);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        labels.push(days[date.getDay()]);
      }
    } else if (timeframe === 'month') {
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      for (let i = 1; i <= 4; i++) labels.push(`Week ${i}`);
    }
    const sessions = await StudySession.find({ user: req.userId, date: { $gte: startDate } });
    let data = [];
    if (timeframe === 'day') {
      const hourlyData = new Array(24).fill(0);
      sessions.forEach(s => { hourlyData[new Date(s.date).getHours()] += s.minutes; });
      data = labels.map((label, i) => ({ label, minutes: hourlyData[i] }));
    } else if (timeframe === 'week') {
      const dailyData = new Array(7).fill(0);
      sessions.forEach(s => {
        const d = Math.floor((new Date(s.date) - startDate) / 86400000);
        if (d >= 0 && d < 7) dailyData[d] += s.minutes;
      });
      data = labels.map((label, i) => ({ label, minutes: dailyData[i] }));
    } else if (timeframe === 'month') {
      const weeklyData = new Array(4).fill(0);
      sessions.forEach(s => {
        const w = Math.floor((new Date(s.date) - startDate) / 604800000);
        if (w >= 0 && w < 4) weeklyData[w] += s.minutes;
      });
      data = labels.map((label, i) => ({ label, minutes: weeklyData[i] }));
    }
    res.json(data);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== ACHIEVEMENT ROUTES ==========

app.get('/api/achievements', auth, async (req, res) => {
  try {
    const { earned, totalMinutes, monthKey } = await syncAchievements(req.userId, true);
    const now = new Date();
    res.json({
      earned,
      totalMinutes,
      monthKey,
      month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      milestones: MILESTONES // Send all available milestones
    });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== NOTIFICATION ROUTES ==========

app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 }).limit(10);
    res.json(notifications);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/notifications', auth, async (req, res) => {
  try {
    const { text, time } = req.body;
    const notification = new Notification({ user: req.userId, text, time });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.userId }, { read: true }, { new: true }
    );
    res.json(notification);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

// ========== MINDNEST AI ==========

const https = require('https');

const callMindNest = (messages) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: `You are MindNest AI, a friendly and smart assistant built into a student chat app called MindNest. 
You help students with their studies, answer questions, explain concepts, help with assignments, and provide support. 
Keep responses concise and helpful. Use markdown sparingly. Be warm and encouraging.`,
      messages
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text || 'Sorry, I could not generate a response.');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

app.post('/api/ai/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    // context is array of {role, content} for conversation history
    const messages = [
      ...(context || []),
      { role: 'user', content: message }
    ];
    const reply = await callMindNest(messages);
    res.json({ reply });
  } catch (error) {
    console.error('MindNest AI error:', error);
    res.status(500).json({ error: 'MindNest AI failed to respond' });
  }
});

// ========== SOCKET.IO ==========

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      userSockets.set(decoded.userId, socket.id);
      console.log('User authenticated:', decoded.userId);
    } catch (error) { console.log('Socket auth failed'); }
  });

  socket.on('send_message', async (data) => {
    try {
      const { receiverId, groupId, content, fileUrl, fileType, fileName, replyTo } = data;
      const messageData = {
        sender: socket.userId, content,
        fileUrl: fileUrl || null, fileType: fileType || null,
        fileName: fileName || null, replyTo: replyTo || null,
      };

      if (groupId) {
        messageData.group = groupId;
        const message = new Message(messageData);
        await message.save();
        await message.populate('sender', 'username profilePicture');
        await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'username _id' } });

        const group = await Group.findById(groupId);
        const sender = await User.findById(socket.userId);

        group.members.forEach(async (memberId) => {
          if (memberId.toString() !== socket.userId.toString()) {
            const notification = new Notification({
              user: memberId,
              text: `${sender.username} sent a message in ${group.name}`,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            });
            await notification.save();
            const memberSocketId = userSockets.get(memberId.toString());
            if (memberSocketId) io.to(memberSocketId).emit('new_notification', notification);
          }
        });

        group.members.forEach(memberId => {
          const memberSocketId = userSockets.get(memberId.toString());
          if (memberSocketId) io.to(memberSocketId).emit('receive_message', message);
        });

      } else {
        messageData.receiver = receiverId;
        const message = new Message(messageData);
        await message.save();
        await message.populate('sender receiver', 'username profilePicture');
        await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'username _id' } });

        const sender = await User.findById(socket.userId);
        const notification = new Notification({
          user: receiverId,
          text: `${sender.username} sent you a message`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
        await notification.save();

        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', message);
          io.to(receiverSocketId).emit('new_notification', notification);
        }
        socket.emit('message_sent', message);
      }
    } catch (error) { socket.emit('error', { message: error.message }); }
  });

  socket.on('react_message', async (data) => {
    try {
      const { messageId, emoji } = data;
      const message = await Message.findById(messageId);
      if (!message) return;

      const reactions = message.reactions || new Map();
      const users = reactions.get(emoji) || [];
      const idx = users.indexOf(socket.userId.toString());
      if (idx > -1) { users.splice(idx, 1); } else { users.push(socket.userId.toString()); }
      if (users.length === 0) { reactions.delete(emoji); } else { reactions.set(emoji, users); }
      message.reactions = reactions;
      await message.save();

      const reactionsObj = {};
      message.reactions.forEach((v, k) => { reactionsObj[k] = v; });

      if (message.group) {
        const group = await Group.findById(message.group);
        group.members.forEach(memberId => {
          const sid = userSockets.get(memberId.toString());
          if (sid) io.to(sid).emit('reaction_updated', { messageId, reactions: reactionsObj });
        });
      } else {
        [userSockets.get(message.sender.toString()), userSockets.get(message.receiver.toString())]
          .forEach(sid => { if (sid) io.to(sid).emit('reaction_updated', { messageId, reactions: reactionsObj }); });
      }
    } catch (error) { console.error('React error:', error.message); }
  });

  socket.on('disconnect', () => {
    if (socket.userId) userSockets.delete(socket.userId);
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));