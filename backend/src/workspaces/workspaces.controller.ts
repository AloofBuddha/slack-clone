import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async create(@Request() req, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.id, createWorkspaceDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.workspacesService.findUserWorkspaces(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workspacesService.findById(id, req.user.id);
  }

  @Post(':id/invite')
  async invite(@Param('id') id: string, @Request() req, @Body() inviteUserDto: InviteUserDto) {
    return this.workspacesService.inviteUser(id, req.user.id, inviteUserDto.email);
  }

  @Put(':id/members/:memberId/role')
  async updateRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(id, req.user.id, memberId, updateRoleDto.role);
  }
}
