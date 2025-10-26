import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiSecurity, ApiBearerAuth } from '@nestjs/swagger';
import { FilmService } from './film.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';
import { ClientApiKeyGuard } from 'src/auth/guards/api-key-advance.guard';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { EitherAuthGuard } from 'src/auth/guards/either-auth.guard';
@ApiTags('films')
@ApiBearerAuth('bearer')
@ApiSecurity('internal-api-key')
@ApiSecurity('client-api-key')
@UseGuards(EitherAuthGuard)
// @UseGuards(ClientApiKeyGuard)
// @UseGuards(JwtGuard)
// @UseGuards(ApiKeyGuard)
@Controller('film')
export class FilmController {
  constructor(private readonly filmService: FilmService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new film' })
  @ApiResponse({ status: 201, description: 'Film created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createFilmDto: CreateFilmDto) {
    return this.filmService.create(createFilmDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all films' })
  @ApiResponse({ status: 200, description: 'Return all films' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.filmService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a film by id' })
  @ApiParam({ name: 'id', description: 'Film ID' })
  @ApiResponse({ status: 200, description: 'Return the film' })
  @ApiResponse({ status: 404, description: 'Film not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.filmService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a film' })
  @ApiParam({ name: 'id', description: 'Film ID' })
  @ApiResponse({ status: 200, description: 'Film updated successfully' })
  @ApiResponse({ status: 404, description: 'Film not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() updateFilmDto: UpdateFilmDto) {
    return this.filmService.update(+id, updateFilmDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a film' })
  @ApiParam({ name: 'id', description: 'Film ID' })
  @ApiResponse({ status: 200, description: 'Film deleted successfully' })
  @ApiResponse({ status: 404, description: 'Film not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.filmService.remove(+id);
  }
}
