import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Step } from './header.component.model'; // ✅ Correct path now

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

  constructor() {
    console.log('📢 HeaderComponent rendered!');
  }
}
export type { Step };

