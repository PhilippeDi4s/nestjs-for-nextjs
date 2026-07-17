import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { HashingService } from 'src/commoun/hashing/hashing.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async failIfEmailExists(email: string) {
    const exists = await this.userRepository.existsBy({
      email,
    });

    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }
  }

  async findOneByOrFail(userDate: Partial<User>) {
    const user = await this.userRepository.findOneBy(userDate);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    await this.failIfEmailExists(dto.email);

    const hashedPassword = await this.hashingService.hash(dto.passwordHash);

    const newUser: CreateUserDto = {
      name: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
    };

    const created = await this.userRepository.save(newUser);
    return created;
  }

  findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  findById(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  async update(id: string, dto: UpdateUserDto) {
    if (!dto.name && !dto.email) {
      throw new BadRequestException('Dados não enviados');
    }

    const user = await this.findOneByOrFail({ id });

    user.name = dto.name ?? user.name;

    if (dto.email && dto.email !== user.email) {
      await this.failIfEmailExists(dto.email);

      user.email = dto.email;
      user.forceLogout = true;
    }

    return this.save(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.findOneByOrFail({ id });

    const isCurrentPasswordValid = await this.hashingService.compare(
      dto.currentPasswordHash,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual inválida');
    }

    const isNewPasswordEqual = await this.hashingService.compare(
      dto.newPasswordHash,
      user.passwordHash,
    );

    if (isNewPasswordEqual) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    user.passwordHash = await this.hashingService.hash(dto.newPasswordHash);
    user.forceLogout = true;

    return this.save(user);
  }

  save(user: User) {
    return this.userRepository.save(user);
  }
}
