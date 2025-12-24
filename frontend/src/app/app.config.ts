import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { provideApiConfiguration } from '../../api/api-configuration';
import { routes } from './app.routes';
import { rxStompServiceFactory, WebSocketService } from './services/websocket.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    provideApiConfiguration(''),
    {
      provide: WebSocketService,
      useFactory: rxStompServiceFactory,
    },
  ]
};
