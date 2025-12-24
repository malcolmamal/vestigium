import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService extends RxStomp {
  constructor() {
    super();
  }
}

export function rxStompServiceFactory() {
  const rxStomp = new WebSocketService();
  rxStomp.configure({
    brokerURL: 'ws://localhost:8008/ws',
    reconnectDelay: 200
    // debug: (msg: string) => console.log(new Date(), msg),
  });
  rxStomp.activate();
  return rxStomp;
}
