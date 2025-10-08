const User = require("../models/User");
const Book = require("../models/Books");
const everyOne = async(req, res)=>{
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
const allUsers = async(req, res)=>{
  try {
    const users = await User.find({ role: 'user'})
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

const getSellers = async(req, res)=>{
  try {
    const user = await User.find({ role: 'seller', status: 'approved' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

const getPendingSellers = async(req, res)=>{
    try {
        const users = await User.find({ role: 'seller', status: 'pending' });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

const acceptSellerRequest = async(req, res)=>{
    try {
        const {sellerId} = req.params;
        
        const seller = await User.findByIdAndUpdate(
            sellerId,
            { status: 'approved' },
            { new: true }
        )

        if(!seller) return res.status(404).json({ message: "Seller not found" });

        res.status(200).json({ message: "Seller approved", seller });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

const rejectSellerRequest = async(req, res)=>{
    try {
        const {sellerId} = req.params;
         const seller = await User.findById(sellerId);
        if(seller.status === 'rejected') return res.status(400).json({ message: "This request has been rejected previously" });
        
        await User.findByIdAndDelete(sellerId);

        if(!seller) return res.status(404).json({ message: "Seller not found" });

        res.status(200).json({ message: "Seller rejected", seller })
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

const getSellerById = async(req, res)=>{
    try {
      const {sellerId} = req.params;
      const seller = await User.findById(sellerId ).select('-password');
      if(!seller) return res.status(404).json({ message: "Seller not found" });
      if(seller.role !== 'seller') return res.status(400).json({ message: "This user is not a seller" });
      res.status(200).json(seller);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
}

const deleteSeller = async(req, res)=>{
    try {
      const {sellerId} = req.params;
      const seller = await User.findByIdAndDelete(sellerId);
      if(!seller) return res.status(404).json({ message: "Seller not found" });
      await Book.deleteMany({ seller: sellerId });
      res.status(200).json({ message: "Seller and their books deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
}
module.exports = { allUsers, getSellers, getPendingSellers, acceptSellerRequest, rejectSellerRequest, everyOne, getSellerById, deleteSeller };