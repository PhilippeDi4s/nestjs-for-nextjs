import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  //   @Get(':id')
  //   findOne(@Param('id', CustomParseIntPipe) id: number) {
  //     return `Olá controller do user #${id}`;
  //   }
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
