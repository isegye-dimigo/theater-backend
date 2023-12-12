import { ImATeapot } from '@library/error';

export default function (): void {
  throw new ImATeapot('I\'m sorry, but this server is powered by Teapot™');
}