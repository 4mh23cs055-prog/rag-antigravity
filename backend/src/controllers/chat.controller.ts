import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service.js';

export class ChatController {
  constructor(private chatService: ChatService) {}

  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, history, namespace } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        res.status(400).json({
          error: {
            message: 'A valid string message parameter is required.',
            status: 400,
          },
        });
        return;
      }

      const response = await this.chatService.processChat({
        message: message.trim(),
        history,
        namespace,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  streamChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, history, namespace } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        res.status(400).json({
          error: {
            message: 'A valid string message parameter is required.',
            status: 400,
          },
        });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const generator = this.chatService.streamChat({
        message: message.trim(),
        history,
        namespace,
      });

      for await (const chunk of generator) {
        res.write(chunk);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  };
}
