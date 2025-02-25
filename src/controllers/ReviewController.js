const reviewService = require("../services/ReviewService");

const addReview = async (req, res) => {
  try {
    const { productId, userId } = req.params;
    const { username, rating, comment } = req.body;

    if (!rating || !comment) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ đánh giá và bình luận!" });
    }

    const product = await reviewService.addReview(
      productId,
      userId,
      username,
      rating,
      comment
    );

    res.status(201).json({ message: "Thêm đánh giá thành công!", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const data = await reviewService.getProductReviews(productId);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReplyToReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const { userId, username, comment } = req.body;

    if (!comment) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập nội dung trả lời!" });
    }

    const product = await reviewService.addReplyToReview(
      productId,
      reviewId,
      userId,
      username,
      comment
    );

    res.status(201).json({ message: "Trả lời thành công!", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAllComments = async (req, res) => {
  try {
    const data = await reviewService.getAllComments();

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bình luận nào!" });
    }

    res.status(200).json({ message: "Lấy bình luận thành công!", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const countUserReviews = async (req, res) => {
  try {
    const totalReviews = await reviewService.countUserReviews();

    res.status(200).json({
      message: "Lấy số lượng đánh giá thành công!",
      totalReviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  addReview,
  getProductReviews,
  addReplyToReview,
  getAllComments,
  countUserReviews
};
