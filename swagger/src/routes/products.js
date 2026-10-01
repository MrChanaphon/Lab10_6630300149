const express = require('express');
const router = express.Router();

let products = [
    {
        id: 1,
        name: 'คีย์บอร์ดไร้สาย',
        price: 1290,
        stock: 25,
        category: 'electronics',
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: 'หนังสือ Node.js',
        price: 450,
        stock: 10,
        category: 'books',
        createdAt: new Date().toISOString()
    },
];
let nextId = 3;
const CATEGORIES = ['electronics', 'books', 'fashion'];

function validate(body, partial = false) {
    const { name, price, stock, category } = body;
    if (!partial || name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) return 'name ต้องเป็นข้อความและไม่ว่าง';
    }
    if (!partial || price !== undefined) {
        if (typeof price !== 'number' || price < 0) return 'price ต้องเป็นตัวเลขที่ไม่ติดลบ';
    }
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
        return 'stock ต้องเป็นจำนวนเต็มที่ไม่ติดลบ';
    }
    if (category !== undefined && !CATEGORIES.includes(category)) {
        return `category ต้องเป็น ${CATEGORIES.join(', ')}`;
    }
    return null;
}

const findProduct = (req, res, next) => {
    const product = products.find((p) => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'ไม่พบสินค้า' });
    req.product = product;
    next();
};

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: ดึงรายการสินค้าทั้งหมด
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: คำค้นหาชื่อสินค้า
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [electronics, books, fashion]
 *         description: หมวดหมู่สินค้า
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หน้าที่ต้องการ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: จำนวนรายการต่อหน้า
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 */
router.get('/', (req, res) => {
    const { q, category } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    let result = products;
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (category) result = result.filter((p) => p.category === category);
    const start = (page - 1) * limit;
    res.json({
        data: result.slice(start, start + limit),
        page,
        limit,
        total: result.length
    });
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: สร้างสินค้าใหม่
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: สร้างสินค้าสำเร็จ
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const { name, price, stock = 0, category } = req.body;
    const product = {
        id: nextId++,
        name,
        price,
        stock,
        category,
        createdAt: new Date().toISOString()
    };
    products.push(product);
    res.status(201).location(`/api/products/${product.id}`).json(product);
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: ดึงข้อมูลสินค้าตาม ID
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       200:
 *         description: พบข้อมูลสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', findProduct, (req, res) => res.json(req.product));

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลสินค้าทั้งหมด
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', findProduct, (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const { name, price, stock = 0, category } = req.body;
    Object.assign(req.product, { name, price, stock, category });
    res.json(req.product);
});

/**
 * @openapi
 * /api/products/{id}:
 *   patch:
 *     summary: แก้ไขข้อมูลสินค้าบางฟิลด์
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', findProduct, (req, res) => {
    const error = validate(req.body, true);
    if (error) return res.status(400).json({ error });
    const allowed = ['name', 'price', 'stock', 'category'];
    for (const key of allowed) {
        if (req.body[key] !== undefined) req.product[key] = req.body[key];
    }
    res.json(req.product);
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: ลบสินค้า
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       204:
 *         description: ลบสินค้าสำเร็จ
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', findProduct, (req, res) => {
    products = products.filter((p) => p.id !== req.product.id);
    res.status(204).end();
});

module.exports = router;