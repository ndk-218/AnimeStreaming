const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { userAuth } = require('../middleware/userAuth');

// Public routes (không cần đăng nhập)
router.get('/season/:seasonId', commentController.getSeasonComments);
router.get('/episode/:episodeId', commentController.getEpisodeComments);
router.get('/:commentId/replies', commentController.getCommentReplies);
router.get('/:commentId', commentController.getCommentById);
router.get('/user/:userId', commentController.getUserComments);

// Protected routes (cần đăng nhập)
router.post('/', userAuth, commentController.createComment);
router.post('/:commentId/like', commentController.toggleLike); // Không cần auth vì không lưu trạng thái
router.delete('/:commentId', userAuth, commentController.deleteComment);

module.exports = router;
