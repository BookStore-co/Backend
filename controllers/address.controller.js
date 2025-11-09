const Address = require("../models/Address");

const addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { street, city, state, zip } = req.body;

        if(!userId) return res.status(400).json({ message: "User ID is required" });
        if(!street || !city || !state || !zip) {
            return res.status(400).json({ message: "All address fields are required" });
        }
        const newAddress = new Address({
            userId,
            street,
            city,
            state,
            zip
        });
        await newAddress.save();
        res.status(201).json({ message: "Address added successfully", address: newAddress });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

const showAddress = async (req, res) => {
    try {
        const userId = req.user.id;

        if(!userId) return res.status(400).json({ message: "User ID is required" });

        const address = await Address.find({ userId });
        res.status(200).json(address);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { addAddress, showAddress };