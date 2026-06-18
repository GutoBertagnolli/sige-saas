import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubstitutionStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../common/prisma.service';

type WhatsAppAction = 'accept' | 'decline';

@Injectable()
export class WhatsAppNotificationsService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
  ) {}

  private get enabled() {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  private get accessToken() {
    return this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
  }

  private get phoneNumberId() {
    return this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
  }

  private get graphVersion() {
    return this.config.get<string>('WHATSAPP_GRAPH_VERSION') || 'v19.0';
  }

  private normalizePhone(phone?: string | null) {
    const digits = String(phone || '').replace(/\D/g, '');

    if (!digits) return null;
    if (digits.startsWith('55')) return digits;
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    return digits;
  }

  private formatDate(value?: Date | string | null) {
    if (!value) return 'data nao informada';
    return new Date(value).toLocaleDateString('pt-BR');
  }

  private formatWeekday(value?: string | null) {
    const labels: Record<string, string> = {
      MONDAY: 'Segunda-feira',
      TUESDAY: 'Terca-feira',
      WEDNESDAY: 'Quarta-feira',
      THURSDAY: 'Quinta-feira',
      FRIDAY: 'Sexta-feira',
      SATURDAY: 'Sabado',
      SUNDAY: 'Domingo',
    };

    return value ? labels[value] ?? value : 'dia nao informado';
  }

  private buttonId(substitutionId: string, action: WhatsAppAction) {
    return `substitution:${substitutionId}:${action}`;
  }

  private parseButtonId(value?: string | null) {
    const match = String(value || '').match(/^substitution:([^:]+):(accept|decline)$/);
    if (!match) return null;

    return {
      substitutionId: match[1],
      action: match[2] as WhatsAppAction,
    };
  }

  private async getSubstitutionDetails(id: string) {
    return this.prisma.substitution.findUnique({
      where: { id },
      include: {
        absence: {
          include: {
            employee: {
              include: {
                school: true,
              },
            },
          },
        },
        classSchedule: {
          include: {
            class: true,
            subject: true,
          },
        },
        timeSlot: true,
      },
    });
  }

  async sendSubstitutionRequest(substitution: any) {
    if (!this.enabled || !substitution?.id) {
      return false;
    }

    const details = await this.getSubstitutionDetails(substitution.id);
    const substitute = await this.prisma.employee.findUnique({
      where: { id: details?.substituteTeacherId || '' },
    });
    const to = this.normalizePhone(substitute?.phone);

    if (!details || !to) {
      return false;
    }

    const time = details.timeSlot
      ? `${details.timeSlot.startTime} - ${details.timeSlot.endTime}`
      : 'horario nao informado';
    const className = details.classSchedule?.class?.name || 'turma nao informada';
    const room = details.classSchedule?.room || 'sala nao informada';
    const subject = details.classSchedule?.subject?.name || 'disciplina nao informada';
    const school = details.absence?.employee?.school?.name || 'escola nao informada';
    const absentEmployee = details.absence?.employee?.name || 'servidor afastado nao informado';

    const bodyText = [
      `Ola, ${substitute?.name || 'servidor'}.`,
      '',
      'Voce foi indicado(a) para uma substituicao no SIGE.',
      `Servidor afastado: ${absentEmployee}`,
      `Escola: ${school}`,
      `Turma: ${className}`,
      `Disciplina: ${subject}`,
      `Sala: ${room}`,
      `Dia: ${this.formatWeekday(details.weekday)}`,
      `Horario: ${time}`,
      `Periodo do afastamento: ${this.formatDate(details.absence?.startDate)} a ${this.formatDate(details.absence?.endDate)}`,
      '',
      'Confirme sua disponibilidade:',
    ].join('\n');

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: {
                text: bodyText,
              },
              action: {
                buttons: [
                  {
                    type: 'reply',
                    reply: {
                      id: this.buttonId(details.id, 'accept'),
                      title: 'Aceitar',
                    },
                  },
                  {
                    type: 'reply',
                    reply: {
                      id: this.buttonId(details.id, 'decline'),
                      title: 'Recusar',
                    },
                  },
                ],
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Erro ao enviar WhatsApp de substituicao:', errorText);
        return false;
      }
    } catch (error) {
      console.warn('Erro ao conectar na API do WhatsApp:', error);
      return false;
    }

    await this.prisma.substitution.update({
      where: { id: details.id },
      data: {
        status: SubstitutionStatus.SENT_TO_TEACHER,
      },
    });

    return true;
  }

  verifyWebhook(query: any) {
    const verifyToken = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    const mode = query?.['hub.mode'];
    const token = query?.['hub.verify_token'];
    const challenge = query?.['hub.challenge'];

    if (mode === 'subscribe' && token && token === verifyToken) {
      return challenge;
    }

    throw new UnauthorizedException('Token de webhook invalido.');
  }

  async handleWebhook(body: any) {
    const messages =
      body?.entry?.flatMap((entry: any) =>
        entry?.changes?.flatMap((change: any) => change?.value?.messages || []) || [],
      ) || [];

    for (const message of messages) {
      const buttonId =
        message?.interactive?.button_reply?.id ||
        message?.interactive?.list_reply?.id ||
        message?.button?.payload;
      const parsed = this.parseButtonId(buttonId);

      if (!parsed) {
        continue;
      }

      await this.applyWhatsAppResponse(parsed.substitutionId, parsed.action);
    }
  }

  private async applyWhatsAppResponse(substitutionId: string, action: WhatsAppAction) {
    const substitution = await this.prisma.substitution.findUnique({
      where: { id: substitutionId },
    });

    if (!substitution) {
      return;
    }

    const substitute = substitution.substituteTeacherId
      ? await this.prisma.employee.findUnique({
          where: { id: substitution.substituteTeacherId },
        })
      : null;

    const accepted = action === 'accept';
    const updated = await this.prisma.substitution.update({
      where: { id: substitutionId },
      data: {
        status: accepted ? SubstitutionStatus.ACCEPTED : SubstitutionStatus.DECLINED,
        acceptedAt: accepted ? new Date() : null,
        approvedBy: accepted ? 'WHATSAPP' : null,
      },
    });

    await this.audit.record({
      userId: substitute?.userId ?? null,
      entity: 'Substituicao',
      entityId: substitutionId,
      action: accepted ? 'ACCEPT_WHATSAPP' : 'DECLINE_WHATSAPP',
      newData: updated,
    });
  }
}
