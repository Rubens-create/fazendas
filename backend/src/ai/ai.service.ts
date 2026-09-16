import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  findMessages() { return this.prisma.chatMessage.findMany({ orderBy: { createdAt: 'asc' } }); }
  async clearMessages() { await this.prisma.chatMessage.deleteMany(); return { cleared: true }; }

  async send(dto: SendMessageDto) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException('A integração Groq não está configurada no ambiente.');
    const [farms, obligations] = await Promise.all([
      this.prisma.farm.findMany({ include: { checklist: true } }),
      this.prisma.obligation.findMany({ orderBy: { dueDate: 'asc' } }),
    ]);
    const context = `DADOS REAIS DO SISTEMA AGROCLAW:\nFazendas: ${JSON.stringify(farms)}\nObrigações: ${JSON.stringify(obligations)}`;
    const userContent = dto.attachmentText ? `${dto.content}\n\nConteúdo do arquivo anexado:\n${dto.attachmentText}` : dto.content;
    await this.prisma.chatMessage.create({ data: { sender: 'user', content: dto.content } });
    const response = await fetch(this.config.get<string>('GROQ_ENDPOINT', 'https://api.groq.com/openai/v1/chat/completions'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: dto.model || 'llama-3.3-70b-versatile', temperature: 0.5, max_tokens: 1024, messages: [{ role: 'system', content: `Responda exclusivamente em Português do Brasil. Use apenas os dados fornecidos.\n${context}` }, { role: 'user', content: userContent }] }),
    });
    if (!response.ok) throw new ServiceUnavailableException('Não foi possível consultar a Groq.');
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? 'Não foi possível obter uma resposta.';
    await this.prisma.chatMessage.create({ data: { sender: 'ai', content } });
    return { content };
  }
}
