import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { BreathingComponent } from './components/breathing/breathing.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'breathe', component: BreathingComponent },
  { path: '**', redirectTo: '' } 
];
