import { BaseService } from './BaseService';
import { User } from '../entities/User';
import { CreateUserDto } from '../dtos/CreateUserDto';
import { UpdateUserDto } from '../dtos/UpdateUserDto';
import { LoginDto } from '../dtos/LoginDto';
import * as bcrypt from 'bcryptjs';

export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super(User, CreateUserDto, UpdateUserDto, ['firstName', 'lastName', 'email']);
  }

  /**
   * Authenticate user
   */
  async login(loginDto: LoginDto): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { email: loginDto.email },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Create user with hashed password
   */
  async create(createDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findOneByField('email', createDto.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createDto.password, saltRounds);

    // Remove or map 'role' if it's a string, as TypeORM expects an object or id reference
    const { role, ...rest } = createDto;
    const userWithHashedPassword = {
      ...rest,
      password: hashedPassword,
      // If you need to set role, map it to an object like: role: { id: role }
      ...(role ? { role: { id: role } } : {}),
    };

    const entity = this.repository.create(userWithHashedPassword);
    return await this.repository.save(entity);
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error('Invalid old password');
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.repository.update(userId, { password: hashedNewPassword } as Partial<User>);
  }

  /**
   * Get user with permissions
   */
  async getUserWithPermissions(userId: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });
  }
}
