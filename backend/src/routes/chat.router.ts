import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';

export function createChatRouter(chatController: ChatController): Router {
  const router = Router();
  router.post('/chat', chatController.chat);
  router.post('/chat/stream', chatController.streamChat);
  return router;
}
