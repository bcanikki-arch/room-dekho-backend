const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../db");
const nodemailer = require("nodemailer");
router.get("/slug/:slug", (req, res) => { 
  const { slug } = req.params;

  const sql = `
    SELECT 
      properties.*,
     CONCAT(users.firstName, ' ', users.lastName) AS owner_name,
      users.phone AS user_phone,
      users.role AS user_role
    FROM properties
    JOIN users ON users.id = properties.user_id
    WHERE properties.slug = ?
    LIMIT 1
  `;

  db.query(sql, [slug], (err, results) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!results.length) {
      return res.status(404).json({ message: "Property not found" });
    }

    const property = results[0];

    const COMPANY_PHONE = "9876543210";

    // ✅ Phone Logic
    property.phone =
      property.user_role === "Broker"
        ? property.user_phone
        : COMPANY_PHONE;

    // ✅ Safe JSON Parser
    const parseJSON = (data) => {
      if (!data) return [];

      if (Array.isArray(data)) return data;

      try {
        return JSON.parse(data);
      } catch {
        return data.split(",");
      }
    };

    property.images = parseJSON(property.images);
    property.features = parseJSON(property.features);

    return res.json(property);
  });
});
router.get("/menu", (req, res) => {
  const sql = `
    SELECT propertyType, rooms, title, pgType
    FROM properties
    WHERE status = 1
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });

    const menu = { Houses: [], Flats: [], "PG/Hostel": [] };

    const seenHouses = new Set();
    const seenFlats = new Set();
    const seenPg = new Set();

    // All links
    menu.Houses.push({ title: "All Houses", path: "/property/all-houses" });
    menu.Flats.push({ title: "All Flats", path: "/property/all-flats" });
    menu["PG/Hostel"].push({ title: "All PG/Hostel", path: "/property/all-pg" });

    result.forEach(item => {
      if (!item.propertyType) return;

      const type = item.propertyType.toLowerCase().trim();

      let slug = "";
      let displayTitle = "";

      // 🏠 HOUSES
      if (type === "house" || type === "houses") {

        const rooms = item.rooms || 0;

        slug = rooms
          ? `${rooms}-room`
          : item.title.toLowerCase().replace(/\s+/g, "-");

        displayTitle = rooms
          ? `${rooms} Room Set`
          : item.title;

        if (!seenHouses.has(slug)) {
          menu.Houses.push({
            title: displayTitle,
            path: `/property/${slug}`
          });

          seenHouses.add(slug);
        }
      }

      // 🏢 FLATS
      else if (type === "flat" || type === "flats") {

        const rooms = item.rooms || 0;

        slug = rooms
          ? `${rooms}-bhk`
          : item.title.toLowerCase().replace(/\s+/g, "-");

        displayTitle = rooms
          ? `${rooms} BHK Flats`
          : item.title;

        if (!seenFlats.has(slug)) {
          menu.Flats.push({
            title: displayTitle,
            path: `/property/${slug}`
          });

          seenFlats.add(slug);
        }
      }

      // 🛏 PG / HOSTEL
      else if (type === "pg" || type === "hostel") {

        if (!item.pgType) return;

        slug = item.pgType
          .toLowerCase()
          .replace(/\s+/g, "-");

        displayTitle = item.pgType;

        if (!seenPg.has(slug)) {
          menu["PG/Hostel"].push({
            title: displayTitle,
            path: `/property/${slug}`
          });

          seenPg.add(slug);
        }
      }

    });

    res.json(menu);
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const parseJSON = (data, fallback = []) => {
  if (!data) return fallback;

  if (Array.isArray(data)) return data;

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data.includes(",") ? data.split(",") : [data];
    }
  }

  return fallback;
};

const upload = multer({ storage: storage });

router.get("/all-properties", (req, res) => {

  let { location, type, rooms, baths, page = 1, limit = 6 } = req.query;

  page = Number(page);
  limit = Number(limit);

  const offset = (page - 1) * limit;

  let sql = `
    FROM properties
    JOIN users ON users.id = properties.user_id
    WHERE properties.status = 1
  `;

  let params = [];

  // location
  // location filter
if (location) {

  location = location.replace(/-/g, " ");

  sql += " AND LOWER(properties.locality) LIKE LOWER(?)";

  params.push(`%${location}%`);
}

  // type
  if (type) {
    sql += " AND properties.propertyType=?";
    params.push(type);
  }

  // rooms
  if (rooms) {
    sql += " AND properties.rooms=?";
    params.push(Number(rooms));
  }

  // baths
  if (baths) {
    sql += " AND properties.bathrooms=?";
    params.push(Number(baths));
  }

  /* ================= COUNT QUERY ================= */

  const countQuery = `SELECT COUNT(*) as total ${sql}`;

  db.query(countQuery, params, (err, countResult) => {

    if (err) return res.status(500).json({ message: "DB error" });

    const total = countResult[0].total;

    /* ================= DATA QUERY ================= */

    const dataQuery = `
      SELECT 
        properties.*,
        CONCAT(users.firstName,' ',users.lastName) AS owner_name,
        users.phone AS user_phone,
        users.role AS user_role
      ${sql}
      ORDER BY properties.id DESC
      LIMIT ? OFFSET ?
    `;

    db.query(
      dataQuery,
      [...params, limit, offset],
      (err, results) => {

        if (err) return res.status(500).json({ message: "DB error" });

        const COMPANY_PHONE = "9876543210";

        const parseJSON = (data) => {
          if (!data) return [];
          try { return JSON.parse(data); }
          catch { return data.split(","); }
        };

        const properties = results.map((property) => {

          property.phone =
            property.user_role === "Broker"
              ? property.user_phone
              : COMPANY_PHONE;

          property.images = parseJSON(property.images);
          property.features = parseJSON(property.features);

          return property;
        });

        res.json({
          data: properties,
          total,
          page,
          totalPages: Math.ceil(total / limit)
        });
      }
    );
  });
});

router.post("/", upload.array("images"), (req, res) => {

  const {
    user_id,
    offerType,
    propertyType,
     pgType,
    price,
    rooms,
    bathrooms,
    parking,
    address,
    locality,
    title,
    description,
    nearbyRoad,
    features,
    singlePrice,
    doublePrice,
    triplePrice,
    meals,
  } = req.body;

  const images = req.files.map(file => file.filename);

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const slug = slugify(title);

  const sql = `
  INSERT INTO properties
  (
    user_id,
    offerType,
    propertyType,
     pgType,
    price,
    rooms,
    bathrooms,
    parking,
    address,
    locality,
    nearbyRoad,
    singlePrice,
    doublePrice,
    triplePrice,
    meals,
    title,
    slug,
    description,
    features,
    images
  )
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  db.query(sql, [
    user_id,
    offerType,
    propertyType,
     pgType,
    price,
    rooms,
    bathrooms,
    parking,
    address,
    locality,
    nearbyRoad,
    singlePrice,
    doublePrice,
    triplePrice,
    meals,
    title,
    slug,
    description,
    features,
    JSON.stringify(images)
  ], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Database error" });
    }

    // 🔵 LOCATION AVAILABLE +1 UPDATE
    const updateLocation = `
      UPDATE locations 
      SET available = available + 1 
      WHERE title LIKE ?
    `;

    db.query(updateLocation, [`%${locality}%`], (err2) => {

      if (err2) {
        console.log("Location update error:", err2);
      }

      res.json({
        message: "Property submitted successfully",
        id: result.insertId
      });

    });

  });

});

