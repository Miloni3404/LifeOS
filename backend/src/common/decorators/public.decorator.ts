import { SetMetadata } from '@nestjs/common';

// @Public() marks a route as NOT requiring authentication
// Used by JwtAuthGuard to skip token check
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
