import { Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import {
  GetUserActivityEndpoint,
  userActivityBodySchema,
  type UserActivityBody,
  type UserActivityResponse,
} from '../domain/feed';
import { ZodBodyPipe } from '../pipes';

@Controller({ path: 'users', version: '1' })
export class UserActivityController {
  constructor(private readonly getUserActivity: GetUserActivityEndpoint) {}

  @Post(':name/activity')
  async getActivity(
    @Param('name') name: string,
    @Body(new ZodBodyPipe(userActivityBodySchema)) body: UserActivityBody,
  ): Promise<UserActivityResponse> {
    const result = await this.getUserActivity.execute(name, body);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }
}
