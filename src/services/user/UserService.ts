import { BaseService } from '../core/BaseService';
import { User } from '../../entities/User';
import { Role } from '../../entities/Role';
import { Permission } from '../../entities/Permission';
import { CreateUserDto } from '../../dtos/CreateUserDto';
import { UpdateUserDto } from '../../dtos/UpdateUserDto';
import { LoginDto } from '../../dtos/LoginDto';
import * as bcrypt from 'bcryptjs';
import { getDataSource } from '../../config/database';

export interface UserPermissions {
  userId: string;
  roleId?: string;
  permissions: Array<{
    module: string;
    action: string;
    isAllowed: boolean;
  }>;
}

export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super(User, CreateUserDto, UpdateUserDto, ['firstName', 'lastName', 'email']);
  }

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

  async create(createDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findOneByField('email', createDto.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createDto.password, saltRounds);

    const { role, ...rest } = createDto;
    let roleId: string | undefined;
    if (role) {
      if (typeof role === 'string') {
        roleId = role;
      } else if (typeof role === 'object' && 'id' in role) {
        roleId = role.id;
      }
    }

    const userWithHashedPassword = {
      ...rest,
      password: hashedPassword,
      ...(roleId ? { role: { id: roleId } } : {}),
    };

    const entity = this.repository.create(userWithHashedPassword);
    return await this.repository.save(entity);
  }

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

  async getUserWithPermissions(userId: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissionIds: string[];
  }): Promise<Role> {
    const roleRepo = getDataSource().getRepository(Role);
    const permissionRepo = getDataSource().getRepository(Permission);

    const permissions = await permissionRepo.findByIds(data.permissionIds);

    const role = roleRepo.create({
      name: data.name,
      description: data.description,
      permissions,
    });

    return await roleRepo.save(role);
  }

  async updateRole(roleId: string, data: {
    name?: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<Role> {
    const roleRepo = getDataSource().getRepository(Role);
    const permissionRepo = getDataSource().getRepository(Permission);

    const role = await roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (data.name) role.name = data.name;
    if (data.description) role.description = data.description;

    if (data.permissionIds) {
      const permissions = await permissionRepo.findByIds(data.permissionIds);
      role.permissions = permissions;
    }

    return await roleRepo.save(role);
  }

  async createPermission(data: {
    module: string;
    action: string;
  }): Promise<Permission> {
    const permissionRepo = getDataSource().getRepository(Permission);

    const permission = permissionRepo.create({
      module: data.module,
      action: data.action,
      isAllowed: true,
    });

    return await permissionRepo.save(permission);
  }

  async getAllRoles(): Promise<Role[]> {
    const roleRepo = getDataSource().getRepository(Role);
    return await roleRepo.find({ relations: ['permissions'] });
  }

  async getAllPermissions(): Promise<Permission[]> {
    const permissionRepo = getDataSource().getRepository(Permission);
    return await permissionRepo.find();
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<User> {
    await this.repository.update(userId, { role: { id: roleId } } as any);
    return await this.getUserWithPermissions(userId) as User;
  }

  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    const user = await this.getUserWithPermissions(userId);
    if (!user || !user.role) {
      return null;
    }

    const permissions = Array.isArray(user.role.permissions)
      ? user.role.permissions.map(p => ({
          module: p.module,
          action: p.action,
          isAllowed: p.isAllowed,
        }))
      : [];

    return {
      userId: user.id,
      roleId: user.role.id,
      permissions,
    };
  }

  async deactivateUser(userId: string): Promise<void> {
    // Add isActive field to User entity if needed
    await this.repository.update(userId, { 
      // isActive: false 
    } as any);
  }

  async activateUser(userId: string): Promise<void> {
    // Add isActive field to User entity if needed
    await this.repository.update(userId, { 
      // isActive: true 
    } as any);
  }
}