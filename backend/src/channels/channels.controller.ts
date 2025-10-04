import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChannelDto } from './dto/create-channel.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(@Request() req, @Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(req.user.id, createChannelDto);
  }

  @Get()
  async findAll(@Query('workspaceId') workspaceId: string, @Request() req) {
    return this.channelsService.findWorkspaceChannels(workspaceId, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.channelsService.findById(id, req.user.id);
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @Request() req) {
    return this.channelsService.joinChannel(id, req.user.id);
  }

  @Delete(':id/leave')
  async leave(@Param('id') id: string, @Request() req) {
    return this.channelsService.leaveChannel(id, req.user.id);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.channelsService.updateLastRead(id, req.user.id);
  }
}
