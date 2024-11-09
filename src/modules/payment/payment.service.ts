import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { ConfigService } from '@nestjs/config';
import { IResponse } from 'src/utils/interfaces/response';
import { EPlanStatus, EPlanTypes } from 'src/utils/enums/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { firstValueFrom, from, mergeMap, toArray } from 'rxjs';
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

@Injectable()
export class PaymentService {

  clientMercadoPago: MercadoPagoConfig | undefined;

  optsItems = [
    {
      id: '1',
      title: 'MAIN STAGE TRIMESTRAL',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: 15,
      description: 'assinatura pré paga trimestral'
    },
    {
      id: '2',
      title: 'MAIN STAGE SEMESTRAL',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: 60,
      description: 'assinatura pré paga trimestral'
    },
    {
      id: '3',
      title: 'MAIN STAGE ANUAL',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: 120,
      description: 'assinatura pré paga trimestral'
    },
  ];

  constructor(
    private configService: ConfigService,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
  ) {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const accessToken = this.configService.get<string>('MERCADOPAGO')
    this.clientMercadoPago = new MercadoPagoConfig({ accessToken });
  }

  setPreferenceMP(external_reference: string, email: string, plan_type: string = EPlanTypes.TRIMESTRAL, isFirstPlan = false) {

    const preference = new Preference(this.clientMercadoPago);
    const items = this.selectPlanPrice(plan_type, isFirstPlan);

    let response: IResponse;
    return preference.create({
      body: {
        back_urls: {
          success: 'https://egbhub.com.br/checkout/success',
          failure: 'https://egbhub.com.br/checkout/failure',
          pending: 'https://egbhub.com.br/checkout/pending'
        },
        external_reference,
        payer: { email },
        payment_methods: {
          excluded_payment_methods: [{ id: 'bolbradesco' }, { id: 'pec' }]
        },
        items
      }
    })
      .then((res) => {
        response = { error: false, results: res, message: 'Operação realizada com sucesso!' }
        return response
      })
      .catch(() => {
        response = { error: true, results: undefined, message: 'Não foi possivel iniciar operação!' }
        return response
      });
  }


