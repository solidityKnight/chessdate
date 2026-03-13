const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, async (req, res) => {
  try {
    const { moves } = req.body;

    if (!moves || !Array.isArray(moves)) {
      return res.status(400).json({ message: 'Invalid moves list provided' });
    }

    if (moves.length === 0) {
      return res.status(400).json({ message: 'Cannot analyze an empty game' });
    }

    // Limit analysis length for memory/performance
    const maxMoves = 200;
    const movesToAnalyze = moves.slice(0, maxMoves);

    console.log(`Analyzing game with ${movesToAnalyze.length} moves...`);
    const results = await analysisService.analyzeGame(movesToAnalyze);

    res.json(results);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze game. Please try again later.' });
  }
});

module.exports = router;
