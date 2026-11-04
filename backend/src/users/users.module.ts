import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ArtistsController } from './artists.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, ArtistsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
