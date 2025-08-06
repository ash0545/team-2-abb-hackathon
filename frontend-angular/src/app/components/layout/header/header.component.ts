// header.component.ts
import { Component, Input, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Step } from './header.component.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() currentStep!: number;
  @Input() steps: Step[] = [];

  darkMode = false;

  constructor(private renderer: Renderer2) {
    console.log('📢 HeaderComponent rendered!');
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      this.renderer.addClass(document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
    }
  }
}
