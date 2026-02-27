import { UserSettings } from '@/data/routine';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

interface SettingsDrawerProps {
  settings: UserSettings;
  onChange: (s: UserSettings) => void;
  disabled?: boolean;
}

export default function SettingsDrawer({ settings, onChange, disabled }: SettingsDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-2.5 rounded-xl glass-panel-light text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open settings"
          disabled={disabled}
        >
          <Settings className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-foreground">Settings</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Bike rest duration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Bike rest duration</Label>
            <div className="flex gap-2">
              {[20, 25, 30].map(val => (
                <button
                  key={val}
                  onClick={() => onChange({ ...settings, bikeRestSeconds: val })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    settings.bikeRestSeconds === val
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {val}s
                </button>
              ))}
            </div>
          </div>

          {/* Knee selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Knee</Label>
            <div className="flex gap-2">
              {(['left', 'right'] as const).map(side => (
                <button
                  key={side}
                  onClick={() => onChange({ ...settings, knee: side })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                    settings.knee === side
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Sound effects</Label>
            <Switch
              checked={settings.soundOn}
              onCheckedChange={(v) => onChange({ ...settings, soundOn: v })}
            />
          </div>

          {/* Reduced motion */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Reduced motion</Label>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(v) => onChange({ ...settings, reducedMotion: v })}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              All data stays in your browser. Nothing is sent to any server. 🔒
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
