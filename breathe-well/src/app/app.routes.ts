import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TechniqueDetailComponent } from './pages/technique-detail/technique-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Breathe Well' },
  { path: 'technique/:slug', component: TechniqueDetailComponent, title: 'Breathing Technique' },
  { path: '**', redirectTo: '' },
];
