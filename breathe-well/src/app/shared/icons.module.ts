import { NgModule } from '@angular/core';
import {
  LucideAngularModule,
  Sun, Moon, Zap, Target, Wind, Heart, Smile, Leaf, Brain, Waves,
  RefreshCw, Gauge, Mic, Sparkles, Smartphone, Expand, Layers, Eye,
  CheckCircle2, Timer, Activity
} from 'lucide-angular';

@NgModule({
  imports: [
    LucideAngularModule.pick({
      Sun, Moon, Zap, Target, Wind, Heart, Smile, Leaf, Brain, Waves,
      RefreshCw, Gauge, Mic, Sparkles, Smartphone, Expand, Layers, Eye,
      CheckCircle2, Timer, Activity
    })
  ],
  exports: [LucideAngularModule]
})
export class IconsModule {}
