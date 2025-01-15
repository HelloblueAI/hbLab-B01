// handler.test.js
import { handler } from './redirect/redirect.mjs';

describe('handler', () => {
  it('should redirect to the Android app store for Android user-agents', async () => {
    const event = {
      headers: { 'user-agent': 'android' },
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toBe(
      'https://play.google.com/store/apps/details?id=com.cloudtenlabs.helloblue'
    );
  });

  it('should redirect to the iOS app store for iPhone user-agents', async () => {
    const event = {
      headers: { 'user-agent': 'iphone' },
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toBe('https://apps.apple.com/app/id6450708010');
  });

  it('should redirect to the default page for unrecognized user-agents', async () => {
    const event = {
      headers: { 'user-agent': 'unknown' },
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toBe('https://helloblue.ai');
  });

  it('should redirect to the default page if user-agent header is missing', async () => {
    const event = {
      headers: {},
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toBe('https://helloblue.ai');
  });

  it('should handle errors gracefully', async () => {
    const response = await handler(null);
    expect(response.statusCode).toBe(500);
    expect(response.body).toContain('Cannot read properties of null');
  });
});
