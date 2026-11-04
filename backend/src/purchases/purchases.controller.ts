import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { SimulatedPurchaseDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Purchases')
@ApiBearerAuth('JWT-Auth')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  /**
   * Endpoint para simular el pago y adquirir un beat o lote de beats.
   * Requiere JWT y restringe al rol ADMIN.
   */
  @UseGuards(JwtAuthGuard)
  @Post('simulate')
  @ApiOperation({
    summary: 'Simular compra de un beat',
    description: 'Procesa un pago simulado y registra la compra en el historial del usuario.',
  })
  @ApiResponse({ status: 201, description: 'Compra registrada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o beat ya comprado.' })
  async simulatePayment(
    @Request() req: any,
    @Body() dto: SimulatedPurchaseDto,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.purchasesService.simulatePayment(userId, userRole, dto);
  }

  /**
   * Endpoint para obtener el historial de compras del usuario autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-purchases')
  @ApiOperation({ summary: 'Historial de compras del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de compras realizadas.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async getMyPurchases(@Request() req: any) {
    const userId = req.user.id;
    return this.purchasesService.getUserPurchases(userId);
  }

  /**
   * Endpoint para verificar si el usuario actual ha adquirido un Beat en particular.
   */
  @UseGuards(JwtAuthGuard)
  @Get('check/:trackId')
  @ApiOperation({ summary: 'Verificar si el usuario compró un beat específico' })
  @ApiParam({ name: 'trackId', description: 'ID del beat a verificar' })
  @ApiResponse({ status: 200, description: 'Estado de compra del beat.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async checkStatus(@Request() req: any, @Param('trackId') trackId: string) {
    const userId = req.user.id;
    return this.purchasesService.checkPurchaseStatus(userId, trackId);
  }

  /**
   * Endpoint para descargar el archivo de audio del beat.
   * Valida JWT, rol común (no admin) y comprobante de compra o autoría.
   */
  @UseGuards(JwtAuthGuard)
  @Get('download/:trackId')
  @ApiOperation({
    summary: 'Descargar archivo de audio de un beat comprado',
    description: 'Requiere haber comprado el beat previamente o ser el productor/admin. Devuelve el archivo en stream.',
  })
  @ApiParam({ name: 'trackId', description: 'ID del beat a descargar' })
  @ApiResponse({ status: 200, description: 'Archivo de audio enviado en stream.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para descargar este beat.' })
  @ApiResponse({ status: 404, description: 'Beat no encontrado.' })
  async downloadBeat(
    @Request() req: any,
    @Param('trackId') trackId: string,
    @Response() res: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers ? req.headers['user-agent'] : undefined;
    return this.purchasesService.handleDownload(
      userId,
      userRole,
      trackId,
      res,
      {
        ipAddress,
        userAgent,
      },
    );
  }
}
