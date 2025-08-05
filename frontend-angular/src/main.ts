import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // ✅ ADD THIS
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()) // ✅ MODERN WAY TO PROVIDE HTTP
  ]
}).catch(err => console.error("Bootstrap Error:", err));
