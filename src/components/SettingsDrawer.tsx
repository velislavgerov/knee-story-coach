import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserSettings } from '@/data/routine';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { toLocalYmd } from '@/lib/progress';

interface SettingsDrawerProps {
  settings: UserSettings;
  onChange: (s: UserSettings) => void;
  progressStartDate: string;
  onSetProgramStartDate: (dateYmd: string) => void;
  onResetProgress: () => void;
  pwaInstallAvailable: boolean;
  onInstallApp: () => void;
  showIosInstallHint: boolean;
  onDismissIosInstallHint: () => void;
  wakeLockSupported: boolean;
  disabled?: boolean;
}

export default function SettingsDrawer({
  settings,
  onChange,
  progressStartDate,
  onSetProgramStartDate,
  onResetProgress,
  pwaInstallAvailable,
  onInstallApp,
  showIosInstallHint,
  onDismissIosInstallHint,
  wakeLockSupported,
  disabled,
}: SettingsDrawerProps) {
  const [startDateInput, setStartDateInput] = useState(progressStartDate || toLocalYmd());

  useEffect(() => {
    setStartDateInput(progressStartDate || toLocalYmd());
  }, [progressStartDate]);

  const handleResetProgress = () => {
    if (!confirm('Reset progress history? This cannot be undone.')) return;
    onResetProgress();
  };

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
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-foreground">Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-8">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Bike rest duration</Label>
            <div className="flex gap-2">
              {[20, 25, 30].map((val) => (
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

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Knee</Label>
            <div className="flex gap-2">
              {(['left', 'right'] as const).map((side) => (
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

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Sound effects</Label>
            <Switch checked={settings.soundOn} onCheckedChange={(v) => onChange({ ...settings, soundOn: v })} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Reduced motion</Label>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(v) => onChange({ ...settings, reducedMotion: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Auto-advance reps</Label>
            <Switch
              checked={settings.autoAdvanceReps}
              onCheckedChange={(v) => onChange({ ...settings, autoAdvanceReps: v })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Program start date</Label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm"
              />
              <button
                onClick={() => onSetProgramStartDate(startDateInput)}
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
              >
                Save
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleResetProgress}
              className="w-full py-2.5 rounded-lg bg-destructive/85 text-destructive-foreground text-sm"
            >
              Reset progress
            </button>
          </div>

          <div className="space-y-2">
            <Link
              to="/progress"
              className="block w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground text-center text-sm"
            >
              Open progress
            </Link>
          </div>

          {pwaInstallAvailable && (
            <button
              onClick={onInstallApp}
              className="w-full py-2.5 rounded-lg bg-primary/90 text-primary-foreground text-sm"
            >
              Install app
            </button>
          )}

          {showIosInstallHint && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground space-y-2">
              <p>Install on iPhone/iPad: Share -&gt; Add to Home Screen.</p>
              <button onClick={onDismissIosInstallHint} className="text-foreground underline">
                Dismiss
              </button>
            </div>
          )}

          {!wakeLockSupported && (
            <p className="text-xs text-muted-foreground">Keep screen awake: not supported on this device/browser.</p>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">All data stays in your browser. Nothing is sent to any server. 🔒</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
