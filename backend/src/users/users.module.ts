import { Module } from '@nestjs/common';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, SuperAdminGuard],
})
export class UsersModule {}
