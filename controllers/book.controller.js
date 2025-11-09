const Books = require('../models/Books');
const User = require('../models/User');

const createBook = async (req, res) => {
    try {
        const {title, author, description, price, discount, category, stock, coverImage} = req.body;
        const sellerId = req.user.id;
        
        const seller = await User.findById(sellerId);
        if(seller.role !== 'seller' && seller.status !== 'approved'){
            return res.status(403).json({ message: "Only approved sellers can add books" });
        }

        if(!req.file || !req.file.filename){
            return res.status(400).json({ message: "Cover image is required" });
        }
        const newBook = new Books({
            title,
            author,
            description,
            price, 
            discount,
            category,
            stock,
            coverImage: req.file.filename,
            seller: seller.id
        });

        await newBook.save();
        await newBook.populate('seller', 'name email');
        res.status(201).json({ message: "Book created successfully", book: newBook });
        
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

const showBooks = async (req, res) => {
    try {
        const books = await Books.find().populate('seller', 'SellerDetails.shopName').lean();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}
const showBookById = async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Books.findById(bookId).populate('seller', 'SellerDetails.shopName').lean();
        if(!book) return res.status(404).json({ message: "Book not found" });
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

const showBooksBySeller = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const books = await Books.find({ seller: sellerId }).populate('seller', 'SellerDetails.shopName').lean();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}
const deleteBook = async (req, res) => {
    try {
        const bookId =  req.params.id;

        const book = await Books.findByIdAndDelete(bookId);
        if(!book) return res.status(404).json({ message: "Book not found" });

        res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { createBook, showBooks, deleteBook, showBooksBySeller, showBookById };