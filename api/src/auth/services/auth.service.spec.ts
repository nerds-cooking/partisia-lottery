import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { UserService } from '../../users/services/user.service';
import { AuthService } from './auth.service';

// Define the mock user object
const mockUser = {
  _id: 'mock-user-id',
  address: '00d68d614198e1665be48fe20c7f1a8af488d35ddd',
  publicKey:
    '03fc661450a81fac70b5c2e950696c9ad768b0d4852598c584bee8f434e2eb36a2',
  nonce: 'Hello, Partisia!',
};

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: Partial<UserService>;

  beforeEach(async () => {
    mockUserService = {
      findByAddress: jest
        .fn<(address: string) => Promise<any>>()
        .mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should assign session if signature is valid', async () => {
    const address = mockUser.address;
    const signature =
      '0107fbea0dc3266f74d602c7ac240ff344a82cddfb053c023632bc13581f2c05f26494cf0765c3633853439b48ba8e25676d02cb36e8311606ab8db42e730e4f3f';
    const message = 'Hello, Partisia!';
    const req = { session: {} } as Request;

    await authService.verifySignature({ address, signature, message }, req);

    expect(mockUserService.findByAddress).toHaveBeenCalledWith(address);
    expect(req.session.user).toEqual({
      address: mockUser.address,
    });
  });

  it('should throw an error if signature is invalid', async () => {
    const address = mockUser.address;
    const signature = 'invalid-signature';
    const message = 'Hello, Partisia!';
    const req = { session: {} } as Request;

    await expect(
      authService.verifySignature({ address, signature, message }, req),
    ).rejects.toThrow('Invalid signature');
  });
});
