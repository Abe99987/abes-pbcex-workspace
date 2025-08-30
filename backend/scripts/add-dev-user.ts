import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { AuthController } from '@/controllers/AuthController';
import { USER_ROLES, KYC_STATUS } from '@/utils/constants';
import { User } from '@/models/User';

console.log('Adding dev user...');

const devPassword = 'pbcextest1';
const devPasswordHash = bcrypt.hashSync(devPassword, 10);

const devUser: User = {
  id: 'dev-user-id',
  email: 'dev@local.test',
  passwordHash: devPasswordHash,
  firstName: 'Dev',
  lastName: 'User',
  role: USER_ROLES.USER,
  kycStatus: KYC_STATUS.APPROVED,
  emailVerified: true,
  phoneVerified: true,
  twoFactorEnabled: false,
  phone: '+1-555-0123',
  loginCount: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

AuthController.clearUsers();
AuthController.addUser(devUser);

console.log(`✅ Dev user added: ${devUser.email} (ID: ${devUser.id})`);
console.log('Password: pbcextest1');
