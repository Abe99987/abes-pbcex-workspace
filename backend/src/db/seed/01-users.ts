import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../models/User';

/**
 * Development User Seeder
 * 
 * Creates default admin and user accounts for development.
 * Passwords are randomly generated and printed once.
 */

export interface SeededUser {
  id: string;
  email: string;
  password: string; // Plain text password (for display only)
  role: UserRole;
}

export async function seedUsers(): Promise<SeededUser[]> {
  // Generate random secure passwords
  const adminPassword = crypto.randomBytes(12).toString('base64url');
  const userPassword = crypto.randomBytes(12).toString('base64url');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const userPasswordHash = await bcrypt.hash(userPassword, 12);

  const users = [
    {
      id: 'admin-dev-user-id',
      email: 'admin@pbcex.local',
      password: adminPassword,
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as UserRole,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'test-dev-user-id',
      email: 'user@pbcex.local', 
      password: userPassword,
      passwordHash: userPasswordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER' as UserRole,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  // Here you would insert into your database
  // For now, we'll return the user data for the seeder to handle
  return users.map(user => ({
    id: user.id,
    email: user.email,
    password: user.password, // Plain text for display
    role: user.role
  }));
}

export const userSeedData = [
  {
    table: 'users',
    data: [
      {
        id: 'admin-dev-user-id',
        email: 'admin@pbcex.local',
        first_name: 'Admin',
        last_name: 'User',
        role: 'ADMIN',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-dev-user-id',
        email: 'user@pbcex.local',
        first_name: 'Test', 
        last_name: 'User',
        role: 'USER',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
  }
];
