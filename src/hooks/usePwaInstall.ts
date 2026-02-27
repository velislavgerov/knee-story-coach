import { useCallback, useEffect, useMemo, useState } from 'react';

const IOS_HINT_KEY = 'knee-rehab-ios-install-hint-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHintDismissed, setIosHintDismissed] = useState<boolean>(() => {
    return localStorage.getItem(IOS_HINT_KEY) === '1';
  });

  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent), []);
  const isStandalone = useMemo(() => {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const canInstall = !!promptEvent;
  const showIosHint = !canInstall && isIos && !isStandalone && !iosHintDismissed;

  const install = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null);
  }, [promptEvent]);

  const dismissIosHint = useCallback(() => {
    setIosHintDismissed(true);
    localStorage.setItem(IOS_HINT_KEY, '1');
  }, []);

  return {
    canInstall,
    install,
    showIosHint,
    dismissIosHint,
    isIos,
    isStandalone,
  };
}
