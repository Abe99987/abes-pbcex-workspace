import jwt from 'jsonwebtoken';
import { generateToken } from '@/middlewares/authMiddleware';

describe('AuthService JWT issuance (stub)', () => {
  it('issues a JWT that decodes with expected claims', () => {
    const token = generateToken({
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      kycStatus: 'APPROVED',
    });
    const decoded = jwt.decode(token) as any;
    expect(decoded).toBeTruthy();
    expect(decoded).toMatchObject({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      kycStatus: 'APPROVED',
    });
  });
});


