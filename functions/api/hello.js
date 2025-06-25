import { greet } from './pkg/hellorustwasm.js';

export const onRequest = () => {
  const message = greet("繁さん 👋");
  return new Response(message, {
    headers: { "Content-Type": "text/plain" }
  });
};