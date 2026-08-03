export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export class MemoryManager {
  private history: ChatTurn[] = [];

  constructor(initialHistory: ChatTurn[] = []) {
    this.history = [...initialHistory];
  }

  addTurn(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
    // Keep last 10 turns for token economy
    if (this.history.length > 10) {
      this.history = this.history.slice(this.history.length - 10);
    }
  }

  getFormattedHistory(): string {
    if (this.history.length === 0) return 'No prior conversation.';
    return this.history
      .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
      .join('\n');
  }

  getHistory(): ChatTurn[] {
    return this.history;
  }

  clear(): void {
    this.history = [];
  }
}
