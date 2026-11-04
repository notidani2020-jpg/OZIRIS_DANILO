import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  const mockSendMail = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe enviar correo de recuperación con éxito cuando nodemailer responde ok', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'test-msg-123' });

    const result = await service.sendPasswordResetEmail(
      'usuario@test.com',
      '123456',
    );
    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'usuario@test.com',
        subject: expect.stringContaining('123456'),
      }),
    );
  });

  it('debe manejar errores de envío sin romper la ejecución', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP Connection Error'));

    const result = await service.sendPasswordResetEmail(
      'usuario@test.com',
      '123456',
    );
    expect(result.success).toBe(false);
    expect(result.message).toBe('SMTP Connection Error');
  });
});
