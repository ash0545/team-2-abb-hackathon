import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Step {
  id: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() currentStep: number = 1;
  @Input() steps: Step[] = [];
}