/* ===== GET SINGLE PROPERTY ===== */
router.get("/property/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM properties WHERE id = ?",
    [id],
    (err, results) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      // ✅ IMPORTANT CHECK
      if (!results.length) {
        return res.status(404).json({
          message: "Property not found"
        });
      }

      const property = results[0];

      property.images = parseJSON(property.images);
      property.features = parseJSON(property.features);

      res.json(property);
    }
  );
});

/* ===== UPDATE PROPERTY ===== */
router.put("/:id", upload.array("images"), (req, res) => {

  const propertyId = req.params.id;

  const {
    offerType,
    propertyType,
    price,
    rooms,
    bathrooms,
    parking,
    address,
    locality,
    title,
    description,
    nearbyRoad,
    features,
    singlePrice,
    doublePrice,
    triplePrice,
    meals,
    existingImages
  } = req.body;

  // 👇 parse existing images coming from frontend
  let remainingImages = [];
  if (existingImages) {
    try {
      remainingImages = JSON.parse(existingImages);
    } catch {
      remainingImages = [];
    }
  }

  // 👇 new uploaded images
  let newImages = [];
  if (req.files && req.files.length > 0) {
    newImages = req.files.map(file => file.filename);
  }

  // 👇 combine remaining old + new
  const finalImages = [...remainingImages, ...newImages];

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const slug = slugify(title);

  const updateSql = `
    UPDATE properties SET
      offerType=?,
      propertyType=?,
      price=?,
      rooms=?,
      bathrooms=?,
      parking=?,
      address=?,
      locality=?,
      nearbyRoad=?,
      singlePrice=?,
      doublePrice=?,
      triplePrice=?,
      meals=?,
      title=?,
      slug=?,
      description=?,
      features=?,
      images=?
    WHERE id=?
  `;

  db.query(updateSql, [
    offerType,
    propertyType,
    price,
    rooms,
    bathrooms,
    parking,
    address,
    locality,
    nearbyRoad,
    singlePrice,
    doublePrice,
    triplePrice,
    meals,
    title,
    slug,
    description,
    features,
    JSON.stringify(finalImages),
    propertyId
  ], (err) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Update failed" });
    }

    res.json({ message: "Property updated successfully" });

  });

});
router.get("/top-properties", (req, res) => {

  const sql = `
  SELECT *
  FROM properties
  ORDER BY price DESC
  LIMIT 3
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.json({ message: "Property not found" });
    }

    res.json(result);

  });

});

router.get("/:id", (req, res) => {
    const propertyId = req.params.id;

    const sql = "SELECT * FROM properties WHERE id = ?";

    db.query(sql, [propertyId], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Server error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Property not found" });
        }

        res.json(result[0]);
    });

});

module.exports = router;