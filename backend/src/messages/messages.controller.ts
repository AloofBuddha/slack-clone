import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AddReactionDto } from './dto/add-reaction.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(req.user.id, createMessageDto);
  }

  @Get('channel/:channelId')
  async findByChannel(
    @Param('channelId') channelId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    return this.messagesService.findChannelMessages(
      channelId,
      req.user.id,
      parseInt(page) || 1,
      parseInt(limit) || 50,
    );
  }

  @Get('thread/:parentId')
  async findThread(@Param('parentId') parentId: string, @Request() req) {
    return this.messagesService.findThreadMessages(parentId, req.user.id);
  }

  @Get('search')
  async search(@Query('workspaceId') workspaceId: string, @Query('q') query: string, @Request() req) {
    return this.messagesService.searchMessages(workspaceId, req.user.id, query);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(id, req.user.id, updateMessageDto.content);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.messagesService.delete(id, req.user.id);
  }

  @Post(':id/reactions')
  async addReaction(@Param('id') id: string, @Request() req, @Body() addReactionDto: AddReactionDto) {
    return this.messagesService.addReaction(id, req.user.id, addReactionDto.emoji);
  }
}
