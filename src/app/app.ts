import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';

@Component({
  imports: [RouterOutlet, Navbar],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly showNavbar = signal(true);

  protected updateLayout(route: ActivatedRoute): void {
    this.showNavbar.set(route.snapshot.data['hideNavbar'] !== true);
  }
}
