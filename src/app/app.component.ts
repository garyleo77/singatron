import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FencingGeminiComponent } from './components/fencing-gemini/fencing-gemini.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FencingGeminiComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'SLAVA';
  title2 = "TRON";
  subtitle = 'AI-enabled Epee Coach'
}