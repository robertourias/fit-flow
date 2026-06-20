import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/jwt-auth.guard";
import { NotificationDto } from "../application/dto/notification.dto";
import { ListNotificationsQueryDto } from "../application/dto/list-notifications-query.dto";
import { MarkAllNotificationsReadResponseDto } from "../application/dto/mark-all-notifications-read-response.dto";
import { ListMyNotificationsUseCase } from "../application/use-cases/list-my-notifications.use-case";
import { MarkNotificationReadUseCase } from "../application/use-cases/mark-notification-read.use-case";
import { MarkAllNotificationsReadUseCase } from "../application/use-cases/mark-all-notifications-read.use-case";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly _listMyNotifications: ListMyNotificationsUseCase,
    private readonly _markNotificationRead: MarkNotificationReadUseCase,
    private readonly _markAllNotificationsRead: MarkAllNotificationsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "Lista as notificações do usuário autenticado" })
  @ApiOkResponse({ type: [NotificationDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationDto[]> {
    const notifications = await this._listMyNotifications.execute(user.id, {
      unreadOnly: query.unread,
    });
    return notifications.map((notification) => NotificationDto.fromEntity(notification));
  }

  // Rota estática "read-all" precisa ser registrada antes de ":id/read" para
  // não ser capturada pelo parâmetro dinâmico ":id".
  @Patch("read-all")
  @ApiOperation({ summary: "Marca todas as notificações não lidas do usuário como lidas" })
  @ApiOkResponse({ type: MarkAllNotificationsReadResponseDto })
  async markAllRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MarkAllNotificationsReadResponseDto> {
    const updated = await this._markAllNotificationsRead.execute(user.id);
    return { updated };
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Marca uma notificação como lida" })
  @ApiOkResponse({ type: NotificationDto })
  @ApiResponse({ status: 404, description: "Notificação não pertence ao usuário autenticado" })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<NotificationDto> {
    const notification = await this._markNotificationRead.execute(user.id, id);
    return NotificationDto.fromEntity(notification);
  }
}
