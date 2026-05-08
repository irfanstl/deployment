import express from 'express';
import { Op } from 'sequelize';
import { Product, Review, sequelize } from '../models.js';

const router = express.Router();

const levenshtein = (s, t) => {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] =
        i === 0 ? j : Math.min(
          arr[i - 1][j] + 1,
          arr[i][j - 1] + 1,
          arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
        );
    }
  }
  return arr[t.length][s.length];
};

const executeRegexSearch = async (q, limit) => {
  return await Product.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { category: { [Op.like]: `%${q}%` } }
      ]
    },
    attributes: ['id', 'name', 'price', 'category', 'image', 'stock', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit,
    raw: true
  });
};

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count: totalProducts, rows: products } = await Product.findAndCountAll({
      attributes: ['id', 'name', 'price', 'category', 'image', 'stock', 'createdAt'],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      raw: true
    });

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/homepage', async (req, res) => {
  try {
    // In MySQL, to get top 10 newest per category, we can fetch all and group in memory if small, 
    // or use a window function. For simplicity, let's fetch recently created items and group them.
    const allRecent = await Product.findAll({
      order: [['createdAt', 'DESC']],
      limit: 200,
      raw: true
    });

    const groups = {};
    for (const p of allRecent) {
      if (!groups[p.category]) groups[p.category] = [];
      if (groups[p.category].length < 10) {
        groups[p.category].push(p);
      }
    }

    const grouped = Object.keys(groups).map(category => ({
      category,
      products: groups[category]
    })).sort((a, b) => a.category.localeCompare(b.category));

    res.json(grouped);
  } catch (err) {
    console.error('Homepage aggregation error:', err);
    res.status(500).json({ error: 'Failed to fetch homepage data' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ products: [], suggestion: null });

    let products = [];
    const isShortQuery = q.length < 3;

    if (isShortQuery) {
      products = await executeRegexSearch(q, 20);
    } else {
      // Sequelize MySQL doesn't have MongoDB's $text out of the box, we use LIKE for now
      products = await executeRegexSearch(q, 50);
    }

    let suggestion = null;

    if (products.length === 0) {
      const sampleProducts = await Product.findAll({
        attributes: ['name', 'category'],
        order: [['createdAt', 'DESC']],
        limit: 500,
        raw: true
      });
      let minDistance = Infinity;
      let closestMatchStr = null;
      const maxThreshold = 4;

      sampleProducts.forEach(p => {
        const words = p.name.toLowerCase().split(' ');
        for (const word of words) {
          const dist = levenshtein(q.toLowerCase(), word);
          if (dist < minDistance && dist <= maxThreshold) {
            minDistance = dist;
            closestMatchStr = p.name;
          }
        }
        if (p.category) {
          const catDist = levenshtein(q.toLowerCase(), p.category.toLowerCase());
          if (catDist < minDistance && catDist <= maxThreshold) {
            minDistance = catDist;
            closestMatchStr = p.category;
          }
        }
      });

      if (closestMatchStr) suggestion = closestMatchStr;
    }

    res.json({
      products,
      suggestion
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

const calculateWeightedRating = (reviews) => {
  if (!reviews || reviews.length === 0) return { rating: 0, count: 0, reviews: [] };

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const now = new Date();

  // Sort reviews: Vine > Verified > Written > Newer > Others
  const sortedReviews = [...reviews].sort((a, b) => {
    let scoreA = (a.isVineVoice ? 100 : 0) + (a.isVerifiedPurchase ? 50 : 0) + (a.upvotes || 0);
    let scoreB = (b.isVineVoice ? 100 : 0) + (b.isVerifiedPurchase ? 50 : 0) + (b.upvotes || 0);
    return scoreB - scoreA;
  });

  const processedReviews = sortedReviews.map(review => {
    let weight = 1.0;

    // 1. Review Recency: Drops by up to 50% over a year
    const daysOld = (now - new Date(review.createdAt)) / (1000 * 60 * 60 * 24);
    const recencyMultiplier = Math.max(0.5, 1 - (daysOld / 365) * 0.5);
    weight *= recencyMultiplier;

    // 2. Verified Purchase
    if (!review.isVerifiedPurchase) {
      weight *= 0.2; // Unverified has only 20% impact
    }

    // 3. One-Tap Ratings vs. Written Reviews
    if (!review.comment || review.comment.trim() === '') {
      weight *= 0.5; // One-tap rating has half the impact
    }

    // 4. Reviewer Trustworthiness (upvotes)
    weight += (review.upvotes || 0) * 0.1;

    // 5. Amazon Vine Program
    if (review.isVineVoice) {
      weight += 1.5; // Huge boost for Vine Voices
    }

    totalWeightedScore += review.rating * weight;
    totalWeight += weight;

    return { ...review, calculatedWeight: weight.toFixed(2) };
  });

  const weightedRating = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(1) : 0;
  
  return {
    rating: parseFloat(weightedRating),
    count: reviews.length,
    reviews: processedReviews
  };
};

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, { raw: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    // Fetch reviews to calculate Amazon-style weighted rating
    const reviews = await Review.findAll({
      where: { productId: product.id },
      raw: true
    });
    
    const ratingData = calculateWeightedRating(reviews);
    
    res.json({ 
      ...product, 
      weightedRating: ratingData.rating, 
      reviewCount: ratingData.count 
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

router.get('/sku/:sku', async (req, res) => {
  try {
    const product = await Product.findOne({ where: { sku: req.params.sku }, raw: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const reviews = await Review.findAll({
      where: { productId: product.id },
      raw: true
    });
    
    const ratingData = calculateWeightedRating(reviews);
    
    res.json({ 
      ...product, 
      weightedRating: ratingData.rating, 
      reviewCount: ratingData.count 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search by SKU' });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.id },
      order: [['createdAt', 'DESC']],
      raw: true
    });
    
    // Sort and calculate weights
    const ratingData = calculateWeightedRating(reviews);
    
    // Return processed reviews that are sorted by helpfulness/weight
    res.json(ratingData.reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/:id/reviews', async (req, res) => {
  // Simulated endpoint to allow posting reviews with new properties
  try {
    const { userName, rating, comment, isVerifiedPurchase, isVineVoice } = req.body;
    
    const review = await Review.create({
      productId: req.params.id,
      userName: userName || 'Anonymous',
      rating,
      comment: comment || '',
      isVerifiedPurchase: isVerifiedPurchase || false,
      isVineVoice: isVineVoice || false,
      upvotes: 0
    });
    
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

export default router;
