import express, { Request, Response } from 'express';
import pool from '../config/database';
import { ACTIVE_BOOKING_STATUSES } from '../services/availability';

const router = express.Router();

// Get all vehicles with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, location, available_from, available_to, min_price, max_price } = req.query;

    let query = `
      SELECT 
        v.*,
        json_agg(DISTINCT vs.*) FILTER (WHERE vs.id IS NOT NULL) as subunits,
        json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) as available_locations
      FROM vehicles v
      LEFT JOIN vehicle_subunits vs ON v.id = vs.vehicle_id AND vs.status = 'available'
      LEFT JOIN locations l ON vs.current_location_id = l.id
      WHERE v.is_active = true
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND v.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (min_price) {
      query += ` AND v.base_price_daily >= $${paramCount}`;
      params.push(min_price);
      paramCount++;
    }

    if (max_price) {
      query += ` AND v.base_price_daily <= $${paramCount}`;
      params.push(max_price);
      paramCount++;
    }

    query += ` GROUP BY v.id ORDER BY v.created_at DESC`;

    const result = await pool.query(query, params);

    // Filter by availability if dates provided
    let vehicles = result.rows.map((vehicle: any) => {
      // Parse images if it's a string (JSON)
      let parsedImages = vehicle.images || [];
      if (typeof vehicle.images === 'string') {
        try {
          parsedImages = JSON.parse(vehicle.images);
        } catch (e) {
          parsedImages = vehicle.images ? [vehicle.images] : [];
        }
      }
      if (!Array.isArray(parsedImages)) {
        parsedImages = parsedImages ? [parsedImages] : [];
      }

      // Parse features if it's a string (JSON)
      let parsedFeatures = vehicle.features || [];
      if (typeof vehicle.features === 'string') {
        try {
          parsedFeatures = JSON.parse(vehicle.features);
        } catch (e) {
          parsedFeatures = vehicle.features ? [vehicle.features] : [];
        }
      }
      if (!Array.isArray(parsedFeatures)) {
        parsedFeatures = parsedFeatures ? [parsedFeatures] : [];
      }

      return {
        ...vehicle,
        images: parsedImages,
        features: parsedFeatures,
      };
    });
    if (available_from && available_to) {
      // Normalize dates to start/end of day (UTC) to avoid timezone issues
      const fromDate = new Date(available_from as string);
      fromDate.setUTCHours(0, 0, 0, 0);
      
      const toDate = new Date(available_to as string);
      toDate.setUTCHours(23, 59, 59, 999);

      // Check availability for each vehicle
      const availabilityChecks = await Promise.all(
        vehicles.map(async (vehicle: any) => {
          // Get ALL subunits for this vehicle (not just 'available' status)
          const subunitsResult = await pool.query(
            `SELECT id, status FROM vehicle_subunits WHERE vehicle_id = $1`,
            [vehicle.id]
          );

          const totalSubunits = subunitsResult.rows.length;
          
          if (totalSubunits === 0) {
            return {
              ...vehicle,
              is_available: false,
              available_count: 0,
            };
          }

          // Check for blocked/maintenance dates
          const blockedDatesResult = await pool.query(
            `SELECT DISTINCT note_date, note_type, note
             FROM availability_notes
             WHERE (vehicle_id = $1 OR vehicle_subunit_id IN (
               SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
             ))
             AND note_type IN ('maintenance', 'blocked')
             AND DATE(note_date) >= DATE($2)
             AND DATE(note_date) <= DATE($3)`,
            [vehicle.id, fromDate, toDate]
          );

          if (blockedDatesResult.rows.length > 0) {
            return {
              ...vehicle,
              is_available: false,
              available_count: 0,
            };
          }

          // Check which subunits are booked in this date range
          // Count distinct booked subunits (not total bookings)
          const bookingsResult = await pool.query(
            `SELECT DISTINCT vehicle_subunit_id
             FROM bookings b
             JOIN vehicle_subunits vs ON b.vehicle_subunit_id = vs.id
             WHERE vs.vehicle_id = $1
             AND b.status = ANY($4::text[])
             AND (b.pickup_date <= $3 AND b.dropoff_date >= $2)`,
            [vehicle.id, fromDate, toDate, ACTIVE_BOOKING_STATUSES]
          );

          const bookedSubunitIds = new Set(
            bookingsResult.rows.map((b: any) => b.vehicle_subunit_id)
          );

          // Filter available subunits - exclude booked ones and maintenance ones
          const availableSubunits = subunitsResult.rows.filter((subunit: any) => {
            // Exclude if booked
            if (bookedSubunitIds.has(subunit.id)) {
              return false;
            }
            // Exclude maintenance status
            if (subunit.status === 'maintenance') {
              return false;
            }
            // Include available, reserved (if not booked), returned, and out_on_rent (if not booked)
            return true;
          });

          const availableCount = availableSubunits.length;

          return {
            ...vehicle,
            is_available: availableCount > 0,
            available_count: availableCount,
          };
        })
      );

      vehicles = availabilityChecks.filter((v: any) => v.is_available);
    }

    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vehicle blocked dates for date picker (must come before /:id route)
router.get('/:id/blocked-dates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const targetDate = new Date();
    const targetMonth = month ? parseInt(month as string) : targetDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : targetDate.getFullYear();

    // Get a wider range: current date to 12 months forward to cover calendar navigation
    const firstDay = new Date(); // Start from today
    const lastDay = new Date();
    lastDay.setFullYear(lastDay.getFullYear() + 1); // 12 months ahead

    // Get all bookings (including cancelled to show in calendar)
    const bookingsResult = await pool.query(
      `SELECT b.id, b.booking_number, b.pickup_date, b.dropoff_date, b.status as booking_status,
              c.first_name, c.last_name
       FROM bookings b
       JOIN vehicle_subunits vs ON b.vehicle_subunit_id = vs.id
       LEFT JOIN customers c ON b.customer_id = c.id
       WHERE vs.vehicle_id = $1
       AND (
         (b.pickup_date <= $3 AND b.dropoff_date >= $2)
         OR (b.pickup_date >= $2 AND b.dropoff_date <= $3)
       )
       ORDER BY b.pickup_date`,
      [id, firstDay, lastDay]
    );

    // Get availability notes (maintenance/blocked)
    const notesResult = await pool.query(
      `SELECT note_date, note_type
       FROM availability_notes
       WHERE vehicle_id = $1
       AND note_date >= $2
       AND note_date <= $3
       AND note_type IN ('maintenance', 'blocked')`,
      [id, firstDay, lastDay]
    );

    res.json({
      bookings: bookingsResult.rows,
      blocked_dates: notesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check vehicle availability (must come before /:id route)
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to dates are required' });
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    // Get all subunits for this vehicle
    const subunitsResult = await pool.query(
      'SELECT id FROM vehicle_subunits WHERE vehicle_id = $1',
      [id]
    );

    const totalSubunits = subunitsResult.rows.length;

    // Check bookings in this date range
    // Use standardized active booking statuses to prevent double bookings
    const bookingsResult = await pool.query(
      `SELECT vehicle_subunit_id, pickup_date, dropoff_date
       FROM bookings
       WHERE vehicle_subunit_id IN (
         SELECT id FROM vehicle_subunits WHERE vehicle_id = $1
       )
       AND status = ANY($4::text[])
       AND (pickup_date <= $3 AND dropoff_date >= $2)`,
      [id, fromDate, toDate, ACTIVE_BOOKING_STATUSES]
    );

    const bookedSubunits = new Set(bookingsResult.rows.map((b: any) => b.vehicle_subunit_id));
    const availableCount = totalSubunits - bookedSubunits.size;

    res.json({
      available: availableCount > 0,
      available_count: availableCount,
      total_count: totalSubunits,
      booked_dates: bookingsResult.rows.map((b: any) => ({
        from: b.pickup_date,
        to: b.dropoff_date,
      })),
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single vehicle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vehicle plus per-vehicle extras: when vehicle_extras_link_count > 0, booking UI filters to available_extras; when 0, all catalog extras apply (legacy).
    const vehicleResult = await pool.query(
      `SELECT v.*,
        (SELECT COUNT(*)::int FROM vehicle_extras ve WHERE ve.vehicle_id = v.id) AS vehicle_extras_link_count,
        COALESCE(
          (SELECT array_agg(ve2.extra_id ORDER BY ve2.created_at) FROM vehicle_extras ve2 WHERE ve2.vehicle_id = v.id),
          ARRAY[]::uuid[]
        ) AS available_extras
       FROM vehicles v
       WHERE v.id = $1 AND v.is_active = true`,
      [id]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = vehicleResult.rows[0];

    // Get subunits separately to avoid json_agg issues
    const subunitsResult = await pool.query(
      `SELECT * FROM vehicle_subunits WHERE vehicle_id = $1`,
      [id]
    );

    // Get images if they exist in a separate column or table
    // For now, we'll handle images from the vehicle record itself
    const images = vehicle.images || [];
    
    // Parse images if it's a string (JSON)
    let parsedImages = images;
    if (typeof images === 'string') {
      try {
        parsedImages = JSON.parse(images);
      } catch (e) {
        parsedImages = images ? [images] : [];
      }
    }
    if (!Array.isArray(parsedImages)) {
      parsedImages = parsedImages ? [parsedImages] : [];
    }

    // Parse features if it's a string (JSON)
    let parsedFeatures = vehicle.features || [];
    if (typeof vehicle.features === 'string') {
      try {
        parsedFeatures = JSON.parse(vehicle.features);
      } catch (e) {
        parsedFeatures = vehicle.features ? [vehicle.features] : [];
      }
    }
    if (!Array.isArray(parsedFeatures)) {
      parsedFeatures = parsedFeatures ? [parsedFeatures] : [];
    }

    // Combine all data
    const vehicleData = {
      ...vehicle,
      subunits: subunitsResult.rows,
      images: parsedImages,
      features: parsedFeatures,
    };

    res.json(vehicleData);
  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

