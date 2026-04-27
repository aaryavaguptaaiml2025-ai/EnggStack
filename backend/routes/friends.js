const router = require("express").Router();
const auth   = require("../middleware/auth");
const User   = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const { Stats } = require("../models");

// ── Search users by username or email ──────────────────────────────────────
router.get("/search", auth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) return res.json([]);

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email:    { $regex: q, $options: "i" } },
        { name:     { $regex: q, $options: "i" } },
      ],
    })
    .select("name username email avatar googleAvatar avatarEmoji")
    .limit(10);

    res.json(users.map(u => ({
      id: u._id,
      name: u.name,
      username: u.username,
      email: u.email,
      avatar: u.avatar || u.googleAvatar || "",
      avatarEmoji: u.avatarEmoji || "🎓",
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Send friend request ────────────────────────────────────────────────────
router.post("/request", auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ error: "toUserId required" });
    if (toUserId === req.user.id) return res.status(400).json({ error: "Cannot friend yourself" });

    // Check if already friends or pending
    const existing = await FriendRequest.findOne({
      $or: [
        { from: req.user.id, to: toUserId },
        { from: toUserId, to: req.user.id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") return res.status(400).json({ error: "Already friends" });
      if (existing.status === "pending") return res.status(400).json({ error: "Request already pending" });
      // If rejected, allow re-send
      if (existing.status === "rejected") {
        existing.status = "pending";
        existing.from = req.user.id;
        existing.to = toUserId;
        existing.createdAt = new Date();
        await existing.save();
        return res.json({ ok: true, message: "Friend request sent" });
      }
    }

    await FriendRequest.create({ from: req.user.id, to: toUserId });
    res.json({ ok: true, message: "Friend request sent" });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: "Request already exists" });
    res.status(500).json({ error: e.message });
  }
});

// ── Get pending requests (incoming + outgoing) ─────────────────────────────
router.get("/requests", auth, async (req, res) => {
  try {
    const incoming = await FriendRequest.find({ to: req.user.id, status: "pending" })
      .populate("from", "name username avatar googleAvatar avatarEmoji")
      .sort("-createdAt");

    const outgoing = await FriendRequest.find({ from: req.user.id, status: "pending" })
      .populate("to", "name username avatar googleAvatar avatarEmoji")
      .sort("-createdAt");

    res.json({
      incoming: incoming.map(r => ({
        id: r._id,
        user: { id: r.from._id, name: r.from.name, username: r.from.username, avatar: r.from.avatar || r.from.googleAvatar || "" },
        createdAt: r.createdAt,
      })),
      outgoing: outgoing.map(r => ({
        id: r._id,
        user: { id: r.to._id, name: r.to.name, username: r.to.username, avatar: r.to.avatar || r.to.googleAvatar || "" },
        createdAt: r.createdAt,
      })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Accept / reject request ────────────────────────────────────────────────
router.patch("/request/:id", auth, async (req, res) => {
  try {
    const { action } = req.body; // "accept" or "reject"
    if (!["accept", "reject"].includes(action))
      return res.status(400).json({ error: "action must be 'accept' or 'reject'" });

    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.to.toString() !== req.user.id)
      return res.status(403).json({ error: "Not your request to handle" });

    request.status = action === "accept" ? "accepted" : "rejected";
    await request.save();

    res.json({ ok: true, message: action === "accept" ? "Friend added!" : "Request declined" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── List accepted friends ──────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const accepted = await FriendRequest.find({
      status: "accepted",
      $or: [{ from: req.user.id }, { to: req.user.id }],
    });

    const friendIds = accepted.map(r =>
      r.from.toString() === req.user.id ? r.to : r.from
    );

    const friends = await User.find({ _id: { $in: friendIds } })
      .select("name username avatar googleAvatar avatarEmoji");

    // Get stats for each friend (summary only)
    const statsMap = {};
    const allStats = await Stats.find({ user: { $in: friendIds } });
    allStats.forEach(s => { statsMap[s.user.toString()] = s; });

    res.json(friends.map(f => ({
      id: f._id,
      name: f.name,
      username: f.username,
      avatar: f.avatar || f.googleAvatar || "",
      xp: statsMap[f._id.toString()]?.xp || 0,
      streak: statsMap[f._id.toString()]?.streak || 0,
      totalMins: statsMap[f._id.toString()]?.totalMins || 0,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Get friend stats (read-only summary) ───────────────────────────────────
router.get("/:id/stats", auth, async (req, res) => {
  try {
    // Verify they are actually friends
    const areFriends = await FriendRequest.findOne({
      status: "accepted",
      $or: [
        { from: req.user.id, to: req.params.id },
        { from: req.params.id, to: req.user.id },
      ],
    });
    if (!areFriends) return res.status(403).json({ error: "Not friends" });

    const user = await User.findById(req.params.id).select("name username avatar googleAvatar");
    const stats = await Stats.findOne({ user: req.params.id });

    res.json({
      user: { name: user?.name, username: user?.username, avatar: user?.avatar || user?.googleAvatar || "" },
      stats: {
        xp: stats?.xp || 0,
        streak: stats?.streak || 0,
        totalMins: stats?.totalMins || 0,
        pomodoros: stats?.pomodoros || 0,
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Remove friend ──────────────────────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    await FriendRequest.findOneAndDelete({
      status: "accepted",
      $or: [
        { from: req.user.id, to: req.params.id },
        { from: req.params.id, to: req.user.id },
      ],
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