  async create(user_id: number, emailT: string, plan_type: string = EPlanTypes.TRIMESTRAL) {
    let response: IResponse;

    try {

      let plan_start = dayjs().tz('America/Sao_Paulo').startOf('day').format('YYYY-MM-DD HH:mm:ss');
      let isFirstPlan = true;
      let payment: Partial<CreatePaymentDto>;

      console.log('user_id', user_id);
      const isPendings = await this.paymentRepository.find({ where: { user_id, status: EPlanStatus.Pending }, order: { id: 'DESC' } });
      const lastPending = isPendings[0]
 
      const paymentsApproved = await this.paymentRepository.find({ where: { user_id, status: EPlanStatus.Approved }, order: { id: 'DESC' } });
      const lastPayment = paymentsApproved[0];
      if (lastPayment) {
        plan_start = dayjs(lastPayment.plan_end).tz('America/Sao_Paulo').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        isFirstPlan = false;
      }
      const plan_end = this.generatePlanEnd(plan_start, plan_type as EPlanTypes);


      //caso já exista só atualiza o periodo
      if (lastPending && lastPending?.preference) {
        await this.paymentRepository.update({ id: lastPending.id }, { plan_start, plan_end });

        const parsePref = JSON.parse(lastPending.preference);
        console.log('parse pref', parsePref);
        
        response = {
          error: false,
          results: { payment_id: lastPending.id, preference_id: parsePref?.id },
          message: 'operação realizada com sucesso.',
        }

        return response
      }

      //segue o fluxo se não existir
      payment = {
        user_id,
        plan_type,
        status: EPlanStatus.Pending,
        plan_start,
        plan_end,
        preference: ''
      }

      payment = await this.paymentRepository.save(payment);

      const external_reference = String(payment.id);
      const email = 'test_user_1993749272@testuser.com'
      const resPref = await this.setPreferenceMP(external_reference, email, plan_type, isFirstPlan);

      if (resPref.error) {
        response = {
          error: true,
          results: undefined,
          message: 'Falha ao realizar operação! tente novamente.',
        };
        throw new BadRequestException(response)
      }

      const preference = JSON.stringify(resPref.results);
      payment = { ...payment, preference }
      await this.paymentRepository.update(payment.id, payment);

      response = {
        error: false,
        results: { payment_id: payment.id, preference_id: resPref.results?.id },
        message: 'operação realizada com sucesso.',
      }
      return response;
    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };

      console.log(error);

      throw new BadRequestException(response)
    }

  }

  async getWebHooks(body: any) {
    const transaction_id = body?.data?.id;
    try {

      const payment = new Payment(this.clientMercadoPago);
      const response = await payment.get({ id: transaction_id });
      const status = response?.status ?? EPlanStatus.Pending;
      const id = Number(response.external_reference);

      const payload = JSON.stringify(response);
      await this.paymentRepository.update({ id }, { status, transaction_id, payload });
      console.log('sucess webhooks', transaction_id);
      return 'webhook integracion success' + transaction_id

    } catch (error) {
      console.log('error webhooks', error);
      return 'webhook integracion error'
    }
  }


  findAll() {
    return `This action returns all payment`;
  }

  async findOne(id: number) {
    let response: IResponse;
    try {
      const results = await this.paymentRepository.findOne({ where: { id } });
      response = {
        error: false,
        results,
        message: 'operação realizada com sucesso.',
      }

    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };

      console.log(error);
      throw new BadRequestException(response)
    }
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    let response: IResponse;
    try {
      await this.paymentRepository.update(id, updatePaymentDto);
      response = {
        error: false,
        results: updatePaymentDto,
        message: 'operação realizada com sucesso.',
      }

    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };

      console.log(error);
      throw new BadRequestException(response)
    }
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }

  async syncPayment(user_id: number) {
    let response: IResponse;
    try {

      const pendings = await this.paymentRepository.find({ where: { user_id, status: EPlanStatus.Pending }, order: { id: 'DESC' } })
      if (!pendings.length) {

        response = {
          error: false,
          results: [],
          message: 'Sem pagamentos pendentes.'
        }

        return response;
      };

      const clientPayment = new Payment(this.clientMercadoPago);

      const submit$ = from(pendings).pipe(
        mergeMap(async payment => {
          const paymentMp = (await clientPayment.search({ options: { external_reference: String(payment.id) } })).results[0];
          if (!paymentMp) { return undefined }
          const status = paymentMp.status ?? payment.status;
          const payload = JSON.stringify(paymentMp);
          await this.paymentRepository.update({ id: payment.id }, { status, payload });
          return { id: payment.id, status }
        }),
        toArray()
      )

      const results = (await firstValueFrom(submit$)).filter(elem => elem);
      response = {
        error: false,
        results,
        message: 'Pagamentos sincronizados com sucesso!'
      }

      return response;
    } catch (error) {
      response = {
        error: true,
        results: undefined,
        message: 'Ocorreu um erro ao sincronizar pagamentos!'
      }
      throw new BadRequestException(response)
    }


  }

  private generatePlanEnd(plan_start: string, plan_type: EPlanTypes) {
    let plan_end;
    if (plan_type === EPlanTypes.TRIMESTRAL) {
      plan_end = dayjs(plan_start).add(3, 'month').tz('America/Sao_Paulo').endOf('day').format('YYYY-MM-DD HH:mm:ss');
    } else if (plan_type === EPlanTypes.SEMESTRAL) {
      plan_end = dayjs(plan_start).add(6, 'month').tz('America/Sao_Paulo').endOf('day').format('YYYY-MM-DD HH:mm:ss');
    } else {
      plan_end = dayjs(plan_start).add(1, 'year').tz('America/Sao_Paulo').endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }
    return plan_end
  }

  private selectPlanPrice(plan_type: string, isFirstPlan = false) {
    let items;
    if (plan_type === EPlanTypes.TRIMESTRAL) {
      items = this.optsItems.filter(plan => plan.id === '1').map(elem => {
        const unit_price = isFirstPlan ? elem.unit_price : 30;
        return { ...elem, unit_price }
      });

    } else if (plan_type === EPlanTypes.SEMESTRAL) {
      items = this.optsItems.filter(plan => plan.id === '2');
    } else {
      items = this.optsItems.filter(plan => plan.id === '3');
    }
    return items
  }
}
