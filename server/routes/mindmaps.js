const express = require("express");
const { check, validationResult } = require("express-validator");
const MindMap = require("../models/MindMap");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Get all mind maps for authenticated user
router.get("/dashboard", protect, async (req, res) => {
  try {
    // Get all mind maps for the user, but only fetch the _id, title, description, tags, updatedAt, and nodes length
    const mindMaps = await MindMap.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title description tags updatedAt nodes");

    // Map to include nodeCount instead of full nodes array
    const mindMapsWithNodeCount = mindMaps.map((map) => ({
      _id: map._id,
      title: map.title,
      description: map.description,
      tags: map.tags,
      updatedAt: map.updatedAt,
      nodeCount: Array.isArray(map.nodes) ? map.nodes.length : 0,
    }));

    res.json(mindMapsWithNodeCount);
  } catch (error) {
    console.error("Get mind maps error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific mind map
router.get("/:id", protect, async (req, res) => {
  try {
    const mindMap = await MindMap.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!mindMap) {
      return res.status(404).json({ message: "Mind map not found" });
    }

    res.json(mindMap);
  } catch (error) {
    console.error("Get mind map error:", error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Mind map not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new mind map
router.post(
  "/dashboard",
  [protect, [check("title", "Title is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, tags, nodes, isPublic } = req.body;

    try {
      const newMindMap = new MindMap({
        title,
        description: description || "",
        tags: tags || [],
        nodes: nodes || [],
        isPublic: isPublic || false,
        userId: req.user._id,
      });

      const mindMap = await newMindMap.save();
      res.status(201).json(mindMap);
    } catch (error) {
      console.error("Create mind map error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update a mind map
router.put("/:id", protect, async (req, res) => {
  try {
    const { title, description, tags, nodes, isPublic } = req.body;

    const mindMap = await MindMap.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        title,
        description,
        tags,
        nodes,
        isPublic,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!mindMap) {
      return res.status(404).json({ message: "Mind map not found" });
    }

    res.json(mindMap);
  } catch (error) {
    console.error("Update mind map error:", error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Mind map not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a mind map
router.delete("/:id", protect, async (req, res) => {
  try {
    const mindMap = await MindMap.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!mindMap) {
      return res.status(404).json({ message: "Mind map not found" });
    }

    res.json({ message: "Mind map removed" });
  } catch (error) {
    console.error("Delete mind map error:", error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Mind map not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
