import React from 'react';
import { Bot, Check } from 'lucide-react';

interface DiscordPreviewProps {
  botName?: string;
  botAvatar?: string;
  title: string;
  description: string;
  color?: string; // hex
  buttonLabel?: string;
  channelName?: string;
  footerText?: string;
}

export const DiscordPreview: React.FC<DiscordPreviewProps> = ({
  botName = 'Pawako Bot',
  botAvatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  title,
  description,
  color = '#6366f1',
  buttonLabel,
  channelName = '#formation',
  footerText = 'Pawako Formation • Système Officiel',
}) => {
  return (
    <div className="bg-[#313338] text-[#dbdee1] rounded-xl p-4 border border-[#1e1f22] font-sans text-xs space-y-3 shadow-xl select-none">
      {/* Header Channel context */}
      <div className="flex items-center justify-between text-[11px] text-[#949ba4] font-medium border-b border-[#2b2d31] pb-2">
        <span className="flex items-center gap-1 font-mono">
          <span className="text-[#80848e]">#</span>
          <span>{channelName.replace('#', '')}</span>
        </span>
        <span className="text-[10px] bg-[#2b2d31] px-2 py-0.5 rounded text-[#b5bac1]">Aperçu Discord</span>
      </div>

      {/* Message Row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img src={botAvatar} alt="Bot Avatar" className="w-10 h-10 rounded-full object-cover" />
          <div className="absolute -bottom-0.5 -right-0.5 bg-[#5865F2] text-white rounded-full p-0.5">
            <Bot className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-2">
          {/* Bot Name & Timestamp */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
              {botName}
            </span>
            <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 uppercase tracking-wider">
              <Check className="w-2.5 h-2.5" />
              <span>BOT</span>
            </span>
            <span className="text-[11px] text-[#949ba4]">Aujourd'hui à 14:32</span>
          </div>

          {/* Embed Container */}
          <div className="relative bg-[#2b2d31] rounded-lg p-3 max-w-lg border-l-4 shadow-sm" style={{ borderLeftColor: color || '#6366f1' }}>
            {/* Embed Title */}
            {title && (
              <h4 className="font-bold text-white text-sm mb-1.5 leading-snug">
                {title}
              </h4>
            )}

            {/* Embed Description */}
            {description && (
              <p className="text-[#dbdee1] text-xs leading-relaxed whitespace-pre-wrap">
                {description}
              </p>
            )}

            {/* Footer */}
            {footerText && (
              <div className="mt-3 pt-2 border-t border-[#35373c] text-[10px] text-[#949ba4] font-medium flex items-center justify-between">
                <span>{footerText}</span>
                <span>• Aujourd'hui</span>
              </div>
            )}
          </div>

          {/* Discord Component Button */}
          {buttonLabel && (
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-default"
              >
                <span>{buttonLabel}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
