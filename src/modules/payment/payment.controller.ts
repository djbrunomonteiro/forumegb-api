import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Controller('payment')
export class PaymentController {
  KEYWEBHOOK = ''
  constructor(
    private readonly paymentService: PaymentService,
    private configService: ConfigService,
  ) {
    this.KEYWEBHOOK = this.configService.get<string>('KEYWEBHOOKMERCADOPAGO')
  }

  @Post()
  create(@Body() body: any) {
    const {plan_type, user_id, user_email} = body
    return this.paymentService.create(+user_id, user_email, plan_type);
  }

  @Post('mercadopagohooks')
  listenPayments(@Body() body: any, @Headers('x-request-id') xReqId: string, @Headers('x-signature') xSignature: string) {
    if (!xSignature) {
      throw new BadRequestException('Cabeçalho x-signature ausente');
    }
    // Separe os valores de timestamp e assinatura (v1) de x-signature
    const [tsPart, v1Part] = xSignature.split(',');
    const ts = tsPart?.split('=')[1];
    const signatureReceived = v1Part?.split('=')[1];

    if (!ts || !signatureReceived) {
      throw new BadRequestException('x-signature no formato inválido');
    }

    // Construa a string de assinatura com base nos dados recebidos
    const signatureString = `id:${body.data.id};request-id:${xReqId};ts:${ts};`;

    // Calcule o HMAC SHA256 com a chave secreta
    const computedSignature = crypto
      .createHmac('sha256', this.KEYWEBHOOK)
      .update(signatureString)
      .digest('hex');

    // Compare a assinatura calculada com a recebida
    if (computedSignature !== signatureReceived) {
      throw new BadRequestException('Assinatura inválida');
    }

    return this.paymentService.getWebHooks(body);
  }

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(+id);
  }

  @Get('sync/:id')
  syncOne(@Param('id') id: string) {
    return this.paymentService.syncPayment(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(+id);
  }
}
