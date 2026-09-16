import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { FarmsModule } from './farms/farms.module';
import { FoldersModule } from './folders/folders.module';
import { ObligationsModule } from './obligations/obligations.module';
import { HealthController } from './health.controller';
import { AiModule } from './ai/ai.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FarmsModule,
    ObligationsModule,
    FoldersModule,
    DocumentsModule,
    AiModule,
  ],
})
export class AppModule {}
