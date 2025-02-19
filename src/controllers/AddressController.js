const AddressService = require("../services/AddressService");

const createAddress = async (req, res) => {
  const { name, phone, email, address, userId } = req.body;
  console.log(name, phone, email, address, userId);

  if (!name || !phone || !email || !address) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    const newAddress = await AddressService.addAddress(userId, {
      name,
      phone,
      email,
      address
    });

    return res
      .status(201)
      .json({ message: "Address added successfully", data: newAddress });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const getAddresses = async (req, res) => {
  const { userId } = req.params;
  console.log(userId);

  try {
    const addresses = await AddressService.getAddressesByUserId(userId);
    return res.status(200).json({ data: addresses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
const deleteAddress = async (req, res) => {
  const { userId, addressId } = req.params;
  console.log(userId, addressId);
  try {
    const result = await AddressService.deleteAddress(userId, addressId);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

module.exports = {
  createAddress,
  getAddresses,
  deleteAddress
};
