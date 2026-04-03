import express, { Request, Response } from 'express';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get all blog posts (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { published_only } = req.query;
    
    // Handle both string and boolean values for published_only
    // Query params are always strings in Express
    const shouldFilterPublished = published_only === 'true' || published_only === '1';
    
    let query = 'SELECT * FROM blog_posts';
    const params: any[] = [];
    
    if (shouldFilterPublished) {
      query += ' WHERE is_published = $1';
      params.push(true);
    }
    
    query += ' ORDER BY created_at DESC';
    
    console.log('Fetching blog posts with query:', query);
    console.log('Query params:', params);
    
    const result = await pool.query(query, params);
    console.log(`Found ${result.rows.length} blog posts`);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single blog post by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create blog post (admin only)
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('excerpt').optional(),
    body('featured_image').optional(),
    body('cover_image').optional(),
    body('hero_image').optional(),
    body('is_published').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, excerpt, featured_image, cover_image, hero_image, is_published, author_id } = req.body;
      
      // Get user ID from token
      const authReq = req as any;
      const userId = authReq.user?.id || author_id;

      if (!userId) {
        console.error('No user ID found in token or request body');
        return res.status(400).json({ error: 'User ID is required. Please ensure you are logged in.' });
      }

      // Use cover_image if provided, otherwise fall back to featured_image for backward compatibility
      const finalCoverImage = cover_image || featured_image || null;
      const finalHeroImage = hero_image || null;

      const result = await pool.query(
        `INSERT INTO blog_posts (title, content, excerpt, featured_image, cover_image, hero_image, is_published, author_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          title,
          content,
          excerpt || null,
          featured_image || null, // Keep for backward compatibility
          finalCoverImage,
          finalHeroImage,
          is_published || false,
          userId,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      
      // Provide more specific error messages
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ error: 'Invalid author ID. User does not exist.' });
      }
      if (error.code === '42P01') { // Table does not exist
        return res.status(500).json({ error: 'Database table not found. Please run migrations.' });
      }
      
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update blog post (admin only)
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().notEmpty(),
    body('content').optional().notEmpty(),
    body('excerpt').optional(),
    body('featured_image').optional(),
    body('cover_image').optional(),
    body('hero_image').optional(),
    body('is_published').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, content, excerpt, featured_image, cover_image, hero_image, is_published } = req.body;

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramCount++}`);
        values.push(content);
      }
      if (excerpt !== undefined) {
        updates.push(`excerpt = $${paramCount++}`);
        values.push(excerpt);
      }
      if (featured_image !== undefined) {
        updates.push(`featured_image = $${paramCount++}`);
        values.push(featured_image === '' ? null : featured_image);
      }
      if (cover_image !== undefined) {
        updates.push(`cover_image = $${paramCount++}`);
        values.push(cover_image === '' ? null : cover_image);
      }
      if (hero_image !== undefined) {
        updates.push(`hero_image = $${paramCount++}`);
        values.push(hero_image === '' ? null : hero_image);
      }
      if (is_published !== undefined) {
        updates.push(`is_published = $${paramCount++}`);
        values.push(is_published);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE blog_posts 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete blog post (admin only)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM blog_posts WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

