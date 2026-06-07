import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../lib/api";

type NotificationBannerSettings = {
  enabled: boolean;
  messages: string[];
  scroll_enabled: boolean;
  link_url: string;
};

type NotificationBannerProps = {
  className?: string;
};

export function NotificationBanner({ className = "top-20" }: NotificationBannerProps) {
  const [settings, setSettings] = useState<NotificationBannerSettings | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    axios
      .get<NotificationBannerSettings>(`${API_URL}/api/v1/public/notification-banner`)
      .then((res) => {
        if (mounted) {
          setSettings(res.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load notification banner", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let idleTimer: number | undefined;
    const SHOW_AT_Y = 120;
    const IDLE_DELAY_MS = 650;

    const handleScroll = () => {
      setIsVisible(false);
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
      idleTimer = window.setTimeout(() => {
        if (window.scrollY <= SHOW_AT_Y) {
          setIsVisible(true);
        }
      }, IDLE_DELAY_MS);
    };

    // Initialize based on current scroll position
    setIsVisible(window.scrollY <= SHOW_AT_Y);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
    };
  }, []);

  const messages = settings?.messages?.map((message) => message.trim()).filter(Boolean) ?? [];
  const shouldScroll = Boolean(settings?.scroll_enabled && messages.length > 1);
  const linkUrl = settings?.link_url?.trim() ?? "";

  if (!settings?.enabled || messages.length === 0) {
    return null;
  }

  const staticMessage = messages.join(" • ");
  const scrollMessages = shouldScroll ? [...messages, ...messages] : messages;
  const bannerContent = (
    <div className="rounded-xl border border-red-900/40 bg-gradient-to-r from-red-950/60 via-zinc-950 to-zinc-950 px-4 py-3 flex items-center gap-3 shadow-lg">
      {shouldScroll ? (
        <div className="relative overflow-hidden flex-1">
          <div className="rr-banner-track inline-flex items-center gap-12 whitespace-nowrap">
            {scrollMessages.map((message, index) => (
              <span
                key={`${message}-${index}`}
                className="inline-flex items-center gap-6 text-sm md:text-base text-zinc-200 font-semibold tracking-wide"
                aria-hidden={index >= messages.length}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {message}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm md:text-base text-zinc-200 font-semibold tracking-wide">
          {staticMessage}
        </p>
      )}
    </div>
  );

  return (
    <div
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ease-out ${className} ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <style>{`
          @keyframes rr-banner-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .rr-banner-track {
            animation: rr-banner-scroll 40s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .rr-banner-track {
              animation: none;
            }
          }
        `}</style>
        {linkUrl ? (
          <a
            href={linkUrl}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl"
          >
            {bannerContent}
          </a>
        ) : (
          bannerContent
        )}
      </div>
    </div>
  );
}
